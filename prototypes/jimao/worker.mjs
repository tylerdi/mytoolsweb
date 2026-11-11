import {validMetric} from './core.mjs';
const json=(v,status=200,headers={})=>Response.json(v,{status,headers:{'Cache-Control':'no-store',...headers}});
const schema='CREATE TABLE IF NOT EXISTS counts (day TEXT NOT NULL,event TEXT NOT NULL,difficulty TEXT NOT NULL,n INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(day,event,difficulty))';
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
 if(!env.DB)return json({error:'Metrics unavailable'},503);
 if(url.pathname==='/api/event'){
  if(request.method!=='POST')return json({error:'Method'},405);
  if(request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return json({error:'Origin'},403);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Type'},415);
  const text=await request.text();if(text.length>160)return json({error:'Size'},413);
  let data;try{data=JSON.parse(text)}catch{return json({error:'JSON'},400)}
  if(!validMetric(data))return json({error:'Event'},400);
  await env.DB.prepare(schema).run();
  await env.DB.prepare('INSERT INTO counts(day,event,difficulty,n) VALUES(?,?,?,1) ON CONFLICT(day,event,difficulty) DO UPDATE SET n=n+1').bind(new Date().toISOString().slice(0,10),data.event,data.difficulty).run();
  return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
 }
 if(url.pathname==='/api/stats'&&request.method==='GET'){
  await env.DB.prepare(schema).run();
  const {results}=await env.DB.prepare("SELECT day,event,difficulty,n FROM counts WHERE day>=date('now','-6 days') ORDER BY day DESC,event,difficulty").all();
  return json({timezone:'UTC',description:'Event counts; not unique people; includes testing',rows:results},200,{'Cache-Control':'public, max-age=60'});
 }
 return json({error:'Not found'},404);
}};
