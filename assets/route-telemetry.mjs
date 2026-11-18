import {classifySource} from './insights/core.mjs';
import {validRouteMetric} from './route-metrics-core.mjs';
export function createRouteTelemetry(game,env=globalThis){
 const key='route:diagnostics:v1';let fallback,current;
 const get=()=>{try{return JSON.parse(env.sessionStorage.getItem(key))||fallback;}catch{return fallback;}};
 const put=s=>{fallback=s;try{env.sessionStorage.setItem(key,JSON.stringify(s));}catch{}};
 function send(event,reason=''){
  if(!current)return;
  try{if(JSON.parse(env.localStorage.getItem('insights:off'))===true||JSON.parse(env.localStorage.getItem('jimao:metrics-off'))===true)return;}catch{}
  if(env.location.protocol!=='https:'||!['tylerzhang.xyz','www.tylerzhang.xyz'].includes(env.location.hostname)||env.location.pathname.startsWith('/prototypes/')||['1','yes'].includes(env.navigator.doNotTrack)||env.navigator.globalPrivacyControl===true||new URL(env.location.href).searchParams.get('analytics')==='off')return;
  const now=Date.now(),day=new Date(now).toISOString().slice(0,10);let state=get();
  if(!state||!Array.isArray(state.seen)||!Number.isFinite(state.updated)||state.day!==day||now-state.updated>1800000)state={day,updated:now,source:classifySource(env.location.href,env.document.referrer)||'direct',seen:[]};
  const data={game,...current,source:state.source,event,reason},id=JSON.stringify([game,current.mode,current.level,event,reason]);
  if(!validRouteMetric(data)||state.seen.includes(id))return;
  state.updated=now;state.seen.push(id);put(state);
  env.fetch('/api/route-metrics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),keepalive:true,credentials:'omit',referrerPolicy:'no-referrer'}).catch(()=>{});
 }
 return {load(mode,level,grade){current={mode,level:mode==='practice'?level:mode==='daily'?({'简单':1,'标准':2,'困难':3}[grade]||0):0};send('enter');},send};
}
