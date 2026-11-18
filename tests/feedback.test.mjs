import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {handleFeedback} from '../feedback/handler.mjs';
function database(){const sql=new DatabaseSync(':memory:');return {sql,prepare(query){let args=[];return {bind(...values){args=values;return this;},async run(){const result=sql.prepare(query).run(...args);return {meta:{changes:Number(result.changes)}};},async first(){return sql.prepare(query).get(...args);}};}};}
const data=()=>({id:crypto.randomUUID(),game:'每日航线',category:'关卡或规则问题',level:'第 8 关',steps:'第十四步向下，之后无法回到灯塔。',result:'希望解释还剩六步为什么不够。',device:'测试设备',website:''});
const request=(value,options={})=>new Request('https://tylerzhang.xyz/api/feedback',{method:'POST',headers:{Origin:'https://tylerzhang.xyz','Content-Type':'application/json',...options.headers},body:JSON.stringify(value),...options});
test('feedback is privately stored and a network retry produces one ticket',async()=>{
 const db=database(),value=data();
 const first=await handleFeedback(request(value),{FEEDBACK_DB:db});assert.equal(first.status,201);assert.deepEqual(await first.json(),{ok:true,id:value.id});
 assert.equal((await handleFeedback(request(value),{FEEDBACK_DB:db})).status,200);
 assert.equal(db.sql.prepare('SELECT count(*) AS n FROM route_feedback').get().n,1);
 const row=db.sql.prepare('SELECT * FROM route_feedback').get();assert.equal(row.steps,value.steps);assert.equal(Object.hasOwn(row,'ip'),false);
 const read=await handleFeedback(new Request('https://tylerzhang.xyz/api/feedback'),{FEEDBACK_DB:db});assert.equal(read.status,405);assert.equal((await read.text()).includes(value.steps),false);
 db.sql.close();
});
test('feedback validates origin, body limits and required fields, and fails honestly without storage',async()=>{
 assert.equal((await handleFeedback(request(data()),{})).status,503);
 assert.equal((await handleFeedback(request(data(),{headers:{Origin:'https://evil.example','Content-Type':'application/json'}}),{})).status,403);
 for(const invalid of [{...data(),steps:'短'},{...data(),website:'bot'},{...data(),game:'other'},null])assert.equal((await handleFeedback(request(invalid),{})).status,400);
 assert.equal((await handleFeedback(request({...data(),steps:'a'.repeat(11000)}),{})).status,413);
 const broken={prepare(){throw new Error('private infrastructure detail');}};
 const response=await handleFeedback(request(data()),{FEEDBACK_DB:broken});assert.equal(response.status,503);assert.equal((await response.text()).includes('infrastructure'),false);
});
test('the daily capacity is atomic and existing receipt retries remain accepted at capacity',async()=>{
 const db=database(),first=data();await handleFeedback(request(first),{FEEDBACK_DB:db});
 const insert=db.sql.prepare('INSERT INTO route_feedback(id,game,level,category,steps,result,device) SELECT ?,game,level,category,steps,result,device FROM route_feedback LIMIT 1');
 for(let n=1;n<200;n++)insert.run(crypto.randomUUID());
 assert.equal((await handleFeedback(request(data()),{FEEDBACK_DB:db})).status,429);
 assert.equal((await handleFeedback(request(first),{FEEDBACK_DB:db})).status,200);db.sql.close();
});
