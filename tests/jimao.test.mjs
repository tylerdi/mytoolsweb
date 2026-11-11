import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile,readdir,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {DIFFICULTIES,difficulty,resultText,validMetric,ORIGIN} from '../prototypes/jimao/core.mjs';
import worker from '../prototypes/jimao/worker.mjs';
import {buildSite} from '../prototypes/jimao/build.mjs';
test('difficulty changes combat pressure monotonically, with standard retaining prototype tuning',()=>{
 const p=Object.values(DIFFICULTIES);assert.deepEqual(p[1].flow.waves,[{gull:3,hound:1},{gull:3,hound:2},{gull:4,hound:3}]);
 for(let i=1;i<p.length;i++){
  assert.ok(p[i].damage>p[i-1].damage);assert.ok(p[i].regenDelay>p[i-1].regenDelay);assert.ok(p[i].regenRate<p[i-1].regenRate);
  assert.ok(p[i].flow.maxAlive>p[i-1].flow.maxAlive);assert.ok(p[i].flow.spawnStagger<p[i-1].flow.spawnStagger);assert.ok(p[i].flow.cutSeconds>p[i-1].flow.cutSeconds);
  for(let w=0;w<3;w++)assert.ok(p[i].flow.waves[w].gull+p[i].flow.waves[w].hound>p[i-1].flow.waves[w].gull+p[i-1].flow.waves[w].hound);
 }
 assert.equal(difficulty('__proto__'),'standard');assert.equal(difficulty('unknown'),'standard');
});
test('result sharing preserves actual difficulty and handles zero shots',()=>{
 const r={difficulty:'hard',time:125,hits:0,shots:0,kills:3,retries:1};
 assert.match(resultText(r,'en'),/Hard[\s\S]*02:05[\s\S]*Accuracy —/);assert.ok(resultText(r).endsWith(`${ORIGIN}/zh/play/?difficulty=hard`));
 assert.match(resultText({...r,hits:2,shots:4},'en'),/50%/);
});
test('metrics accept only small allowlisted aggregates and atomically count events without storing identity',async()=>{
 const sqlite=new DatabaseSync(':memory:');
 const env={DB:{prepare(sql){return {values:[],bind(...values){this.values=values;return this},async run(){sqlite.prepare(sql).run(...this.values);return {}},async all(){return {results:sqlite.prepare(sql).all(...this.values)}}}}}};
 const post=(data,origin=ORIGIN)=>new Request(`${ORIGIN}/api/event`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
 try{
  assert.equal(validMetric({event:'load',difficulty:'easy',email:'private'}),false);
  assert.equal((await worker.fetch(post({event:'load',difficulty:'easy'},'https://bad.example'),env)).status,403);
  assert.equal((await worker.fetch(post({event:'load',difficulty:'easy',score:42}),env)).status,400);
  for(let i=0;i<3;i++)assert.equal((await worker.fetch(post({event:'start',difficulty:'standard'}),env)).status,204);
  const result=await (await worker.fetch(new Request(`${ORIGIN}/api/stats`),env)).json();assert.equal(result.rows.length,1);assert.equal(result.rows[0].n,3);
  assert.deepEqual(Object.keys(result.rows[0]).sort(),['day','difficulty','event','n']);
 }finally{sqlite.close()}
});
test('bilingual release isolates the game and publishes real metadata, policy pages and correct ads.txt',async()=>{
 const dir=await buildSite(),names=await readdir(dir);
 for(const f of ['source.html','runtime.mjs','functions','node_modules','.env'])assert.ok(!names.includes(f));
 assert.ok(names.includes('_worker.js'));assert.deepEqual(JSON.parse(await readFile(join(dir,'_routes.json'),'utf8')).include,['/api/*']);
 for(const lang of ['zh','en'])for(const path of ['','play/','guide/','map/','about/','privacy/','contact/','updates/']){
  const html=await readFile(join(dir,lang,path,'index.html'),'utf8');assert.ok(html.includes(`lang="${lang}"`));assert.ok(html.includes(`href="${ORIGIN}/${lang}/${path}"`));assert.doesNotMatch(html,/3A大作|国产第一|127\.0\.0\.1/);
  for(const asset of [...html.matchAll(/(?:href|src)="\/(?!\/)([^"?#]+\.(?:js|css|jpg|svg))"/g)])assert.ok((await stat(join(dir,asset[1]))).size>0);
 }
 assert.equal((await readFile(join(dir,'ads.txt'),'utf8')).trim(),'google.com, pub-6426056111301969, DIRECT, f08c47fec0942fa0');
 const sitemap=await readFile(join(dir,'sitemap.xml'),'utf8');assert.equal([...sitemap.matchAll(/<loc>/g)].length,16);assert.doesNotMatch(sitemap,/temple\.|\/twins\//);
});
