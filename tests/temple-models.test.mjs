import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createTraveler,createKoi,createPine,createMaple,createBamboo} from '../prototypes/rain-temple/models.mjs';
function random(){let seed=17;return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function inspect(root){
 root.updateMatrixWorld(true);let triangles=0,meshes=0,minY=Infinity;const point=new THREE.Vector3();
 root.traverse(o=>{
  if(!o.isMesh)return;meshes++;const p=o.geometry.attributes.position;
  triangles+=(o.geometry.index?.count??p.count)/3*(o.isInstancedMesh?o.count:1);
  for(let i=0;i<p.count;i++){
   point.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);assert.ok(point.toArray().every(Number.isFinite));minY=Math.min(minY,point.y);
  }
 });return{triangles,meshes,minY};
}
test('detailed traveler stays finite while walking, tapping and sitting, without legs below the ground',()=>{
 const traveler=createTraveler();
 for(let i=0;i<30;i++){traveler.animate({time:i/10,walking:true,woodProgress:i/30});assert.ok(inspect(traveler.group).minY>.045);}
 traveler.animate({time:4,sitting:true});const seated=inspect(traveler.group);assert.ok(seated.minY>.045);assert.ok(seated.triangles<18000);assert.ok(seated.meshes<30);
 traveler.animate({time:5,reduced:true,groundHeight:.045});const grounded=inspect(traveler.group).minY;assert.ok(grounded>.045&&grounded<.075);
});
test('koi geometry and fin animation fit a small rendering budget',()=>{
 for(let i=0;i<8;i++){const koi=createKoi(i);for(const reduced of [false,true]){koi.animate(20,reduced);const result=inspect(koi.group);assert.ok(result.triangles<3000);assert.ok(result.meshes<=8);}
  const bounds=new THREE.Box3().setFromObject(koi.group);assert.ok(bounds.getSize(new THREE.Vector3()).length()<1.4);
 }
});
test('trees use instanced foliage and bamboo consolidates its rigid parts',()=>{
 for(const plant of [createPine(random()),createMaple(random()),createBamboo(random(),4)]){
  const info=inspect(plant);assert.ok(info.triangles<20000);let leaves=0;plant.traverse(o=>{if(o.isInstancedMesh){leaves+=o.count;assert.ok(o.instanceColor);assert.ok([...o.instanceMatrix.array].every(Number.isFinite));}});assert.ok(leaves>=50);
 }
 assert.ok(inspect(createBamboo(random(),4)).meshes<=4);
});
