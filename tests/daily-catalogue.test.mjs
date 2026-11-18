import test from 'node:test';
import assert from 'node:assert/strict';
import {DAILY_CHARTS} from '../prototypes/daily-route/daily-charts.mjs';
import {dailyBoard,validateRoute,analyzeRouteBoard} from '../prototypes/daily-route/game-core.mjs';
test('every future daily chart is distinct, exactly screened and has meaningful difficulty constraints',()=>{
 assert.equal(DAILY_CHARTS.length,84);const fingerprints=new Set(),families=new Set();
 for(const chart of DAILY_CHARTS){
  const fingerprint=JSON.stringify([chart.start,chart.end,[...chart.beacons].sort((a,b)=>a-b),[...chart.obstacles].sort((a,b)=>a-b)]);assert.equal(fingerprints.has(fingerprint),false);fingerprints.add(fingerprint);families.add(chart.family);
  assert.equal(validateRoute(chart,chart.reference).status,'solved');const result=analyzeRouteBoard(chart);assert.equal(result.truncated,false);assert.equal(result.shortest,chart.analysis.shortest);assert.equal(result.solutionCount,chart.analysis.solutionCount);
  const slack=chart.limit-result.shortest;assert.equal(slack,chart.difficulty==='简单'?4:chart.difficulty==='标准'?2:0);
  if(chart.difficulty==='简单')assert.ok(result.solutionCount>=15);
  if(chart.difficulty==='标准')assert.ok(result.misleadingBranches>=5&&result.solutionCount<=35);
  if(chart.difficulty==='困难')assert.ok(result.misleadingBranches>=10&&result.solutionCount<=12);
  for(const cell of Object.keys(chart.signals)){const without=analyzeRouteBoard({...chart,signals:Object.fromEntries(Object.entries(chart.signals).filter(([key])=>key!==cell))});assert.equal(without.truncated,false);assert.ok(without.solutionCount>result.solutionCount,'signal must affect actual solution routes');}
 }
 assert.equal(families.size,5);
});
test('the date boundary preserves published boards, follows Shanghai dates, and weekly difficulty resets intentionally',()=>{
 assert.equal(dailyBoard(new Date('2026-11-18T15:59:59Z')).revision,undefined);
 assert.equal(dailyBoard(new Date('2026-11-18T16:00:00Z')).revision,'daily-v2');
 const expected=['简单','简单','标准','标准','困难','困难','标准'];
 for(let n=0;n<365;n++){
  const date=new Date(Date.UTC(2026,10,23+n,4)),board=dailyBoard(date);assert.deepEqual(board,dailyBoard(date));assert.equal(board.difficulty,expected[n%7]);assert.equal(validateRoute(board,board.reference).status,'solved');
 }
 const a=dailyBoard(new Date('2026-11-20T12:00:00+08:00'));a.beacons.length=0;a.signals[0]={};
 assert.equal(dailyBoard(new Date('2026-11-20T12:00:00+08:00')).beacons.length,3);
});

test('published historical daily boards retain their pre-change bytes',async()=>{
 const {createHash}=await import('node:crypto');
 const fixtures={'2026-01-01':'f69c5a63edbe1abcfe61bc30da73bc955fcea54021598a1870ee628a0f310468','2026-10-31':'88cd3288ac2073ccd2ce62d3fc556eacc923c5c20e4d34cf289636b543c145fb','2026-11-13':'590624894c74fef137856c8b11f4babef7de9fd57849a4b076eafec0f9d51ced','2026-11-18':'c7d344815e7e42e90d87298bdfed9e4f13e784f84a12e134b3d35c29bc29343d'};
 for(const [date,expected]of Object.entries(fixtures))assert.equal(createHash('sha256').update(JSON.stringify(dailyBoard(new Date(date+'T12:00:00+08:00')))).digest('hex'),expected);
});
