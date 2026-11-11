import {createInsights,shareURL} from './insights/client.mjs';
export {shareURL};
const events = new Set([
  'open', 'return_next_day', 'tutorial_start', 'tutorial_complete',
  'daily_start', 'daily_complete', 'practice_start', 'practice_complete', 'share',
]);

function analyticsDayKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function createGameTelemetry(game) {
  const insights=createInsights('route');insights('visit');
  const live = ['tylerzhang.xyz', 'www.tylerzhang.xyz'].includes(location.hostname)
    && !location.pathname.startsWith('/prototypes/')
    && navigator.globalPrivacyControl !== true && !['1', 'yes'].includes(navigator.doNotTrack);
  const today = analyticsDayKey();

  function track(event) {
    if(event.endsWith('_start'))insights('start',`${game}_${event.replace('_start','')}`);
    else if(event.endsWith('_complete'))insights(event==='tutorial_complete'?'interact':'complete',`${game}_${event.replace('_complete','')}`);
    else if(event==='share')insights('share',`${game}_link`);
    else if(event==='move')insights('interact',`${game}_move`);
    try{if(JSON.parse(localStorage.getItem('insights:off'))===true)return}catch{}
    if (!live || !events.has(event)) return;
    const key = `daily-games:event:${game}:${today}:${event}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch { /* Games remain playable if storage is unavailable. */ }
    fetch('/api/stats', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'game', game, event }), keepalive: true,
    }).catch(() => {});
  }

  track('open');
  if (live) {
    const key = `daily-games:last-visit:${game}`;
    try {
      const previous = localStorage.getItem(key);
      const yesterday = new Date(Date.parse(`${today}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);
      if (previous === yesterday) track('return_next_day');
      localStorage.setItem(key, today);
    } catch { /* No cross-day count without local storage. */ }
  }
  return track;
}

export function showGameShare({title,text,url,onShared}) {
  const sheet=document.createElement('dialog');sheet.className='finish-dialog';sheet.setAttribute('aria-label','分享'+title);
  const heading=document.createElement('h2');heading.textContent='分享'+title;
  const note=document.createElement('p');note.setAttribute('role','status');note.textContent='复制文案发给朋友。链接保留当前玩法，不包含地图答案。';
  const area=document.createElement('textarea');area.readOnly=true;area.value=`${title}\n${text}\n${url}`;area.setAttribute('aria-label','分享文案');area.style.cssText='display:block;width:100%;min-height:140px;padding:12px;margin:15px 0;border:1px solid #9bb6ad;border-radius:8px;background:white;color:#24463f;font:14px/1.7 sans-serif';
  const actions=document.createElement('div');actions.className='modal-actions';
  const button=(label,callback)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',callback);actions.append(b);return b};
  button('复制文案',async()=>{area.select();try{await Promise.race([navigator.clipboard.writeText(area.value),new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout')),1200))]);note.textContent='已复制，可以粘贴给朋友。';onShared()}catch{note.textContent='文案已选中，请按 Ctrl/Cmd+C 或长按复制。'}}).className='primary';
  if(navigator.share)button('系统分享',async()=>{try{await navigator.share({title,text,url});note.textContent='系统分享已完成。';onShared()}catch(error){if(error?.name!=='AbortError')note.textContent='系统分享不可用，请复制文案。'}});
  button('关闭',()=>sheet.close());sheet.append(heading,note,area,actions);document.body.append(sheet);sheet.addEventListener('close',()=>sheet.remove());sheet.addEventListener('keydown',event=>event.stopPropagation());sheet.showModal();area.focus();area.select();
}
