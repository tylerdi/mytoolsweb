import * as THREE from 'three';
import { BEAD_COUNT, BEAD_STEP, angleDelta, createBeadMotion } from './beads-core.mjs';
export function createBeadView(canvas,{motion=createBeadMotion(),onStep,onChange}){
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(37,1,.1,20);camera.position.set(0,.1,8.2);
 scene.add(new THREE.HemisphereLight('#fff5df','#53402c',2.5));const light=new THREE.DirectionalLight('#fff0d0',3);light.position.set(-3,4,5);scene.add(light);
 const strand=new THREE.Group();strand.rotation.x=.20;scene.add(strand);
 const grain=document.createElement('canvas');grain.width=grain.height=256;const ctx=grain.getContext('2d');ctx.fillStyle='#896443';ctx.fillRect(0,0,256,256);
 for(let i=0;i<120;i++){ctx.strokeStyle=i%3?'#68472c35':'#d2b28470';ctx.lineWidth=i%3?.8:1.6;ctx.beginPath();for(let x=0;x<=256;x+=8){const y=i*2.3+Math.sin(x*.026+i*.3)*4; x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
 const texture=new THREE.CanvasTexture(grain);texture.colorSpace=THREE.SRGBColorSpace;
 const wood=new THREE.MeshStandardMaterial({color:'#c3a278',map:texture,roughness:.38,metalness:.03});
 const cord=new THREE.MeshStandardMaterial({color:'#7d4330',roughness:.9});
 const loop=new THREE.Mesh(new THREE.TorusGeometry(1.64,.017,6,100),cord);strand.add(loop);
 const beads=[];
 for(let i=0;i<BEAD_COUNT;i++){
  const a=i*BEAD_STEP,b=new THREE.Mesh(new THREE.SphereGeometry(.165,22,16),wood);b.position.set(Math.sin(a)*1.64,Math.cos(a)*1.64,0);b.rotation.set(i*.63,i*.37,i*.4);b.scale.setScalar(i%4===0?1.025:1);strand.add(b);beads.push(b);
 }
 const master=new THREE.Mesh(new THREE.SphereGeometry(.205,24,18),wood);master.position.set(0,-1.98,0);scene.add(master);
 const knot=new THREE.Mesh(new THREE.TorusGeometry(.08,.025,7,14),cord);knot.position.set(0,-2.23,0);scene.add(knot);
 for(let i=0;i<9;i++){const x=(i-4)*.018,curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,-2.24,0),new THREE.Vector3(x,-2.43,.01),new THREE.Vector3(x*1.5,-2.63,.025)]);scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve,10,.008,4,false),cord));}
 scene.position.y=.25;
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.215,.012,6,32),new THREE.MeshBasicMaterial({color:'#c5a26a',transparent:true,opacity:.65}));ring.position.set(0,1.89,.03);scene.add(ring);
 let active=false,frame=0,last=0,visualAngle=0,reduced=false,pointer=null,lastAngle=0,lastMove=0,lastSound=0;
 function resize(){const r=canvas.getBoundingClientRect();if(r.width<1||r.height<1)return;camera.aspect=r.width/r.height;camera.updateProjectionMatrix();renderer.setSize(r.width,r.height,false);}
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);
 function notify(crossed){if(crossed){const now=performance.now();if(now-lastSound>50){onStep?.();lastSound=now;}}onChange?.(motion.count,motion.angle);}
 function animate(now){if(!active)return;frame=requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;if(document.hidden)return;
  notify(motion.tick(dt));visualAngle=reduced?motion.angle:THREE.MathUtils.damp(visualAngle,motion.angle,18,dt);strand.rotation.z=visualAngle;
  renderer.render(scene,camera);
 }
 function pointerAngle(e){const b=canvas.getBoundingClientRect();return Math.atan2(e.clientY-b.top-b.height/2,e.clientX-b.left-b.width/2);}
 function finish(){pointer=null;motion.release();canvas.classList.remove('dragging');}
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0||pointer!==null)return;e.preventDefault();pointer=e.pointerId;canvas.setPointerCapture(pointer);canvas.focus({preventScroll:true});lastAngle=pointerAngle(e);lastMove=performance.now();motion.begin();canvas.classList.add('dragging');});
 canvas.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;const now=performance.now(),next=pointerAngle(e);notify(motion.drag(-angleDelta(lastAngle,next),(now-lastMove)/1000));lastAngle=next;lastMove=now;});
 canvas.addEventListener('pointerup',e=>{if(e.pointerId===pointer){if(performance.now()-lastMove>100)motion.halt();finish();}});
 canvas.addEventListener('pointercancel',()=>{motion.halt();finish();});canvas.addEventListener('lostpointercapture',()=>{finish();});
 canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight',' ','Enter'].includes(e.key)){e.preventDefault();notify(motion.step(e.key==='ArrowLeft'?-1:1));}});
 document.addEventListener('visibilitychange',()=>{last=performance.now();if(document.hidden){motion.halt();finish();}});
 return {
  get count(){return motion.count;},
  setActive(value){active=value;cancelAnimationFrame(frame);if(active){resize();last=performance.now();frame=requestAnimationFrame(animate);}else{motion.halt();finish();}},
  step(){notify(motion.step());},reset(){motion.reset();visualAngle=0;notify(0);},
  setReduced(value){reduced=value;motion.setReduced(value);},
 };
}
