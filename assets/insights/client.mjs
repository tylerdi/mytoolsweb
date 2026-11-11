import {ENDPOINT,validEvent,classifySource} from './core.mjs';
// No identifiers or raw URLs leave this module. Deduplication stays in sessionStorage.
export function createInsights(product,env=globalThis){
 const {location,navigator}=env,key=`insights:v1:${product}`;let fallback;
 const get=()=>{try{return JSON.parse(env.sessionStorage.getItem(key))||fallback}catch{return fallback}};
 const put=value=>{fallback=value;try{env.sessionStorage.setItem(key,JSON.stringify(value))}catch{}};
 const disabled=()=>{try{return JSON.parse(env.localStorage.getItem('insights:off'))===true||JSON.parse(env.localStorage.getItem('jimao:metrics-off'))===true}catch{return false}};
 function track(event,detail=''){
  if(location.protocol!=='https:'||!['tylerzhang.xyz','www.tylerzhang.xyz','temple.tylerzhang.xyz','jimao.tylerzhang.xyz'].includes(location.hostname)||location.pathname.startsWith('/prototypes/')||disabled()||['1','yes'].includes(navigator.doNotTrack)||navigator.globalPrivacyControl===true||new URL(location.href).searchParams.get('analytics')==='off')return;
  const now=Date.now(),day=new Date(now).toISOString().slice(0,10);let state=get();
  if(!state||state.day!==day||now-state.updated>1800000){state={day,source:classifySource(location.href,env.document.referrer)||'direct',updated:now,seen:[]}}
  state.updated=now;
  const send=(type,value)=>{
   const data={product,source:state.source,event:type,detail:value},id=type+':'+value;
   if(!validEvent(data)||state.seen.includes(id))return;
   state.seen.push(id);put(state);
   env.fetch(ENDPOINT+'/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),credentials:'omit',referrerPolicy:'no-referrer',keepalive:true}).catch(()=>{});
  };
  // Every conversion also has a visit, even when a session starts midway through a page.
  send('visit','');if(['interact','complete'].includes(event))send('start','');if(event!=='visit')send(event,'');if(detail)send(event,detail);put(state);
 }
 return track;
}
export function shareURL(value){const url=new URL(value);url.searchParams.set('utm_source','share');return url.href}
export function bindPrivacyControls(){
 const lang=document.documentElement.lang.split('-')[0],labels={zh:['关闭匿名统计','开启匿名统计','当前浏览器已关闭统计','仅保存公开汇总计数；尊重 DNT / GPC'],en:['Disable anonymous metrics','Enable anonymous metrics','Metrics disabled in this browser','Public aggregate counts only; DNT / GPC respected'],ja:['匿名集計をオフ','匿名集計をオン','このブラウザの集計はオフです','公開の集計のみ。DNT / GPC に対応'],ko:['익명 통계 끄기','익명 통계 켜기','이 브라우저의 통계가 꺼져 있어요','공개 집계만 저장하며 DNT / GPC를 존중해요']},l=labels[lang]||labels.en;
 const button=document.getElementById('metrics-toggle'),status=document.getElementById('metrics-status');if(!button)return;
 const isOff=()=>{try{return JSON.parse(localStorage.getItem('insights:off'))===true||JSON.parse(localStorage.getItem('jimao:metrics-off'))===true}catch{return false}};
 const render=()=>{button.textContent=l[isOff()?1:0];if(status)status.textContent=l[isOff()?2:3]};
 button.onclick=()=>{const off=!isOff();try{localStorage.setItem('insights:off',JSON.stringify(off));localStorage.setItem('jimao:metrics-off',JSON.stringify(off))}catch{}render()};window.addEventListener('storage',render);render();
}
