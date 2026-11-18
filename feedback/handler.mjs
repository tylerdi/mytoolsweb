const schema = `CREATE TABLE IF NOT EXISTS route_feedback (
 id TEXT PRIMARY KEY, created_at TEXT NOT NULL DEFAULT (datetime('now')),
 game TEXT NOT NULL, level TEXT NOT NULL, category TEXT NOT NULL,
 steps TEXT NOT NULL, result TEXT NOT NULL, device TEXT NOT NULL)`;
const games = ['每日航线','潮汐双船','精选文章试走'];
const categories = ['操作或显示问题','关卡或规则问题','太简单','太难','玩法建议'];
export async function handleFeedback(request, env) {
 const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','Allow':'POST'}});
 if(request.method!=='POST')return reply({error:'仅接受提交，不提供公开读取。'},405);
 const origin=request.headers.get('Origin');
 if(origin!==new URL(request.url).origin)return reply({error:'请从本站反馈页面提交。'},403);
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply({error:'提交格式错误。'},415);
 if(Number(request.headers.get('Content-Length'))>10000)return reply({error:'内容太长。'},413);
 const reader=request.body?.getReader();let bytes=0,parts=[];
 if(!reader)return reply({error:'请填写反馈。'},400);
 while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>10000){await reader.cancel();return reply({error:'内容太长。'},413);}parts.push(value);}
 let data;try{data=JSON.parse(await new Blob(parts).text());}catch{return reply({error:'提交格式错误。'},400);}
 if(!data||typeof data!=='object'||data.website)return reply({error:'提交未通过验证。'},400);
 const validText=(v,min,max)=>typeof v==='string'&&v.trim().length>=min&&v.length<=max;
 if(!/^[a-f0-9-]{36}$/.test(data.id||'')||!games.includes(data.game)||!categories.includes(data.category)
  ||!validText(data.level,0,80)||!validText(data.steps,10,1500)||!validText(data.result,5,1500)||!validText(data.device,0,160))
  return reply({error:'请填写具体步骤（至少 10 字）和实际情况（至少 5 字），并检查内容长度。'},400);
 if(!env.FEEDBACK_DB)return reply({error:'反馈服务暂不可用，内容仍留在表单中。可复制后通过下方备用渠道提交。'},503);
 try{
  const db=env.FEEDBACK_DB;
  await db.prepare(schema).run();
  const old=await db.prepare('SELECT id FROM route_feedback WHERE id=?').bind(data.id).first();
  if(old)return reply({ok:true,id:old.id});
  // Atomic capacity check; no IP address or browser fingerprint is stored.
  const stored=await db.prepare(`INSERT OR IGNORE INTO route_feedback(id,game,level,category,steps,result,device)
   SELECT ?,?,?,?,?,?,? WHERE (SELECT count(*) FROM route_feedback WHERE created_at>=datetime('now','-1 day'))<200`)
   .bind(data.id,data.game,data.level.trim(),data.category,data.steps.trim(),data.result.trim(),data.device.trim()).run();
  if(!stored.meta.changes)return reply({error:'今天提交较多，请稍后重试，或使用下方备用渠道。'},429);
  return reply({ok:true,id:data.id},201);
 }catch{return reply({error:'暂时未能确认收到，请保留内容并重试；重复点击不会重复建单。'},503);}
}
