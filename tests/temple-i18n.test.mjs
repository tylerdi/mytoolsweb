import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { messages, resolveLanguage, translate, LOCALES } from '../prototypes/rain-temple/i18n.mjs';
import { placeStone, STONE_TOP_RADIUS } from '../prototypes/rain-temple/surfaces.mjs';
test('temple translations cover both languages and every static UI reference',()=>{
 for(const lang of Object.keys(LOCALES))assert.deepEqual(Object.keys(messages[lang]).sort(),Object.keys(messages.zh).sort());
 const html=readFileSync(new URL('../prototypes/rain-temple/index.html',import.meta.url),'utf8');
 for(const match of html.matchAll(/data-i18n(?:-aria|-alt)?="([^"]+)"/g))for(const lang of Object.keys(LOCALES))assert.ok(translate(lang,match[1]));
 for(const [key,value] of Object.entries(messages.en))if(key!=='language')assert.doesNotMatch(value,/[\u4e00-\u9fff]/);
});
test('language preference uses URL, then saved choice, then browser language',()=>{
 assert.equal(resolveLanguage({query:'en',stored:'zh',languages:['zh-CN']}),'en');
 assert.equal(resolveLanguage({stored:'zh',languages:['en-US']}),'zh');
 assert.equal(resolveLanguage({languages:['zh-TW']}),'zh');
 assert.equal(resolveLanguage({languages:['fr-FR']}),'en');
 assert.equal(resolveLanguage({languages:['ja-JP']}),'ja');
 assert.equal(resolveLanguage({languages:['ko-KR']}),'ko');
 assert.equal(resolveLanguage({languages:['fr-FR','ko-KR','en-US']}),'ko');
 assert.equal(resolveLanguage({query:'ja',stored:'ko',languages:['en']}),'ja');
 assert.equal(resolveLanguage({query:'JA-jp',stored:'zh'}),'ja');
 assert.equal(resolveLanguage({stored:'ko',languages:['ja']}),'ko');
 assert.equal(resolveLanguage({query:'bad',stored:'bad',languages:['en']}),'en');
});
test('in-progress translated activity text retains numeric state',()=>{
 assert.equal(translate('en','woodNote',{n:7}),'Tap count: 7. Just a sound, not a score.');
 assert.equal(translate('zh','woodNote',{n:7}),'已叩 7 次 · 不计功德，只听声音。');
 assert.equal(translate('en','walkNote',{place:translate('en','location_bell')}),'Walking to Bell pavilion · Resonance');
});
test('paving at path junctions never overlaps its coplanar neighbours',()=>{
 const placed=[];
 for(let z=9;z>=-5;z-=.9){placeStone(placed,-.62,z,1.3,.98);placeStone(placed,.65,z+.1,1.3,.98);}
 for(let x=-6.7;x<3.5;x+=.9){placeStone(placed,x,-2.2,1,.9);placeStone(placed,x,-3,1,.9);}
 for(let z=-1.4;z<=3.4;z+=.85)placeStone(placed,2.65,z,1.2,.9);
 assert.ok(placed.length>35);
 for(let i=0;i<placed.length;i++)for(let j=i+1;j<placed.length;j++){
  const a=placed[i],b=placed[j];
  assert.ok(Math.abs(a.x-b.x)>=a.halfX+b.halfX||Math.abs(a.z-b.z)>=a.halfZ+b.halfZ);
 }
 assert.equal(STONE_TOP_RADIUS,.4);
 assert.equal(placeStone(placed,placed[0].x,placed[0].z,1,1),null);
});

test('Japanese and Korean keep interpolation parameters and readable localized metadata',()=>{
 for(const lang of ['ja','ko']){
  for(const key of Object.keys(messages.zh)){
   const slots=value=>[...value.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
   assert.deepEqual(slots(messages[lang][key]),slots(messages.zh[key]),lang+':'+key);
  }
  assert.ok(translate(lang,'woodNote',{n:7}).includes('7'));
  assert.equal(translate(lang,'walkNote',{place:'TEST'}).includes('TEST'),true);
  assert.doesNotThrow(()=>new Intl.DateTimeFormat(LOCALES[lang].date).format(new Date()));
  assert.ok(LOCALES[lang].filename.endsWith('.png'));
 }
 assert.equal(LOCALES.ja.html,'ja');assert.equal(LOCALES.ko.html,'ko');
});
