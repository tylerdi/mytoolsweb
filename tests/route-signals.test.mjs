import test from 'node:test';
import assert from 'node:assert/strict';
import {advance,analyzeRouteBoard,findHint,practiceBoard,signalState,validateRoute} from '../prototypes/daily-route/game-core.mjs';
const base={size:7,start:0,end:2,beacons:[7],obstacles:[],currents:{},limit:4,reference:[0,7,8,1,2]};
test('a signal gate requires the correct beacon and undo restores its prior state',()=>{
  const board={...base,signals:{1:{type:'gate',beacon:0}}};
  assert.equal(signalState(board,1,[0]).open,false);
  assert.equal(advance(board,[0],1).status,'invalid');
  assert.equal(signalState(board,1,[0,7]).open,true);
  assert.equal(validateRoute(board,board.reference).status,'solved');
  const undone=advance(board,[0,7],0);
  assert.equal(signalState(board,1,undone.path).open,false);
  assert.equal(findHint(board,[0]),7);
});
test('tide bridges close after collection rather than behaving like ordinary locked gates',()=>{
  const board={...base,signals:{1:{type:'bridge',beacon:0}}};
  assert.equal(advance(board,[0],1).status,'moved');
  assert.equal(signalState(board,1,[0,7,8]).open,false);
  assert.equal(advance(board,[0,7,8],1).status,'invalid');
  const undone=advance(board,[0,7],0);
  assert.equal(signalState(board,1,undone.path).open,true);
});
test('the hard campaign requires both planning the gate and crossing a bridge before its trigger',()=>{
  for(const level of [11,12]){
    const board=practiceBoard(level),actual=analyzeRouteBoard(board);
    const withoutBridges=analyzeRouteBoard({...board,signals:Object.fromEntries(Object.entries(board.signals).filter(([,s])=>s.type!=='bridge'))});
    assert.equal(actual.truncated,false);assert.equal(withoutBridges.truncated,false);
    assert.ok(withoutBridges.solutionCount>actual.solutionCount);
    for(const [cell,signal] of Object.entries(board.signals)){
      const at=board.reference.indexOf(Number(cell)),trigger=board.reference.indexOf(board.beacons[signal.beacon]);
      assert.ok(at>0);
      assert.ok(signal.type==='gate'?trigger<at:trigger>at,'published reference must respect the order constraint');
    }
  }
});
