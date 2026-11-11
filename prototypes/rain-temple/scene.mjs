import * as THREE from 'three';
import { createTraveler, createKoi, createPine, createMaple, createBamboo } from './models.mjs';
import { greetingEnvelope } from './beads-core.mjs';
import { LOCALES } from './i18n.mjs';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { findPath, walkable } from './walk.mjs';
import { placeStone, STONE_TOP_RADIUS, HALL_STEPS, MEDITATION_SEAT, standingHeight } from './surfaces.mjs';

export function createTemple(canvas,{onGround,onArrival,onError}) {
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#a5bfb4');scene.fog=new THREE.FogExp2('#adc5b5',.013);
  const camera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.3,140);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.075;controls.enablePan=false;controls.minDistance=8;controls.maxDistance=42;controls.minPolarAngle=.35;controls.maxPolarAngle=1.38;controls.target.set(0,.4,-1);controls.rotateSpeed=.55;
  function overview(){camera.position.set(innerWidth<600?23:18,innerWidth<600?23:13,innerWidth<600?29:23);controls.target.set(0,.5,-1);controls.update();}
  overview();
  scene.add(new THREE.HemisphereLight('#e9eee0','#526352',2.05));
  const sun=new THREE.DirectionalLight('#ffedc8',2.6);sun.position.set(-8,17,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=20;sun.shadow.camera.bottom=-20;sun.shadow.normalBias=.06;sun.shadow.bias=-.0003;sun.shadow.radius=4;scene.add(sun);
  const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.88,...extra});
  const M={stone:mat('#7f8e79'),path:mat('#a5ad98'),wood:mat('#5c5741'),darkwood:mat('#454d3e'),plaster:mat('#e3ddc0'),roof:mat('#445d51'),roofEdge:mat('#637562'),gold:mat('#bb9558',{metalness:.45,roughness:.45}),moss:mat('#768a55'),earth:mat('#7e906e'),skin:mat('#d9baa0'),robe:mat('#d6d9b9'),belt:mat('#8e9b80'),black:mat('#37483c')};
  const animations=[],fish=[],leaves=[],ripples=[],colliders=[];
  let cameraTween=null;controls.addEventListener('start',()=>{cameraTween=null;});
  canvas.addEventListener('wheel',()=>{cameraTween=null;},{passive:true});
  let seed=327;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  function mesh(geo,material,parent=scene,x=0,y=0,z=0){const o=new THREE.Mesh(geo,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function box(w,h,d,material,parent=scene,x=0,y=0,z=0){return mesh(new THREE.BoxGeometry(w,h,d),material,parent,x,y,z);}
  function cyl(r1,r2,h,material,parent=scene,x=0,y=0,z=0,n=12){return mesh(new THREE.CylinderGeometry(r1,r2,h,n),material,parent,x,y,z);}
  function ball(r,material,parent=scene,x=0,y=0,z=0,n=12){return mesh(new THREE.SphereGeometry(r,n,8),material,parent,x,y,z);}
  function branch(a,b,r,material,parent=scene){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),o=cyl(r*.7,r,av.distanceTo(bv),material,parent);o.position.copy(av).add(bv).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return o;}
  const ground=mesh(new THREE.PlaneGeometry(300,300),mat('#829878'));ground.rotation.x=-Math.PI/2;ground.position.y=-.07;ground.castShadow=false;
  // The courtyard is an organic island of gravel, threaded with an uneven stone path.
  const courtShape=new THREE.Shape();courtShape.absellipse(0,0,14.3,14.3*.92,0,Math.PI*2,false);
  const pondHole=new THREE.Path();pondHole.absellipse(6,-3,3.04,2.64,0,Math.PI*2,true);courtShape.holes.push(pondHole);
  const courtyard=mesh(new THREE.ExtrudeGeometry(courtShape,{depth:.15,bevelEnabled:false,curveSegments:64}),M.earth);courtyard.rotation.x=-Math.PI/2;courtyard.position.y=-.105;courtyard.castShadow=false;
  const stoneFootprints=[];
  function stone(x,z,w=1.1,d=.8){
    if(!placeStone(stoneFootprints,x,z,w,d))return;
    const o=cyl(STONE_TOP_RADIUS,.43,.09,rand()>.3?M.path:M.stone,scene,x,.08,z,6);o.scale.set(w,1,d);return o;
  }
  for(let z=9;z>=-5;z-=.9){stone(-.62+(rand()-.5)*.12,z,1.3,.98);stone(.65+(rand()-.5)*.12,z+.1,1.3,.98);}
  for(let x=-6.7;x<3.5;x+=.9){stone(x,-2.2,1,.9);stone(x,-3,1,.9);}
  for(let z=-1.4;z<=3.4;z+=.85)stone(2.65,z,1.2,.9);
  // Gravel clusters and moss sit outside walkways, without texture downloads.
  const pebbleGeo=new THREE.IcosahedronGeometry(.08,0),pebbles=new THREE.InstancedMesh(pebbleGeo,M.stone,350),dummy=new THREE.Object3D();let pc=0;
  for(let i=0;i<600&&pc<350;i++){const x=(rand()-.5)*25,z=(rand()-.5)*22;if(Math.abs(x)<1.4||!walkable(x,z))continue;dummy.position.set(x,.02,z);dummy.scale.setScalar(.35+rand());dummy.updateMatrix();pebbles.setMatrixAt(pc++,dummy.matrix);}pebbles.count=pc;scene.add(pebbles);
  // Mountains recede into the mist in three desaturated layers.
  for(let layer=0;layer<3;layer++)for(let i=0;i<10;i++){
    const mountain=cyl(.1,5+rand()*5,8+rand()*10,mat(['#8da696','#7e9989','#91aa99'][layer]),scene,(i-4.5)*11+(rand()-.5)*6,1,-28-layer*15,7);
    mountain.scale.z=1.3;mountain.rotation.y=rand()*3;mountain.castShadow=false;
  }
  function roof(parent,w,d,y){
    const nx=20,nz=12,positions=[],indices=[];
    for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
      const x=(i/nx-.5)*w,z=(j/nz-.5)*d,t=Math.abs(z)/(d/2);
      const h=y+1.45*(1-t)+.48*Math.pow(t,5)+.22*Math.pow(Math.abs(x)/(w/2),8)*t;
      positions.push(x,h,z);
    }
    for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;indices.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
    const top=mesh(g,M.roof,parent);top.material.side=THREE.DoubleSide;
    // Individual curved tile ribs follow the eaves; all are original geometry.
    for(let i=0;i<=30;i++){
      const x=(i/30-.5)*w,pts=[];
      for(let j=0;j<=20;j++){const z=(j/20-.5)*d,t=Math.abs(z)/(d/2);pts.push(new THREE.Vector3(x,y+1.45*(1-t)+.48*t**5+.22*(Math.abs(x)/(w/2))**8*t+.035,z));}
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),20,.038,4,false),M.roofEdge,parent);
    }
    branch([-w/2,y+1.49,0],[w/2,y+1.49,0],.095,M.roofEdge,parent);
    for(const side of [-1,1]){
      const pts=[];for(let i=0;i<=20;i++){const x=(i/20-.5)*w;pts.push(new THREE.Vector3(x,y+.48+.22*(Math.abs(x)/(w/2))**8,side*d/2));}
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),20,.065,5,false),M.roofEdge,parent);
    }
  }
  function lantern(parent,x,y,z,scale=1){
    const g=new THREE.Group();parent.add(g);g.position.set(x,y,z);g.scale.setScalar(scale);
    cyl(.07,.07,.4,M.darkwood,g,0,.45,0);cyl(.28,.28,.04,M.darkwood,g,0,.21,0);
    const glow=mat('#f3c778',{emissive:'#edb959',emissiveIntensity:.8,roughness:.9});cyl(.23,.2,.5,glow,g,0,-.05,0,10);
    cyl(.28,.24,.06,M.darkwood,g,0,-.32,0);branch([0,-.32,0],[0,-.53,0],.018,M.gold,g);
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;branch([Math.sin(a)*.225,-.27,Math.cos(a)*.225],[Math.sin(a)*.225,.18,Math.cos(a)*.225],.012,M.gold,g);}
    animations.push({object:g,kind:'lantern',offset:rand()*6});return g;
  }
  // Main hall: raised stone base, colonnade, timber lattice, curved tile roof.
  const hall=new THREE.Group();hall.position.set(0,0,-7.6);scene.add(hall);
  box(10.4,.35,5.1,M.stone,hall,0,.12,0);box(10,.18,4.8,M.path,hall,0,.38,0);
  for(const step of HALL_STEPS)box(step.width,step.height,step.depth,M.stone,scene,step.x,step.y,step.z);
  box(9.5,2.8,.22,M.plaster,hall,0,1.85,-2.1);box(.2,2.8,4.2,M.plaster,hall,-4.7,1.85,0);box(.2,2.8,4.2,M.plaster,hall,4.7,1.85,0);
  for(const x of [-4.5,-3,-1.5,1.5,3,4.5]){cyl(.105,.14,3.2,M.darkwood,hall,x,2,1.9);cyl(.21,.24,.2,M.stone,hall,x,.54,1.9);}
  box(9.6,.22,.25,M.darkwood,hall,0,3.38,1.9);
  for(const x of [-3.5,-1.9,1.9,3.5]){
    box(1.3,2.2,.07,M.wood,hall,x,1.8,1.75);
    box(1.12,1.57,.08,M.plaster,hall,x,2,1.79);
    for(let j=0;j<6;j++)box(.025,1.62,.045,M.darkwood,hall,x-.5+j*.2,2,1.85).castShadow=false;
    for(let j=0;j<7;j++)box(1.18,.025,.05,M.darkwood,hall,x,1.24+j*.25,1.85).castShadow=false;
  }
  box(1.5,2.7,.13,M.darkwood,hall,0,1.83,1.65);box(1.1,.1,.7,M.wood,hall,0,.75,.6);
  // A simple round landscape screen, not a reproduction of any religious statue.
  const screen=cyl(.72,.72,.08,M.gold,hall,0,2.1,-1.82,40);screen.rotation.x=Math.PI/2;
  const signCanvas=document.createElement('canvas');signCanvas.width=512;signCanvas.height=128;const sc=signCanvas.getContext('2d');sc.fillStyle='#394f40';sc.fillRect(0,0,512,128);sc.strokeStyle='#af9c68';sc.lineWidth=4;sc.strokeRect(10,10,492,108);sc.font='54px "Songti SC",serif';sc.fillStyle='#d9c693';sc.textAlign='center';sc.fillText('听 雨 山 寺',256,84);
  function setLanguage(lang){sc.fillStyle='#394f40';sc.fillRect(0,0,512,128);sc.strokeStyle='#af9c68';sc.lineWidth=4;sc.strokeRect(10,10,492,108);sc.font=lang==='en'?'44px Georgia,serif':lang==='ko'?'48px "Apple SD Gothic Neo",sans-serif':lang==='ja'?'54px "Hiragino Mincho ProN",serif':'54px "Songti SC",serif';sc.fillStyle='#d9c693';sc.textAlign='center';sc.fillText((LOCALES[lang]||LOCALES.en).sign,256,84);signMat.map.needsUpdate=true;}
  const signMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(signCanvas)});box(2.8,.7,.09,signMat,hall,0,3.18,2.04);
  roof(hall,11.5,6.2,3.4);lantern(hall,-4,3,2.2,.85);lantern(hall,4,3,2.2,.85);
  // Bell pavilion.
  const pavilion=new THREE.Group();pavilion.position.set(-7.1,0,-3.5);scene.add(pavilion);box(3,.25,3,M.stone,pavilion,0,.1,0);
  for(const x of [-1.1,1.1])for(const z of [-1.1,1.1])cyl(.08,.12,2.8,M.darkwood,pavilion,x,1.5,z);
  roof(pavilion,3.7,3.7,2.8);branch([-1.1,2.7,0],[1.1,2.7,0],.08,M.wood,pavilion);
  const bellGroup=new THREE.Group();bellGroup.position.set(0,1.6,0);pavilion.add(bellGroup);
  const bellPoints=[new THREE.Vector2(.5,-.55),new THREE.Vector2(.48,-.4),new THREE.Vector2(.37,.4),new THREE.Vector2(.2,.6),new THREE.Vector2(.05,.64)];
  mesh(new THREE.LatheGeometry(bellPoints,24),M.gold,bellGroup);cyl(.08,.08,.3,M.darkwood,pavilion,0,2.45,0);for(const y of [-.3,0,.3]){const ring=mesh(new THREE.TorusGeometry(.43-y*.15,.02,5,24),M.darkwood,bellGroup,0,y,0);ring.rotation.x=Math.PI/2;}
  // Low perimeter fence gives the courtyard a clear edge.
  for(const side of [-1,1])for(let z=-7;z<9;z+=1.3){cyl(.05,.065,.85,M.wood,scene,side*10.6,.4,z);if(z<7.5)for(const y of [.3,.65])branch([side*10.6,y,z],[side*10.6,y,z+1.3],.035,M.wood);}
  // Small entrance roof at the near edge, with open passage.
  const gate=new THREE.Group();gate.position.set(-.1,0,9.5);scene.add(gate);for(const x of [-1.8,1.8]){cyl(.13,.16,2.8,M.wood,gate,x,1.4,0);cyl(.3,.34,.2,M.stone,gate,x,.1,0);}roof(gate,4.8,2.5,2.8);lantern(gate,-1.3,2.25,0,.75);lantern(gate,1.3,2.25,0,.75);
  // Pond surface: analytic waves and light reflections, no expensive transmission pass.
  const waterMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},strength:{value:1}},vertexShader:`varying vec3 v; void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 v;uniform float time;uniform float strength;void main(){float a=sin(v.x*9.+v.y*7.+time*.8)*sin(v.y*14.-time*.6);float b=sin(length(v.xy-vec2(.5,.2))*50.-time*2.);vec3 c=mix(vec3(.14,.31,.28),vec3(.38,.54,.43),v.y*.3+.55);c+=(a*.017+b*.007)*strength;float stripe=pow(max(0.,sin(v.x*2.+v.y*4.+a*.08)),20.)*.08;c+=stripe;gl_FragColor=vec4(c,.30);}`});
  const pondBed=mesh(new THREE.CircleGeometry(1,72),mat('#24483d'),scene,6,-.06,3);pondBed.rotation.x=-Math.PI/2;pondBed.scale.set(3.04,2.64,1);pondBed.castShadow=false;
  const pond=mesh(new THREE.CircleGeometry(1,72),waterMat,scene,6,.09,3);pond.scale.set(3,2.6,1);pond.rotation.x=-Math.PI/2;pond.castShadow=false;
  for(let i=0;i<40;i++){const a=i/40*Math.PI*2,o=mesh(new THREE.DodecahedronGeometry(.35+rand()*.17,0),rand()>.3?M.stone:M.moss,scene,6+Math.cos(a)*3.12,.13,3+Math.sin(a)*2.74);o.scale.set(1.3,.65,1);o.rotation.set(rand(),rand(),rand());}
  for(let i=0;i<8;i++){
    const koi=createKoi(i);scene.add(koi.group);koi.group.position.set(6+Math.sin(i/8*Math.PI*2)*1.6,.025,3+Math.cos(i/8*Math.PI*2)*1.1);
    fish.push({...koi,phase:i/8*Math.PI*2,speed:.11+rand()*.06,r:1.1+rand()*.9,index:i});
  }
  for(let i=0;i<7;i++){const x=6+(rand()-.5)*3,z=3+(rand()-.5)*2.5;const pad=mesh(new THREE.CircleGeometry(.22+rand()*.12,20),mat('#6b8c58',{side:THREE.DoubleSide}),scene,x,.107,z);pad.rotation.x=-Math.PI/2;if(i%3===0){const flower=new THREE.Group();flower.position.set(x,.16,z);scene.add(flower);for(let k=0;k<6;k++){const petal=ball(.1,mat('#dfc6b2'),flower,Math.cos(k)*.08,.03,Math.sin(k)*.08);petal.scale.set(.65,1,.5);petal.rotation.z=k;}}}
  // Vegetation: pines, bamboo with nodes, and a copper maple.
  function pine(x,z,s=1){const g=createPine(rand);g.position.set(x,0,z);g.scale.setScalar(s);scene.add(g);return g;}
  for(const [x,z,s] of [[-9,-7,1.4],[-10,-4,1.15],[-9,2,1.1],[-7,7,1.05],[10,-8,1.4],[9,-5,1.05],[12,6,1],[-6,-13,1.6],[6,-14,1.7],[0,-15,1.5],[-12,-11,1.7],[12,-12,1.6]])pine(x,z,s);
  for(let i=0;i<32;i++){
    const x=i<17?-8.2-rand()*3:8.8+rand()*2,z=i<17?rand()*9-1:-8+rand()*7;
    const g=createBamboo(rand,2.7+rand()*2.5);g.position.set(x,0,z);scene.add(g);animations.push({object:g,kind:'bamboo',offset:rand()*6});
  }
  const maple=createMaple(rand);maple.position.set(-4.8,0,4.2);scene.add(maple);
  const autumn=['#ad8054','#c49c5f','#947846','#b6a36e'].map(c=>mat(c));
  for(let i=0;i<18;i++){const l=mesh(new THREE.PlaneGeometry(.09,.16),autumn[i%4],scene,-6+rand()*4,rand()*4,2+rand()*5);l.material.side=THREE.DoubleSide;leaves.push({object:l,phase:rand()*6,speed:.15+rand()*.2});}
  for(let i=0;i<30;i++){const x=(rand()-.5)*24,z=(rand()-.5)*22;if(Math.abs(x)<2||!walkable(x,z))continue;const bush=ball(.25+rand()*.3,M.moss,scene,x,.04,z,6);bush.scale.y=.35;}
  for(const [x,z] of [[-1.9,5.3],[1.9,5.3],[-3.1,-3],[3.2,-3],[3.4,5.8],[-6.3,2]]){
    cyl(.22,.3,.2,M.stone,scene,x,.1,z);box(.25,.7,.25,M.stone,scene,x,.5,z);box(.5,.43,.5,mat('#e2cc91',{emissive:'#caa568',emissiveIntensity:.7}),scene,x,1,z);cyl(.43,.32,.22,M.roof,scene,x,1.32,z,4);
  }
  // Meditation cushion and wooden fish stand in front of the hall.
  const seat=MEDITATION_SEAT;
  cyl(seat.baseRadius,seat.baseRadius,seat.baseHeight,M.stone,scene,seat.x,seat.baseY,seat.z,24);
  const cushion=cyl(.49,seat.radius,seat.height,mat('#a39f70'),scene,seat.x,seat.y,seat.z,32);
  const stand=new THREE.Group();stand.position.set(2.5,0,-5);scene.add(stand);box(.65,.5,.5,M.wood,stand,0,.35,0);const woodenFish=ball(.26,mat('#b18b50'),stand,0,.75,0);woodenFish.scale.set(1,.85,.85);box(.35,.015,.035,M.darkwood,stand,0,.95,.07);
  // Articulated traveler with a wrapped tunic, woven hat and modeled face.
  const traveler=createTraveler(),avatar=traveler.group;avatar.position.set(0,.115,5.5);scene.add(avatar);
  // Shadow blob anchors the traveler even in reduced quality mode.
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const sh=shadowCanvas.getContext('2d'),grad=sh.createRadialGradient(32,32,1,32,32,31);grad.addColorStop(0,'#1a302c80');grad.addColorStop(1,'#1a302c00');sh.fillStyle=grad;sh.fillRect(0,0,64,64);const shadow=mesh(new THREE.PlaneGeometry(1.2,1.2),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}),scene,0,.13,5.5);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;
  // Destination rings and rain streaks are reused rather than allocated per frame.
  const destination=mesh(new THREE.RingGeometry(.24,.28,36),new THREE.MeshBasicMaterial({color:'#ece2b2',transparent:true,opacity:.8,side:THREE.DoubleSide}),scene,0,.17,0);destination.rotation.x=-Math.PI/2;destination.visible=false;destination.castShadow=false;
  const rainCount=1000,rainArray=new Float32Array(rainCount*6),rainBase=[];
  for(let i=0;i<rainCount;i++){rainBase.push([(rand()-.5)*32,rand()*16,(rand()-.5)*30]);}
  const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainArray,3));const rainfall=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:'#cbdcd3',transparent:true,opacity:.22,depthWrite:false}));scene.add(rainfall);rainfall.frustumCulled=false;
  // Batch opaque static meshes by material. Animated branches and interactables remain separate.
  scene.updateMatrixWorld(true);
  const dynamic=new Set([avatar,shadow,destination,woodenFish,bellGroup,pond,...animations.map(a=>a.object),...leaves.map(l=>l.object),...fish.map(f=>f.group)]);
  for(const root of dynamic)root.traverse(o=>{if(o.isMesh)o.castShadow=false;});
  const batches=new Map(),remove=[];
  scene.traverse(o=>{
    if(o.isInstancedMesh||!o.isMesh||!o.material?.isMeshStandardMaterial||o.material.transparent||o.material.map)return;
    for(let p=o;p;p=p.parent)if(dynamic.has(p))return;
    const key=o.material.uuid+':'+o.castShadow+':'+o.receiveShadow;
    if(!batches.has(key))batches.set(key,{mat:o.material,cast:o.castShadow,receive:o.receiveShadow,geos:[]});
    const clone=o.geometry.clone().applyMatrix4(o.matrixWorld);clone.deleteAttribute('uv');
    batches.get(key).geos.push(clone.index?clone.toNonIndexed():clone);remove.push(o);
  });
  for(const b of batches.values()){const g=mergeGeometries(b.geos);if(!g)continue;const m=new THREE.Mesh(g,b.mat);m.castShadow=b.cast;m.receiveShadow=b.receive;scene.add(m);for(const geo of b.geos)geo.dispose();}
  for(const o of remove)o.removeFromParent();
  let path=[],arrival=null,stance='idle',time=0,last=performance.now(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,rainMode='light',bellTime=-100,woodTime=-100,feedTime=-100,frame=0,running=true,greetingStart=-10000,beadPhase=0,pressed=new Set();
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),flatPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-.13);
  let down=null;
  canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,t:performance.now()};});
  canvas.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>7||performance.now()-down.t>600)return;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const p=new THREE.Vector3();if(ray.ray.intersectPlane(flatPlane,p))onGround(p);down=null;});
  canvas.addEventListener('pointercancel',()=>{down=null;});
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  const keys=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'];
  canvas.addEventListener('keydown',e=>{if(keys.includes(e.key)){e.preventDefault();pressed.add(e.key.toLowerCase());}});
  window.addEventListener('keyup',e=>pressed.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>pressed.clear());
  function moveTo(x,z,callback){pressed.clear();const route=findPath(avatar.position,{x,z});if(!route)return false;path=route;arrival=callback;stance='idle';destination.position.set(Math.round(x*2)/2,.18,Math.round(z*2)/2);destination.visible=path.length>0;if(!path.length){arrival=null;callback?.();}return true;}
  function cancel(){greetingStart=-10000;path=[];arrival=null;destination.visible=false;stance='idle';pressed.clear();}
  function ring(x,z,color='#d8dcb5',size=1){const r=mesh(new THREE.RingGeometry(.9,1,40),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false}),scene,x,.145,z);r.rotation.x=-Math.PI/2;r.scale.setScalar(.1);r.castShadow=false;ripples.push({object:r,born:time,size});}
  function effect(kind){if(kind==='greet'){greetingStart=performance.now();avatar.rotation.y=Math.atan2(camera.position.x-avatar.position.x,camera.position.z-avatar.position.z);}if(kind==='bell'){bellTime=time;ring(-7.1,-3.5,'#e1d4a0',3);}if(kind==='wood')woodTime=time;if(kind==='fish'){feedTime=time;ring(4.5,3,'#dfdab7',1.7);ring(4.9,3.3,'#e8dec0',1);}}
  function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
  window.addEventListener('resize',resize);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();running=false;cancelAnimationFrame(frame);onError('三维画面连接中断，请重新进入。');});
  function animate(now){if(!running)return;frame=requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;if(document.hidden)return;time+=dt;
    let walking=false;
    if(pressed.size){
      const forward=new THREE.Vector3();camera.getWorldDirection(forward);forward.y=0;forward.normalize();const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0));const step=new THREE.Vector3();
      if(pressed.has('w')||pressed.has('arrowup'))step.add(forward);if(pressed.has('s')||pressed.has('arrowdown'))step.sub(forward);if(pressed.has('d')||pressed.has('arrowright'))step.add(right);if(pressed.has('a')||pressed.has('arrowleft'))step.sub(right);
      if(step.lengthSq()>0){path=[];arrival=null;stance='idle';destination.visible=false;step.normalize().multiplyScalar(dt*2.5);const nx=avatar.position.x+step.x,nz=avatar.position.z+step.z;if(walkable(nx,nz)){avatar.position.x=nx;avatar.position.z=nz;avatar.rotation.y=Math.atan2(step.x,step.z);walking=true;}}
    }else if(path.length){const p=path[0],dx=p.x-avatar.position.x,dz=p.z-avatar.position.z,d=Math.hypot(dx,dz);walking=true;if(d<dt*2.7){avatar.position.x=p.x;avatar.position.z=p.z;path.shift();if(!path.length){destination.visible=false;const cb=arrival;arrival=null;cb?.();onArrival?.();}}else{avatar.position.x+=dx/d*dt*2.7;avatar.position.z+=dz/d*dt*2.7;avatar.rotation.y=THREE.MathUtils.lerp(avatar.rotation.y,Math.atan2(dx,dz),.25);}}
    const surface=standingHeight(avatar.position.x,avatar.position.z,stoneFootprints);
    if(walking)greetingStart=-10000;
    traveler.animate({time,walking,reduced,greeting:greetingEnvelope((now-greetingStart)/1000,reduced),beading:stance==='beads',beadPhase,sitting:stance==='sit',woodProgress:Math.min(1,(time-woodTime)/.28),dt,groundHeight:surface});
    if(time-woodTime<.28)woodenFish.scale.y=.85-Math.sin((time-woodTime)*11)*.06;
    if(time-bellTime<4)bellGroup.rotation.z=reduced?0:Math.sin((time-bellTime)*7)*.15*Math.exp(-(time-bellTime));
    shadow.position.x=avatar.position.x;shadow.position.z=avatar.position.z;shadow.position.y=(stance==='sit'?.045:surface)+.004;destination.scale.setScalar(reduced?1:1+Math.sin(time*4)*.12);
    waterMat.uniforms.time.value=reduced?0:time;waterMat.uniforms.strength.value=reduced?0:1;
    for(const f of fish){const a=f.phase+time*f.speed,feeding=time-feedTime<6;const cx=feeding?4.9:6,cz=3,r=feeding?.65+f.index*.06:f.r;const x=cx+Math.sin(a)*r,z=cz+Math.cos(a)*r*.7;const desired=new THREE.Vector3(x,.025,z);
      for(const other of fish){if(other===f)continue;const dx=f.group.position.x-other.group.position.x,dz=f.group.position.z-other.group.position.z,d=Math.hypot(dx,dz);if(d>.001&&d<.65){desired.x+=dx/d*(.65-d)*1.5;desired.z+=dz/d*(.65-d)*1.5;}}
      const previous=f.group.position.clone();f.group.position.lerp(desired,dt*1.5);
      const heading=Math.atan2(f.group.position.x-previous.x,f.group.position.z-previous.z),turn=Math.atan2(Math.sin(heading-f.group.rotation.y),Math.cos(heading-f.group.rotation.y));f.group.rotation.y+=turn*Math.min(1,dt*4);
      f.group.rotation.z=reduced?0:Math.sin(time*4+f.phase)*.025;f.animate(time,reduced);}
    for(const a of animations)if(!reduced){if(a.kind==='bamboo')a.object.rotation.z=Math.sin(time*.65+a.offset)*.017;else a.object.rotation.z=Math.sin(time*.8+a.offset)*.025;}
    for(const l of leaves){l.object.visible=!reduced;if(!reduced){l.object.position.y-=dt*l.speed;l.object.position.x+=Math.sin(time+l.phase)*dt*.1;l.object.rotation.set(time*.3+l.phase,time*.5,0);if(l.object.position.y<.1)l.object.position.y=4;}}
    rainfall.visible=!reduced&&rainMode!=='off';if(rainfall.visible){const n=rainMode==='steady'?1000:450;rainGeo.setDrawRange(0,n*2);for(let i=0;i<n;i++){const b=rainBase[i],y=((b[1]-time*7)%16+16)%16;rainArray.set([b[0],y,b[2],b[0]+.06,y-.35,b[2]+.03],i*6);}rainGeo.attributes.position.needsUpdate=true;}
    if(!reduced&&rainMode!=='off'&&Math.random()<dt*4)ring(6+(rand()-.5)*4,3+(rand()-.5)*3,'#c0d5b6',.25+rand()*.3);
    for(let i=ripples.length-1;i>=0;i--){const r=ripples[i],age=(time-r.born)/2;if(age>=1){scene.remove(r.object);r.object.geometry.dispose();r.object.material.dispose();ripples.splice(i,1);}else{r.object.scale.setScalar((.1+age)*r.size);r.object.material.opacity=(1-age)*.55;}}
    if(cameraTween){const a=reduced?1:Math.min(1,(time-cameraTween.time)/1.3),e=1-(1-a)**3;camera.position.lerpVectors(cameraTween.from,cameraTween.to,e);controls.target.lerpVectors(cameraTween.targetFrom,cameraTween.targetTo,e);if(a===1)cameraTween=null;}
    controls.update();renderer.render(scene,camera);
  }
  renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  frame=requestAnimationFrame(animate);
  document.addEventListener('visibilitychange',()=>{pressed.clear();last=performance.now();});
  return {moveTo,cancel,effect,setLanguage,setBeadPhase(value){beadPhase=value;},focusTraveler(){const direction=camera.position.clone().sub(avatar.position);direction.y=0;direction.normalize();avatar.rotation.y=Math.atan2(direction.x,direction.z);cameraTween={from:camera.position.clone(),to:new THREE.Vector3(avatar.position.x+direction.x*8,4.6,avatar.position.z+direction.z*8),targetFrom:controls.target.clone(),targetTo:new THREE.Vector3(avatar.position.x,.85,avatar.position.z),time};},overview(){cameraTween=null;overview();},focusPlace(x,z){cameraTween={from:camera.position.clone(),to:new THREE.Vector3(x+7,6.5,z+9),targetFrom:controls.target.clone(),targetTo:new THREE.Vector3(x,.8,z),time};},setStance(value){stance=value;},setReduced(value){reduced=value;for(const a of animations)a.object.rotation.z=0;},setRain(value){rainMode=value;},getPosition(){return {x:avatar.position.x,z:avatar.position.z};},capture(){renderer.render(scene,camera);return canvas.toDataURL('image/png');}};
}
