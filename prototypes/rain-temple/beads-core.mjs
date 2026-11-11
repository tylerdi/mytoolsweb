export const BEAD_COUNT=27;
export const BEAD_STEP=Math.PI*2/BEAD_COUNT;
export function angleDelta(from,to){return Math.atan2(Math.sin(to-from),Math.cos(to-from));}
export function greetingEnvelope(seconds,reduced=false){
 if(seconds<0||seconds>=3)return 0;
 if(reduced)return seconds<2.5?1:0;
 const smooth=t=>t*t*(3-2*t);
 if(seconds<.65)return smooth(seconds/.65);
 if(seconds<2.1)return 1;
 return 1-smooth((seconds-2.1)/.9);
}
export function createBeadMotion(){
 let angle=0,velocity=0,count=0,dragging=false,reduced=false;
 function advance(delta){
  const before=Math.round(angle/BEAD_STEP);angle+=delta;
  const crossed=Math.abs(Math.round(angle/BEAD_STEP)-before);count+=crossed;return crossed;
 }
 return {
  get angle(){return angle;},get count(){return count;},get dragging(){return dragging;},get velocity(){return velocity;},
  begin(){dragging=true;velocity=0;},
  drag(delta,seconds){if(!dragging||!Number.isFinite(delta))return 0;const moved=Math.max(-.7,Math.min(.7,delta));velocity=reduced?0:Math.max(-4,Math.min(4,moved/Math.max(.016,seconds)));return advance(moved);},
  release(){dragging=false;},
  tick(seconds){const dt=Math.max(0,Math.min(seconds,.05));if(dragging)return 0;
   if(reduced){velocity=0;angle=Math.round(angle/BEAD_STEP)*BEAD_STEP;return 0;}
   if(Math.abs(velocity)>.03){const moved=advance(velocity*dt);velocity*=Math.exp(-5*dt);return moved;}
   velocity=0;angle+=(Math.round(angle/BEAD_STEP)*BEAD_STEP-angle)*Math.min(1,dt*14);return 0;
  },
  step(direction=1){velocity=0;dragging=false;return advance(Math.sign(direction||1)*BEAD_STEP);},
  halt(){velocity=0;dragging=false;angle=Math.round(angle/BEAD_STEP)*BEAD_STEP;},
  reset(){angle=0;velocity=0;count=0;dragging=false;},
  setReduced(value){reduced=Boolean(value);if(reduced)velocity=0;},
 };
}
