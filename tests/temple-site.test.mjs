import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {buildSite,SITE_ORIGIN} from '../prototypes/rain-temple/build-site.mjs';
import {LOCALES,messages} from '../prototypes/rain-temple/i18n.mjs';
test('production temple build isolates static assets and publishes four languages with working page links',async()=>{
 const output=await buildSite(),names=await readdir(output);
 assert.ok(!names.includes('functions'));assert.ok(!names.includes('node_modules'));assert.ok(!names.includes('main.mjs'));assert.ok(!names.includes('PLAN.md'));
 const index=await readFile(join(output,'index.html'),'utf8');assert.doesNotMatch(index,/noindex|127\.0\.0\.1|prototypes\/rain-temple/);assert.ok(index.includes(`data-site-root="${SITE_ORIGIN}"`));
 for(const path of [...index.matchAll(/(?:src|href)="\/(temple\.[a-f0-9]+\.(?:js|css)|mark\.svg)"/g)].map(m=>m[1]))assert.ok((await stat(join(output,path))).size>0);
 for(const lang of Object.keys(LOCALES)){
  const html=await readFile(join(output,lang,'index.html'),'utf8');assert.ok(html.includes(messages[lang].brand));assert.ok(html.includes(messages[lang].beadsLabel));assert.ok(html.includes(`href="${SITE_ORIGIN}/${lang}/"`));
  for(const page of ['about','privacy','contact']){
   const info=await readFile(join(output,lang,page,'index.html'),'utf8');assert.ok(info.includes(`lang="${LOCALES[lang].html}"`));assert.ok(info.includes(`href="/${lang}/"`));assert.ok(info.includes(`href="${SITE_ORIGIN}/${lang}/${page}/"`));assert.doesNotMatch(info,/noindex/);
  }
 }
 const sitemap=await readFile(join(output,'sitemap.xml'),'utf8');assert.equal([...sitemap.matchAll(/<loc>/g)].length,16);assert.doesNotMatch(sitemap,/tylerzhang\.xyz\/(twins|guides)/);
 assert.equal((await readFile(join(output,'ads.txt'),'utf8')).trim(),'google.com, pub-6426056111301969, DIRECT, f08c47fec0942fa0');
});
