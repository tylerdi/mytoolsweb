import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createRouteTelemetry} from '../assets/route-telemetry.mjs';
import {routeMetrics} from '../assets/route-metrics-server.mjs';
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};};
const browser=()=>({calls:[],location:new URL('https://www.tylerzhang.xyz/?utm_source=qa'),navigator:{},document:{referrer:''},sessionStorage:storage(),localStorage:storage(),fetch(url,options){this.calls.push(JSON.parse(options.body));return Promise.resolve({});}});
test('per-level events remain finite, deduped across reloads and respect every privacy switch',()=>{
 const env=browser(),t=createRouteTelemetry('route',env);t.load('practice',8);t.send('start');t.send('start');t.send('invalid','current');t.send('invalid','current');t.send('hint');t.send('complete');assert.equal(env.calls.length,5);
 const reload=createRouteTelemetry('route',env);reload.load('practice',8);reload.send('complete');assert.equal(env.calls.length,5);
 reload.load('practice',9);reload.send('start');assert.equal(env.calls.length,7);
 for(const c of env.calls){assert.equal(c.source,'qa');assert.deepEqual(Object.keys(c).sort(),['event','game','level','mode','reason','source']);}
 env.localStorage.setItem('insights:off','true');reload.send('hint');assert.equal(env.calls.length,7);
 env.localStorage.setItem('insights:off','false');env.navigator.doNotTrack='1';reload.send('hint');assert.equal(env.calls.length,7);env.navigator.doNotTrack='0';env.navigator.globalPrivacyControl=true;reload.send('hint');assert.equal(env.calls.length,7);
 env.navigator.globalPrivacyControl=false;env.location.href='https://www.tylerzhang.xyz/?analytics=off';reload.send('hint');assert.equal(env.calls.length,7);
 env.location.href='https://www.tylerzhang.xyz/';reload.load('daily',0,'困难');assert.equal(env.calls.at(-1).level,3);
});
test('server stores only scoped aggregate events; arbitrary levels, routes, reasons and payloads are rejected',async()=>{
 const sql=new DatabaseSync(':memory:');const env={FEEDBACK_DB:{prepare(query){let args=[];return {bind(...v){args=v;return this;},async run(){return sql.prepare(query).run(...args);},async all(){return {results:sql.prepare(query).all(...args)};}};}}};
 const event={game:'route',mode:'practice',level:8,event:'invalid',reason:'current',source:'qa'};
 const request=value=>new Request('https://www.tylerzhang.xyz/api/route-metrics',{method:'POST',headers:{Origin:'https://www.tylerzhang.xyz','Content-Type':'application/json'},body:JSON.stringify(value)});
 try{
  assert.equal((await routeMetrics(request(event),env)).status,204);
  for(const bad of [{...event,level:99},{...event,path:[1,2]},{...event,reason:'private message'}])assert.equal((await routeMetrics(request(bad),env)).status,400);
  const data=await (await routeMetrics(new Request('https://www.tylerzhang.xyz/api/route-metrics?days=7'),env)).json();assert.equal(data.rows.length,1);assert.equal(data.rows[0].n,1);assert.equal(data.rows[0].reason,'current');
  assert.equal((await routeMetrics(new Request('https://www.tylerzhang.xyz/api/route-metrics?days=99'),env)).status,400);
  assert.equal((await routeMetrics(request(event),{})).status,503);
 }finally{sql.close();}
});

test('blocked or corrupted browser storage never prevents gameplay or deduplication',()=>{
 const env=browser();env.sessionStorage.setItem('route:diagnostics:v1',JSON.stringify({day:new Date().toISOString().slice(0,10),updated:Date.now()}));
 const t=createRouteTelemetry('twins',env);assert.doesNotThrow(()=>t.load('practice',1));
 env.sessionStorage={getItem(){throw Error('disabled');},setItem(){throw Error('disabled');}};const off=createRouteTelemetry('route',env);off.load('practice',1);off.send('start');off.send('start');assert.equal(env.calls.filter(c=>c.game==='route'&&c.event==='start').length,1);
});
