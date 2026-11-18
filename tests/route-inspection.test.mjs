import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectRoute,practiceBoard} from '../prototypes/daily-route/game-core.mjs';
import {createPractice} from '../guides/practice-core.mjs';
import {scenarios} from '../guides/scenarios.mjs';
test('inspection explains real legal-but-dead branches without disclosing an answer',()=>{
 for(const level of [2,8]){const p=createPractice('route',level);p.example(scenarios[`route-${level}`].directions);assert.equal(inspectRoute(p.board,p.state()).status,'blocked');}
 const b=practiceBoard(1);assert.equal(inspectRoute(b,[b.start]).status,'possible');assert.equal(inspectRoute(b,b.reference).status,'solved');
 assert.equal(inspectRoute(b,[b.start],{maxNodes:1}).status,'unknown');
 const tight={...b,limit:1};assert.equal(inspectRoute(tight,[b.start]).status,'budget');
 assert.equal(inspectRoute(b,[b.start,0]).status,'invalid');
});
test('inspection keeps previously collected signal keys while checking continuations',()=>{
 for(const level of [9,10,11,12]){const b=practiceBoard(level);for(let n=b.reference.length-7;n<b.reference.length;n++)assert.equal(inspectRoute(b,b.reference.slice(0,n)).status,'possible',`level ${level} step ${n}`);}
});
