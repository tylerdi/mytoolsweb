// Top faces of paving stones must never overlap: coplanar overlap causes z-fighting.
export const STONE_TOP_RADIUS = .4;
export function placeStone(placed,x,z,width=1.1,depth=.8){
 const candidate={x,z,halfX:(STONE_TOP_RADIUS+.015)*width+.015,halfZ:(STONE_TOP_RADIUS+.015)*depth+.015};
 if(!isPavingClear(candidate))return null;
 if(placed.some(p=>Math.abs(p.x-x)<p.halfX+candidate.halfX&&Math.abs(p.z-z)<p.halfZ+candidate.halfZ))return null;
 placed.push(candidate);return candidate;
}

// Shared by rendering, paving clearance and interaction placement.
export const HALL_STEPS = Object.freeze(Array.from({length:3},(_,i)=>Object.freeze({x:0,z:-4.7-i*.24,width:4.1,depth:1.2-i*.2,y:.06+i*.12,height:.12})));
export const MEDITATION_SEAT = Object.freeze({x:0,z:-3.5,radius:.53,height:.12,y:.215,baseRadius:.56,baseHeight:.1,baseY:.09});
export function overlapsRect(a,b){return Math.abs(a.x-b.x)<a.halfX+b.halfX&&Math.abs(a.z-b.z)<a.halfZ+b.halfZ;}
export function isPavingClear(candidate){
 const fixtures=[...HALL_STEPS.map(s=>({x:s.x,z:s.z,halfX:s.width/2+.03,halfZ:s.depth/2+.03})),{x:MEDITATION_SEAT.x,z:MEDITATION_SEAT.z,halfX:MEDITATION_SEAT.baseRadius+.03,halfZ:MEDITATION_SEAT.baseRadius+.03}];
 return !fixtures.some(f=>overlapsRect(candidate,f));
}
export function standingHeight(x,z,paving=[]){
 const seat=MEDITATION_SEAT,d=Math.hypot(x-seat.x,z-seat.z);
 if(d<=seat.radius)return seat.y+seat.height/2;
 if(d<=seat.baseRadius)return seat.baseY+seat.baseHeight/2;
 return paving.some(p=>Math.abs(x-p.x)<p.halfX+.13&&Math.abs(z-p.z)<p.halfZ+.13)?.125:.045;
}
