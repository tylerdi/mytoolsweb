import { HALL_STEPS, MEDITATION_SEAT } from './surfaces.mjs';
// Half-metre navigation grid. All scenery movement uses these same boundaries.
export const STEP = .5;
export const BOUNDS = { minX: -10, maxX: 10, minZ: -9, maxZ: 10 };
export const PLACES = {
  sit: { x: MEDITATION_SEAT.x, z: MEDITATION_SEAT.z, title: '檐下 · 听雨' },
  bell: { x: -6.5, z: -2, title: '钟亭 · 远声' },
  wood: { x: 2.5, z: -4.5, title: '木鱼 · 一念' },
  fish: { x: 2.5, z: 3, title: '池畔 · 游鱼' },
};
export function walkable(x,z) {
  if (x < BOUNDS.minX || x > BOUNDS.maxX || z < BOUNDS.minZ || z > BOUNDS.maxZ) return false;
  if (x > -5.5 && x < 5.5 && z < -5) return false;
  if (((x-6)/3.05)**2 + ((z-3)/2.65)**2 < 1) return false;
  if(HALL_STEPS.some(s=>Math.abs(x-s.x)<s.width/2+.1&&Math.abs(z-s.z)<s.depth/2+.1))return false;
  // Decorative boulders and the maple trunk.
  if (Math.hypot(x+4.8,z-4.2)<.8 || Math.hypot(x-8.5,z+3.8)<.8) return false;
  return true;
}
const key = (x,z) => `${x},${z}`;
export function findPath(from, to) {
  const snap = v => Math.round(v/STEP)*STEP;
  let start={x:snap(from.x),z:snap(from.z)};const end={x:snap(to.x),z:snap(to.z)};
  if(!walkable(from.x,from.z))return null;
  if(!walkable(start.x,start.z)){
    const nearby=[];
    for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){const x=start.x+dx*STEP,z=start.z+dz*STEP;if(walkable(x,z))nearby.push({x,z});}
    nearby.sort((a,b)=>Math.hypot(a.x-from.x,a.z-from.z)-Math.hypot(b.x-from.x,b.z-from.z));
    start=nearby.find(p=>[.25,.5,.75].every(t=>walkable(from.x+(p.x-from.x)*t,from.z+(p.z-from.z)*t)));
    if(!start)return null;
  }
  if(!walkable(start.x,start.z)||!walkable(end.x,end.z))return null;
  const nodes=[start],seen=new Map([[key(start.x,start.z),null]]);
  for(let i=0;i<nodes.length;i++){
    const n=nodes[i];
    if(n.x===end.x&&n.z===end.z){
      const path=[];let p=n;
      while(p){path.push(p);p=seen.get(key(p.x,p.z));}
      const ordered=path.reverse();return Math.hypot(start.x-from.x,start.z-from.z)<.01?ordered.slice(1):ordered;
    }
    for(const [dx,dz] of [[STEP,0],[-STEP,0],[0,STEP],[0,-STEP]]){
      const p={x:n.x+dx,z:n.z+dz},k=key(p.x,p.z);
      if(!seen.has(k)&&walkable(p.x,p.z)){seen.set(k,n);nodes.push(p);}
    }
  }
  return null;
}
export function formatTime(seconds){const s=Math.max(0,Math.ceil(seconds));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
