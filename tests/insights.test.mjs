import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createInsights,shareURL} from '../assets/insights/client.mjs';
import {classifySource,summarize,validEvent} from '../assets/insights/core.mjs';
import {insights} from '../assets/insights/worker.mjs';
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)}};
function browser(){const calls=[];return {calls,location:new URL('https://temple.tylerzhang.xyz/zh/?utm_source=ai6666'),document:{referrer:''},navigator:{},sessionStorage:storage(),localStorage:storage(),fetch:async(url,options)=>{calls.push({url,options});return new Response(null,{status:204})}}}
test('source classification sends only limited categories and preserves share URL content',()=>{
 for(const [href,ref,want] of [['https://temple.tylerzhang.xyz/?utm_source=ai6666','','ai6666'],['https://temple.tylerzhang.xyz/','https://ai6666.com/store/x','ai6666'],['https://tylerzhang.xyz/','https://www.google.com/search?q=private','search'],['https://tylerzhang.xyz/?utm_source=private+text','','other'],['https://tylerzhang.xyz/','','direct']])assert.equal(classifySource(href,ref),want);
 const url=new URL(shareURL('https://tylerzhang.xyz/twins/create/?p=abc#play'));assert.equal(url.searchParams.get('p'),'abc');assert.equal(url.searchParams.get('utm_source'),'share');assert.equal(url.hash,'#play');
 assert.equal(validEvent({product:'temple',source:'direct',event:'interact',detail:'private text'}),false);
});
test('session dedup survives reload, keeps first source, and honors opt-out changed in another tab',()=>{
 const env=browser(),track=createInsights('temple',env);track('visit');track('start','enter');for(let i=0;i<50;i++)track('interact','beads');
 assert.equal(env.calls.length,5);assert.equal(env.calls.filter(c=>JSON.parse(c.options.body).event==='interact').length,2);
 env.location.href='https://temple.tylerzhang.xyz/en/';const reload=createInsights('temple',env);reload('visit');reload('interact','bell');assert.equal(env.calls.length,6);assert.equal(JSON.parse(env.calls.at(-1).options.body).source,'ai6666');
 env.localStorage.setItem('insights:off','true');reload('complete','sit_1min');assert.equal(env.calls.length,6);
 env.localStorage.setItem('insights:off','false');env.navigator.globalPrivacyControl=true;reload('share','copy');assert.equal(env.calls.length,6);
 env.navigator.globalPrivacyControl=false;env.navigator.doNotTrack='1';reload('share','native');assert.equal(env.calls.length,6);
 for(const call of env.calls){assert.equal(call.options.credentials,'omit');assert.equal(call.options.referrerPolicy,'no-referrer');assert.deepEqual(Object.keys(JSON.parse(call.options.body)).sort(),['detail','event','product','source'])}
});
test('stale session restarts, failed storage does not break play, local previews send nothing',()=>{
 const env=browser(),track=createInsights('temple',env);track('visit');const key='insights:v1:temple',state=JSON.parse(env.sessionStorage.getItem(key));state.updated=Date.now()-1800001;env.sessionStorage.setItem(key,JSON.stringify(state));track('start','enter');assert.equal(env.calls.filter(c=>JSON.parse(c.options.body).event==='visit').length,2);
 env.sessionStorage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};const blocked=createInsights('temple',env);blocked('interact','wood');blocked('interact','wood');const len=env.calls.length;env.location.href='http://localhost:8798/';blocked('share','copy');assert.equal(env.calls.length,len);
});
test('all three origins write isolated aggregate columns; invalid origins, details and date ranges are rejected',async()=>{
 const db=new DatabaseSync(':memory:'),env={DB:{prepare(sql){return {args:[],bind(...args){this.args=args;return this},async run(){db.prepare(sql).run(...this.args);return {}},async all(){return {results:db.prepare(sql).all(...this.args)}}}}}};
 const request=(origin,product,extra={})=>new Request('https://jimao.tylerzhang.xyz/api/insights/event',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({product,source:'qa',event:'visit',detail:'',...extra})});
 try{
  for(const [origin,product] of [['https://www.tylerzhang.xyz','route'],['https://temple.tylerzhang.xyz','temple'],['https://jimao.tylerzhang.xyz','jimao']]){const res=await insights(request(origin,product),env);assert.equal(res.status,204);assert.equal(res.headers.get('Access-Control-Allow-Origin'),origin)}
  assert.equal((await insights(request('https://evil.example','jimao'),env)).status,403);
  assert.equal((await insights(request('https://temple.tylerzhang.xyz','jimao'),env)).status,400);
  assert.equal((await insights(request('https://temple.tylerzhang.xyz','temple',{email:'private'}),env)).status,400);
  assert.equal((await insights(new Request('https://jimao.tylerzhang.xyz/api/insights/stats?days=999'),env)).status,400);
  const preflight=await insights(new Request('https://jimao.tylerzhang.xyz/api/insights/event',{method:'OPTIONS',headers:{Origin:'https://temple.tylerzhang.xyz'}}),env);assert.equal(preflight.status,204);
  const response=await insights(new Request('https://jimao.tylerzhang.xyz/api/insights/stats?days=30',{headers:{Origin:'https://www.tylerzhang.xyz'}}),env),data=await response.json();assert.equal(data.rows.length,3);assert.deepEqual(Object.keys(data.rows[0]).sort(),['day','detail','event','n','product','source']);assert.equal(summarize(data.rows).totals.visit,0);assert.equal(summarize(data.rows,'all','qa').totals.visit,3);
  const rows=[{product:'temple',source:'ai6666',event:'interact',detail:'',n:2},{product:'temple',source:'ai6666',event:'interact',detail:'bell',n:2},{product:'temple',source:'direct',event:'visit',detail:'',n:5}];assert.equal(summarize(rows,'temple','ai6666').totals.interact,2);assert.equal(summarize(rows,'temple','ai6666').totals.visit,0);
 }finally{db.close()}
});
