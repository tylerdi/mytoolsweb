import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=path=>readFileSync(join(root,path),'utf8');
function resolve(path){
  const name=decodeURIComponent(path).replace(/^\//,'');
  return [name,name+'.html',join(name,'index.html')].find(candidate=>existsSync(join(root,candidate))&&statSync(join(root,candidate)).isFile());
}
test('every maintained sitemap page and its local navigation, scripts and illustrations exist',()=>{
  const urls=[...read('sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
  assert.equal(new Set(urls).size,urls.length);
  for(const value of urls){
    const url=new URL(value),file=resolve(url.pathname);assert.ok(file,value);
    const html=read(file);assert.doesNotMatch(html,/<meta name="robots" content="noindex/);
    assert.ok(html.includes(`href="${value}"`),`canonical ${file}`);
    for(const [,reference] of html.matchAll(/(?:href|src)="([^"<>]+)"/g)){
      const target=new URL(reference,url);
      if(target.origin!==url.origin)continue;
      assert.ok(resolve(target.pathname),`${file} → ${reference}`);
    }
  }
});
