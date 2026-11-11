import {validEvent} from './core.mjs';
const origins={'https://tylerzhang.xyz':'route','https://www.tylerzhang.xyz':'route','https://temple.tylerzhang.xyz':'temple','https://jimao.tylerzhang.xyz':'jimao'};
const schema='CREATE TABLE IF NOT EXISTS insights_v1 (day TEXT NOT NULL,product TEXT NOT NULL,source TEXT NOT NULL,event TEXT NOT NULL,detail TEXT NOT NULL,n INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(day,product,source,event,detail))';
export async function insights(request,env){
 const url=new URL(request.url),origin=request.headers.get('Origin'),allowed=Object.hasOwn(origins,origin||'');
 const cors={'Access-Control-Allow-Origin':allowed?origin:'https://jimao.tylerzhang.xyz','Vary':'Origin','Cache-Control':'no-store'};
 const json=(body,status=200)=>Response.json(body,{status,headers:cors});
 if(url.pathname==='/api/insights/event'){
  if(!allowed)return json({error:'Origin'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...cors,'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'86400'}});
  if(request.method!=='POST')return json({error:'Method'},405);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Type'},415);
  const text=await request.text();if(text.length>256)return json({error:'Size'},413);
  let data;try{data=JSON.parse(text)}catch{return json({error:'JSON'},400)}
  if(!validEvent(data)||data.product!==origins[origin])return json({error:'Event'},400);
  if(!env.DB)return json({error:'Metrics unavailable'},503);
  await env.DB.prepare(schema).run();
  await env.DB.prepare('INSERT INTO insights_v1(day,product,source,event,detail,n) VALUES(?,?,?,?,?,1) ON CONFLICT(day,product,source,event,detail) DO UPDATE SET n=n+1').bind(new Date().toISOString().slice(0,10),data.product,data.source,data.event,data.detail).run();
  return new Response(null,{status:204,headers:cors});
 }
 if(url.pathname==='/api/insights/stats'&&request.method==='GET'){
  const days=Number(url.searchParams.get('days')||7);if(![7,14,30].includes(days))return json({error:'Days'},400);
  if(!env.DB)return json({error:'Metrics unavailable'},503);
  await env.DB.prepare(schema).run();
  const {results}=await env.DB.prepare("SELECT day,product,source,event,detail,n FROM insights_v1 WHERE day>=date('now',?) ORDER BY day,product,source,event,detail").bind(`-${days-1} days`).all();
  return json({version:1,timezone:'UTC',days,asOf:new Date().toISOString(),description:'Session event counts, not people. Public aggregates. QA is a separate source. No pre-launch backfill.',rows:results});
 }
 return json({error:'Not found'},404);
}
