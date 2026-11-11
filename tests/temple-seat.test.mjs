import test from 'node:test';
import assert from 'node:assert/strict';
import { HALL_STEPS, MEDITATION_SEAT, placeStone, overlapsRect } from '../prototypes/rain-temple/surfaces.mjs';
import { PLACES, findPath, walkable } from '../prototypes/rain-temple/walk.mjs';
test('meditation cushion and its base clear every stair, including when viewed close up',()=>{
 const seat=MEDITATION_SEAT;
 for(const step of HALL_STEPS){
  assert.equal(overlapsRect({x:seat.x,z:seat.z,halfX:seat.baseRadius,halfZ:seat.baseRadius},{x:step.x,z:step.z,halfX:step.width/2,halfZ:step.depth/2}),false);
 }
 assert.ok(seat.y-seat.height/2>seat.baseY+seat.baseHeight/2);
 assert.deepEqual({x:PLACES.sit.x,z:PLACES.sit.z},{x:seat.x,z:seat.z});
 assert.ok(findPath({x:0,z:5.5},PLACES.sit));
});
test('paving never passes through the seat base or entrance steps',()=>{
 assert.equal(placeStone([],MEDITATION_SEAT.x,MEDITATION_SEAT.z),null);
 for(const step of HALL_STEPS){assert.equal(placeStone([],step.x,step.z),null);assert.equal(walkable(step.x,step.z),false);}
 assert.ok(placeStone([],0,1));
});
