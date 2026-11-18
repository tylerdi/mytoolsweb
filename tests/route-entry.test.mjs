import test from 'node:test';
import assert from 'node:assert/strict';
import {ROUTE_JOURNEY,tutorialStage,guidedMoveAllowed,entryMode,contextRule,tutorialBoard,practiceBoard,advance,validateRoute} from '../prototypes/daily-route/game-core.mjs';
import {nextSelectedLevel,migrateVoyageProgress} from '../assets/voyage.mjs';
test('demonstration ends after four moves and permits real independent choices rather than silently following the answer',()=>{
 const board=tutorialBoard(),guided=board.reference.slice(0,4),independent=board.reference.slice(0,5);
 assert.equal(tutorialStage(guided),'guided');assert.equal(guidedMoveAllowed(board,guided,9),false);
 assert.equal(tutorialStage(independent),'independent');assert.equal(guidedMoveAllowed(board,independent,10),true);assert.equal(advance(board,independent,10).status,'moved');
 assert.equal(validateRoute(board,board.reference).status,'solved');assert.equal(tutorialStage(independent.slice(0,-1)),'guided');
});
test('chosen entry and tutorial completion are different concepts',()=>{
 assert.equal(entryMode(null,false),'tutorial');assert.equal(entryMode('practice',false),'practice');assert.equal(entryMode('daily',false),'daily');assert.equal(entryMode(null,true),'daily');assert.equal(entryMode('bad',false),'tutorial');
});
test('selected journey skips duplicate learning tasks without deleting old level records',()=>{
 const old={1:{steps:6,hints:0},2:{steps:10,hints:0},5:{steps:16,hints:0},8:{steps:20,hints:1},10:{steps:24,hints:0}};
 const progress=migrateVoyageProgress(old,null,12,8);assert.deepEqual(progress,old);assert.equal(nextSelectedLevel(progress,ROUTE_JOURNEY),9);
 assert.equal(nextSelectedLevel({},ROUTE_JOURNEY),2);assert.equal(ROUTE_JOURNEY.length,6);
 let previous=0;for(const level of ROUTE_JOURNEY){const b=practiceBoard(level);assert.equal(validateRoute(b,b.reference).status,'solved');assert.ok(b.analysis.shortest>previous);previous=b.analysis.shortest;}
});
test('contextual help explains only an encountered current or nearby gate/bridge',()=>{
 const b=practiceBoard(2);assert.equal(contextRule(b,[b.start]),'');assert.match(contextRule(b,b.reference.slice(0,3)),/向上/);
 const gate=practiceBoard(9);assert.match(contextRule(gate,[32]),/闸 2/);assert.equal(contextRule(gate,[21]),'');
 const bridge=practiceBoard(11);assert.match(contextRule(bridge,bridge.reference.slice(0,17)),/桥 3/);
});
