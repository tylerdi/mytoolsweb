/**
 * 小鱼儿 文字转语音工具 🐟🔊
 * 基于 MIMO TTS（小米大模型）
 * 用法：<div id="fish-tts-tool"></div><script src="/fish-tts-tool.js"></script>
 */
(function(){
'use strict';

const TTS_API = '/api/tts';
const MAX_CHARS = 2000;

const PRESETS = [
  { name: '🌙 静夜思', text: '床前明月光，疑是地上霜。举头望明月，低头思故乡。' },
  { name: '🔥 绕口令', text: '八百标兵奔北坡，炮兵并排北边跑。炮兵怕把标兵碰，标兵怕碰炮兵炮。' },
  { name: '📰 新闻稿', text: '观众朋友们大家好，欢迎收看今天的新闻节目。首先来看国内消息，我国科技创新取得重大突破，多项关键技术实现自主可控。' },
  { name: '🌤️ 天气预报', text: '各位观众朋友，今天白天晴转多云，气温15到25度，东南风3到4级。明天将有小雨，请大家出门记得带伞。' },
  { name: '📖 故事开头', text: '从前有座山，山里有座庙，庙里有个老和尚在给小和尚讲故事。讲的是什么呢？' },
  { name: '💪 励志', text: '每一个不曾起舞的日子，都是对生命的辜负。勇敢地追逐梦想，因为你值得拥有更好的未来。' },
];

class FishTtsTool {
  constructor(){
    this.el = document.getElementById('fish-tts-tool');
    if(!this.el) return;
    this.playing = false;
    this.audio = null;
    this.history = JSON.parse(localStorage.getItem('fish_tts_history')||'[]');
    this.render();
  }

  render(){
    this.el.innerHTML = `
    <style>
      .tt-wrap{background:var(--surface,#111);border:1px solid var(--border,#1e1e1e);border-radius:16px;padding:20px;font-family:'LXGW WenKai',-apple-system,sans-serif;width:100%;margin:0 auto}
      .tt-title{font-size:1rem;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px}
      .tt-title .badge{font-size:.6rem;background:rgba(34,197,94,.15);color:#22c55e;padding:2px 8px;border-radius:6px}
      .tt-textarea{width:100%;min-height:120px;background:#0a0a0a;border:1px solid #2a2a2a;border-radius:12px;padding:14px;color:#e8e8e8;font-size:.9rem;font-family:inherit;outline:none;resize:vertical;transition:border-color .2s}
      .tt-textarea:focus{border-color:#22c55e}
      .tt-counter{text-align:right;font-size:.7rem;color:#555;margin-top:4px}
      .tt-counter.over{color:#ff6b9d}
      .tt-presets{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}
      .tt-preset-btn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:5px 12px;font-size:.7rem;color:#aaa;cursor:pointer;transition:all .2s;font-family:inherit}
      .tt-preset-btn:hover{background:rgba(34,197,94,.15);border-color:#22c55e;color:#22c55e}
      .tt-controls{display:flex;gap:10px;align-items:center;margin-top:14px;flex-wrap:wrap}
      .tt-play-btn{flex:1;min-width:140px;padding:12px 20px;border-radius:12px;border:none;font-size:.9rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .25s;display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#22c55e,#06b6d4);color:#fff;box-shadow:0 4px 15px rgba(34,197,94,.3)}
      .tt-play-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(34,197,94,.4)}
      .tt-play-btn:active{transform:scale(.97)}
      .tt-play-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
      .tt-play-btn.playing{background:linear-gradient(135deg,#ff6b9d,#f59e0b);box-shadow:0 4px 15px rgba(255,107,157,.3);animation:tt-pulse 1.5s ease-in-out infinite}
      @keyframes tt-pulse{0%,100%{box-shadow:0 4px 15px rgba(255,107,157,.3)}50%{box-shadow:0 4px 25px rgba(255,107,157,.5)}}
      .tt-stop-btn{padding:12px 18px;border-radius:12px;border:1px solid #2a2a2a;background:#0a0a0a;color:#aaa;font-size:.85rem;cursor:pointer;font-family:inherit;transition:all .2s}
      .tt-stop-btn:hover{border-color:#ff6b9d;color:#ff6b9d}
      .tt-dl-btn{padding:12px 18px;border-radius:12px;border:1px solid #2a2a2a;background:#0a0a0a;color:#aaa;font-size:.85rem;cursor:pointer;font-family:inherit;transition:all .2s}
      .tt-dl-btn:hover{border-color:#646cff;color:#646cff}
      .tt-wave-wrap{margin-top:16px;height:60px;background:#0a0a0a;border-radius:12px;overflow:hidden;position:relative;display:none}
      .tt-wave-wrap.show{display:block}
      .tt-wave-canvas{width:100%;height:100%}
      .tt-status{text-align:center;font-size:.75rem;color:#555;margin-top:10px;min-height:20px}
      .tt-status.error{color:#ff6b9d}
      .tt-history{margin-top:16px;border-top:1px solid var(--border,#1e1e1e);padding-top:12px}
      .tt-history h4{font-size:.75rem;color:#666;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between}
      .tt-history h4 button{background:none;border:none;color:#555;font-size:.7rem;cursor:pointer;font-family:inherit}
      .tt-history h4 button:hover{color:#ff6b9d}
      .tt-hist-list{display:flex;flex-direction:column;gap:6px;max-height:200px;overflow-y:auto}
      .tt-hist-item{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:10px 12px;cursor:pointer;transition:all .2s}
      .tt-hist-item:hover{border-color:#22c55e;background:rgba(34,197,94,.05)}
      .tt-hist-item .tt-hist-play{width:32px;height:32px;border-radius:50%;background:rgba(34,197,94,.15);border:none;color:#22c55e;font-size:.8rem;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center}
      .tt-hist-item .tt-hist-text{flex:1;font-size:.75rem;color:#aaa;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .tt-hist-item .tt-hist-time{font-size:.6rem;color:#444;flex-shrink:0}
      .tt-hist-item .tt-hist-dl{background:none;border:none;color:#555;font-size:.8rem;cursor:pointer;flex-shrink:0}
      .tt-hist-item .tt-hist-dl:hover{color:#646cff}
      .tt-loading{display:inline-flex;align-items:center;gap:6px}
      .tt-loading .tt-dot{width:6px;height:6px;border-radius:50%;background:#22c55e;animation:tt-bounce .6s ease-in-out infinite}
      .tt-loading .tt-dot:nth-child(2){animation-delay:.15s}
      .tt-loading .tt-dot:nth-child(3){animation-delay:.3s}
      @keyframes tt-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
      @media(max-width:768px){
        .tt-controls{flex-direction:column}
        .tt-play-btn,.tt-stop-btn,.tt-dl-btn{width:100%}
        .tt-presets{gap:4px}
        .tt-preset-btn{padding:6px 10px;font-size:.75rem}
      }
    </style>
    <div class="tt-wrap">
      <div class="tt-title">🔊 文字转语音 <span class="badge">MIMO TTS · 免费</span></div>
      <textarea class="tt-textarea" placeholder="输入要朗读的文字..." maxlength="${MAX_CHARS}" oninput="window.__ttsTool.updateCounter()"></textarea>
      <div class="tt-counter"><span id="tt-count">0</span> / ${MAX_CHARS}</div>
      <div class="tt-presets">
        ${PRESETS.map(p=>`<button class="tt-preset-btn" onclick="window.__ttsTool.usePreset('${p.text.replace(/'/g,"\\'")}')">${p.name}</button>`).join('')}
      </div>
      <div class="tt-controls">
        <button class="tt-play-btn" id="tt-play-btn" onclick="window.__ttsTool.play()">
          ▶️ 朗读
        </button>
        <button class="tt-stop-btn" onclick="window.__ttsTool.stop()">⏹ 停止</button>
        <button class="tt-dl-btn" onclick="window.__ttsTool.download()">💾 下载MP3</button>
      </div>
      <div class="tt-wave-wrap" id="tt-wave-wrap">
        <canvas class="tt-wave-canvas" id="tt-wave-canvas"></canvas>
      </div>
      <div class="tt-status" id="tt-status"></div>
      <div class="tt-history">
        <h4>📜 历史记录 <button onclick="window.__ttsTool.clearHistory()">清空</button></h4>
        <div class="tt-hist-list" id="tt-hist-list"></div>
      </div>
    </div>`;

    window.__ttsTool = this;
    this.renderHistory();
    this._initWaveCanvas();
  }

  _initWaveCanvas(){
    const canvas = document.getElementById('tt-wave-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = 120;
    this._drawIdleWave(ctx, canvas.width, canvas.height);
  }

  _drawIdleWave(ctx, w, h){
    ctx.clearRect(0,0,w,h);
    const bars = 60;
    const barW = w / bars;
    for(let i=0;i<bars;i++){
      const x = i * barW + barW/2;
      const barH = 8 + Math.sin(i*0.3)*4;
      ctx.fillStyle = 'rgba(34,197,94,0.2)';
      ctx.fillRect(x-barW/2+1, h/2-barH/2, barW-2, barH);
    }
  }

  _animateWave(active){
    const canvas = document.getElementById('tt-wave-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    let frame = 0;
    const draw = ()=>{
      if(!this.playing) {
        this._drawIdleWave(ctx, w, h);
        return;
      }
      ctx.clearRect(0,0,w,h);
      const bars = 60;
      const barW = w / bars;
      for(let i=0;i<bars;i++){
        const x = i * barW + barW/2;
        const barH = active
          ? 10 + Math.random() * (h*0.6) * Math.abs(Math.sin(frame*0.05 + i*0.2))
          : 8 + Math.sin(i*0.3)*4;
        const alpha = active ? 0.4 + Math.random()*0.4 : 0.2;
        const hue = 140 + Math.sin(frame*0.03+i*0.15)*20;
        ctx.fillStyle = `hsla(${hue},80%,55%,${alpha})`;
        ctx.fillRect(x-barW/2+1, h/2-barH/2, barW-2, barH);
      }
      frame++;
      requestAnimationFrame(draw);
    };
    draw();
  }

  updateCounter(){
    const ta = this.el.querySelector('.tt-textarea');
    const c = document.getElementById('tt-count');
    if(!ta||!c) return;
    c.textContent = ta.value.length;
    c.parentElement.classList.toggle('over', ta.value.length > MAX_CHARS);
  }

  usePreset(text){
    const ta = this.el.querySelector('.tt-textarea');
    if(ta){ ta.value = text; this.updateCounter(); }
  }

  async play(){
    const ta = this.el.querySelector('.tt-textarea');
    const text = ta?.value?.trim();
    if(!text){ this._showStatus('请先输入文字','error'); return; }
    if(this.playing) return;

    this.playing = true;
    this._showStatus('<span class="tt-loading"><span class="tt-dot"></span><span class="tt-dot"></span><span class="tt-dot"></span> 正在生成语音...</span>');
    const btn = document.getElementById('tt-play-btn');
    if(btn){ btn.classList.add('playing'); btn.innerHTML = '⏳ 生成中...'; btn.disabled = true; }

    try {
      const resp = await fetch(TTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
      });

      if(!resp.ok) throw new Error(`API返回 ${resp.status}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);

      if(this.audio){ this.audio.pause(); URL.revokeObjectURL(this.audio.src); }
      this.audio = new Audio(url);
      this._lastBlob = blob;
      this._lastUrl = url;

      document.getElementById('tt-wave-wrap')?.classList.add('show');
      if(btn){ btn.classList.remove('playing'); btn.innerHTML = '🔊 播放中...'; }
      this._showStatus('🔊 正在播放...');
      this._animateWave(true);

      this.audio.onended = ()=>{
        this.playing = false;
        if(btn){ btn.classList.remove('playing'); btn.innerHTML = '▶️ 朗读'; btn.disabled = false; }
        this._showStatus('✅ 播放完成');
        this._addHistory(text, url);
      };
      this.audio.onerror = ()=>{
        this.playing = false;
        if(btn){ btn.classList.remove('playing'); btn.innerHTML = '▶️ 朗读'; btn.disabled = false; }
        this._showStatus('播放失败','error');
      };
      this.audio.play();
    } catch(e) {
      this.playing = false;
      if(btn){ btn.classList.remove('playing'); btn.innerHTML = '▶️ 朗读'; btn.disabled = false; }
      this._showStatus('生成失败: '+e.message,'error');
    }
  }

  stop(){
    if(this.audio){ this.audio.pause(); this.audio.currentTime = 0; }
    this.playing = false;
    const btn = document.getElementById('tt-play-btn');
    if(btn){ btn.classList.remove('playing'); btn.innerHTML = '▶️ 朗读'; btn.disabled = false; }
    document.getElementById('tt-wave-wrap')?.classList.remove('show');
    this._showStatus('已停止');
  }

  async download(){
    const ta = this.el.querySelector('.tt-textarea');
    const text = ta?.value?.trim();
    if(!text){ this._showStatus('请先输入文字','error'); return; }
    this._showStatus('正在生成下载文件...');
    try {
      const resp = await fetch(TTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
      });
      if(!resp.ok) throw new Error(`API返回 ${resp.status}`);
      const blob = await resp.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `fish-tts-${text.slice(0,10).replace(/\s/g,'_')}.mp3`;
      a.click();
      URL.revokeObjectURL(a.href);
      this._showStatus('✅ 下载已开始');
    } catch(e) {
      this._showStatus('下载失败: '+e.message,'error');
    }
  }

  _showStatus(msg, type){
    const el = document.getElementById('tt-status');
    if(!el) return;
    el.innerHTML = msg;
    el.className = 'tt-status' + (type==='error'?' error':'');
  }

  _addHistory(text, url){
    const item = { text: text.slice(0,100), time: Date.now(), url };
    this.history.unshift(item);
    if(this.history.length > 10) this.history.pop();
    localStorage.setItem('fish_tts_history', JSON.stringify(this.history));
    this.renderHistory();
  }

  renderHistory(){
    const el = document.getElementById('tt-hist-list');
    if(!el||!this.history.length) { if(el) el.innerHTML='<div style="text-align:center;color:#444;font-size:.7rem;padding:8px">暂无记录</div>'; return; }
    el.innerHTML = this.history.map((h,i)=>{
      const t = new Date(h.time);
      const ts = `${t.getMonth()+1}/${t.getDate()} ${t.getHours()}:${String(t.getMinutes()).padStart(2,'0')}`;
      return `<div class="tt-hist-item">
        <button class="tt-hist-play" onclick="window.__ttsTool.playHistory(${i})">▶</button>
        <span class="tt-hist-text">${h.text}</span>
        <span class="tt-hist-time">${ts}</span>
      </div>`;
    }).join('');
  }

  playHistory(i){
    const h = this.history[i];
    if(!h) return;
    if(this.audio) this.audio.pause();
    this.audio = new Audio(h.url);
    this.playing = true;
    document.getElementById('tt-wave-wrap')?.classList.add('show');
    this._animateWave(true);
    this._showStatus('🔊 播放历史记录...');
    const btn = document.getElementById('tt-play-btn');
    if(btn){ btn.classList.add('playing'); btn.innerHTML = '🔊 播放中...'; }
    this.audio.onended = ()=>{
      this.playing = false;
      if(btn){ btn.classList.remove('playing'); btn.innerHTML = '▶️ 朗读'; }
      this._showStatus('✅ 播放完成');
    };
    this.audio.play();
  }

  clearHistory(){
    this.history = [];
    localStorage.removeItem('fish_tts_history');
    this.renderHistory();
  }
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>new FishTtsTool());
else new FishTtsTool();
})();
