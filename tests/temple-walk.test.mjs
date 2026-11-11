import test from 'node:test';
import assert from 'node:assert/strict';
import { walkable, findPath, PLACES, formatTime } from '../prototypes/rain-temple/walk.mjs';
test('temple route avoids pond and buildings for all activity locations',()=>{
 for(const from of [{x:0,z:5.5},...Object.values(PLACES)])for(const to of Object.values(PLACES)){
  const route=findPath(from,to);assert.ok(route);let last=from;
  for(const step of route){assert.ok(walkable(step.x,step.z));assert.ok(Math.hypot(step.x-last.x,step.z-last.z)<=.51);last=step;}
  assert.equal(last.x,to.x);assert.equal(last.z,to.z);
 }
});
test('temple does not find routes into water, hall or beyond courtyard',()=>{
 for(const to of [{x:6,z:3},{x:0,z:-7},{x:11,z:0}])assert.equal(findPath({x:0,z:5.5},to),null);
 const route=findPath({x:2.5,z:3},{x:9.5,z:3});assert.ok(route.length>14);assert.ok(route.every(p=>walkable(p.x,p.z)));
});
test('temple clock rounds up and never displays negative time',()=>{
 assert.equal(formatTime(60),'01:00');assert.equal(formatTime(1.1),'00:02');assert.equal(formatTime(-1),'00:00');assert.equal(formatTime(300),'05:00');
});

test('keyboard position near the pond can still route back to an activity',()=>{assert.ok(walkable(2.9,3));const path=findPath({x:2.9,z:3},PLACES.bell);assert.ok(path);assert.ok(path.every(p=>walkable(p.x,p.z)));});
