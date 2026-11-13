import test from 'node:test';
import assert from 'node:assert/strict';
import {createPractice} from '../guides/practice-core.mjs';
import {scenarios} from '../guides/scenarios.mjs';
import {analyzeRouteBoard} from '../prototypes/daily-route/game-core.mjs';

const routeDirections=board=>board.reference.slice(1).map((cell,i)=>({[-7]:'up',[1]:'right',[7]:'down',[-1]:'left'})[cell-board.reference[i]]);
test('each embedded challenge can be solved, undone and restarted using the real game rules',()=>{
  for(const [game,level] of [['route',2],['route',8],['route',11],['twins',9],['twins',15]]){
    const practice=createPractice(game,level),{board}=practice;
    const directions=game==='route'?routeDirections(board):board.reference;
    for(const direction of directions)assert.equal(practice.move(direction).changed,true,`${game} ${level} ${direction}`);
    assert.equal(practice.won(),true);assert.equal(practice.assisted(),false);
    assert.equal(practice.move('up').changed,false);
    practice.undo();assert.equal(practice.won(),false);assert.equal(practice.steps(),directions.length-1);
    practice.reset();assert.equal(practice.steps(),0);assert.equal(practice.assisted(),false);
  }
});

test('published bad route openings are legal yet have no budget-respecting completion',()=>{
  for(const level of [2,8]){
    const practice=createPractice('route',level);
    practice.example(scenarios[`route-${level}`].directions);
    const path=practice.state(),board=practice.board;
    const remaining={...board,start:path.at(-1),obstacles:[...new Set([...board.obstacles,...path.slice(0,-1)])],beacons:board.beacons.filter(cell=>!path.includes(cell)),limit:board.limit-practice.steps()};
    const analysis=analyzeRouteBoard(remaining);
    assert.equal(analysis.truncated,false);assert.equal(analysis.solutionCount,0);
    assert.equal(practice.assisted(),true);
  }
});

test('the harbor example really leaves port and can still finish within eleven moves',()=>{
  const practice=createPractice('twins',9);
  practice.example(scenarios['twins-9'].directions);
  assert.deepEqual(practice.state(),{a:5,b:10});assert.equal(practice.steps(),7);
  for(const d of ['down','right','right','right'])assert.equal(practice.move(d).changed,true);
  assert.equal(practice.won(),true);assert.equal(practice.steps(),11);assert.equal(practice.assisted(),true);
});

test('reference steps and invalid inputs preserve honest progress and assistance state',()=>{
  const practice=createPractice('route',2);
  assert.equal(practice.move('diagonal').changed,false);assert.equal(practice.steps(),0);
  assert.equal(practice.follow().changed,true);assert.equal(practice.assisted(),true);
  practice.undo();assert.equal(practice.steps(),0);assert.equal(practice.assisted(),true);
  practice.reset();assert.equal(practice.assisted(),false);
  const twins=createPractice('twins',15);twins.example(scenarios['twins-15'].directions);
  assert.equal(twins.won(),false);assert.equal(twins.state().a,twins.board.goals.b);
  const budget=createPractice('twins',9);
  budget.example(scenarios['twins-9'].directions);
  for(const d of ['down','up','down','up'])budget.move(d);
  assert.equal(budget.steps(),11);assert.equal(budget.move('down').changed,false);
});
