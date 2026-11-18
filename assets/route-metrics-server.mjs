import {validRouteMetric} from './route-metrics-core.mjs';
const schema=`CREATE TABLE IF NOT EXISTS route_metrics_v1(day TEXT NOT NULL,source TEXT NOT NULL,game TEXT NOT NULL,mode TEXT NOT NULL,level INTEGER NOT NULL,event TEXT NOT NULL,reason TEXT NOT NULL,n INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(day,source,game,mode,level,event,reason))`;
export async function routeMetrics(request,env){
 const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}});
 if(!env.FEEDBACK_DB)return json({error:'关卡统计服务暂不可用'},503);
 const db=env.FEEDBACK_DB;
 try{
  if(request.method==='GET'){
   const days=Number(new URL(request.url).searchParams.get('days')||7);if(![7,14,30].includes(days))return json({error:'Days'},400);
   await db.prepare(schema).run();const {results}=await db.prepare("SELECT day,source,game,mode,level,event,reason,n FROM route_metrics_v1 WHERE day>=date('now',?) ORDER BY day,game,mode,level").bind(`-${days-1} days`).all();
   return json({version:1,asOf:new Date().toISOString(),rows:results,description:'Per-tab, per-level event counts. Leave includes backgrounding. Not people or attempts. Collection starts 2026-11-18.'});
  }
  if(request.method!=='POST')return json({error:'Method'},405);
  const origin=request.headers.get('Origin');if(!['https://tylerzhang.xyz','https://www.tylerzhang.xyz',...(new URL(request.url).hostname==='localhost'?['http://localhost:8799']:[])].includes(origin))return json({error:'Origin'},403);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Type'},415);
  const reader=request.body?.getReader();if(!reader)return json({error:'Body'},400);let size=0,parts=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>512){await reader.cancel();return json({error:'Size'},413);}parts.push(value);}
  let data;try{data=JSON.parse(await new Blob(parts).text());}catch{return json({error:'JSON'},400);}
  if(!validRouteMetric(data))return json({error:'Event'},400);
  await db.prepare(schema).run();await db.prepare('INSERT INTO route_metrics_v1(day,source,game,mode,level,event,reason,n) VALUES(?,?,?,?,?,?,?,1) ON CONFLICT(day,source,game,mode,level,event,reason) DO UPDATE SET n=n+1').bind(new Date().toISOString().slice(0,10),data.source,data.game,data.mode,data.level,data.event,data.reason).run();
  return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
 }catch{return json({error:'关卡统计暂时无法读取或保存'},503);}
}
