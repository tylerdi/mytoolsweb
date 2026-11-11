import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {BEAD_STEP,angleDelta,greetingEnvelope,createBeadMotion} from '../prototypes/rain-temple/beads-core.mjs';
import {MEDITATION_SEAT,standingHeight} from '../prototypes/rain-temple/surfaces.mjs';
import {createTraveler} from '../prototypes/rain-temple/models.mjs';
test('beads advance exactly once per button press and handle both drag directions',()=>{
 const motion=createBeadMotion();motion.step();assert.equal(motion.count,1);motion.step();assert.equal(motion.count,2);
 motion.begin();motion.drag(BEAD_STEP,.1);motion.release();assert.equal(motion.count,3);
 motion.begin();motion.drag(-BEAD_STEP,.1);motion.release();assert.equal(motion.count,4);
 motion.reset();assert.equal(motion.count,0);assert.equal(motion.angle,0);assert.equal(motion.velocity,0);
});
test('release inertia decays, and reduced motion or leaving stops it',()=>{
 const motion=createBeadMotion();motion.begin();motion.drag(.4,.04);motion.release();const initial=motion.velocity,angle=motion.angle;
 for(let i=0;i<120;i++)motion.tick(1/60);
 assert.ok(motion.angle>angle);assert.ok(Math.abs(motion.velocity)<Math.abs(initial));
 motion.setReduced(true);motion.begin();motion.drag(.4,.04);motion.release();const stopped=motion.angle;motion.tick(.05);assert.equal(motion.velocity,0);assert.ok(Math.abs(motion.angle-stopped)<=BEAD_STEP/2);
 motion.setReduced(false);motion.begin();motion.drag(.3,.03);motion.halt();const paused=motion.angle;for(let i=0;i<60;i++)motion.tick(.016);assert.equal(motion.angle,paused);
});
test('circular dragging crosses the angular seam without a full-turn jump',()=>{
 assert.ok(Math.abs(angleDelta(Math.PI-.03,-Math.PI+.02)-.05)<1e-10);
 assert.ok(Math.abs(angleDelta(-Math.PI+.02,Math.PI-.03)+.05)<1e-10);
});
test('greeting raises, holds and releases palms, and reaches the chest without an invalid pose',()=>{
 assert.equal(greetingEnvelope(-1),0);assert.equal(greetingEnvelope(0),0);assert.equal(greetingEnvelope(1.5),1);assert.equal(greetingEnvelope(3),0);assert.ok(greetingEnvelope(.3)>0&&greetingEnvelope(.3)<1);
 const person=createTraveler();person.animate({time:0,greeting:1});person.group.updateMatrixWorld(true);
 const left=person.group.getObjectByName('palm-left').getWorldPosition(new THREE.Vector3()),right=person.group.getObjectByName('palm-right').getWorldPosition(new THREE.Vector3());
 assert.ok(left.distanceTo(right)<.06);assert.ok(left.y>1&&left.y<1.2);assert.ok(left.z>.2);
 person.animate({time:1,greeting:0});person.group.updateMatrixWorld(true);assert.ok(person.group.getObjectByName('palm-left').getWorldPosition(new THREE.Vector3()).distanceTo(person.group.getObjectByName('palm-right').getWorldPosition(new THREE.Vector3()))>.45);
 person.animate({time:2,beading:true,beadPhase:1});assert.ok([...person.group.getObjectByName('palm-left').matrix.elements].every(Number.isFinite));
});

test('standing gestures on the meditation cushion place feet above its surface',()=>{
 const surface=standingHeight(MEDITATION_SEAT.x,MEDITATION_SEAT.z);assert.equal(surface,MEDITATION_SEAT.y+MEDITATION_SEAT.height/2);
 const p=createTraveler();p.animate({time:0,greeting:1,groundHeight:surface});p.group.updateMatrixWorld(true);let min=Infinity;const v=new THREE.Vector3();p.group.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);min=Math.min(min,v.y);}});assert.ok(min>surface);
});
