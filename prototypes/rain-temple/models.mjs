import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const material=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.83,...extra});
const P={
 bark:material('#ffffff',{vertexColors:true}),needles:material('#ffffff',{side:THREE.DoubleSide}),maple:material('#ffffff',{side:THREE.DoubleSide}),
 bamboo:material('#708657'),nodes:material('#526849'),leaf:material('#ffffff',{side:THREE.DoubleSide}),
 cloth:material('#c5c8ae'),trim:material('#e4dfcb'),pants:material('#8a9a87'),sash:material('#727e68'),
 skin:material('#c9a58a',{roughness:.7}),hair:material('#43443a'),eye:material('#292e28',{roughness:.32}),hat:material('#baa77d'),hatRib:material('#95835e'),shoe:material('#4c5748'),
 koi:material('#ffffff',{vertexColors:true,roughness:.36,metalness:.06}),fin:material('#d7b786',{side:THREE.DoubleSide,roughness:.55}),finRay:material('#9c855d'),
};
function add(parent,geometry,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function ellipsoid(parent,mat,x,y,z,sx,sy,sz,segments=20){const m=add(parent,new THREE.SphereGeometry(1,segments,14),mat,x,y,z);m.scale.set(sx,sy,sz);return m;}
function tapered(parent,a,b,r1,r2,mat=P.bark){
 const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),length=av.distanceTo(bv);
 const geo=new THREE.CylinderGeometry(r2,r1,length,10,5);
 if(mat.vertexColors){const p=geo.attributes.position,colors=[];const base=new THREE.Color();for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=p.getY(i),v=.8+Math.sin(Math.atan2(z,x)*9+y*2)*.1;base.setRGB(.29*v,.25*v,.18*v);colors.push(base.r,base.g,base.b);}geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));}
 const mesh=add(parent,geo,mat);mesh.position.copy(av).add(bv).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return mesh;
}
function batchLocal(root){
 root.updateWorldMatrix(true,true);const inverse=new THREE.Matrix4().copy(root.matrixWorld).invert();const groups=new Map(),old=[];root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh)return;const key=o.material.uuid;if(!groups.has(key))groups.set(key,{mat:o.material,geos:[]});const g=o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));groups.get(key).geos.push(g.index?g.toNonIndexed():g);old.push(o);});
 for(const g of groups.values()){const merged=mergeGeometries(g.geos);if(merged){add(root,merged,g.mat);for(const geo of g.geos)geo.dispose();}}
 for(const o of old)o.removeFromParent();
}
function foldedRobe(){
 const points=[new THREE.Vector2(.25,-.34),new THREE.Vector2(.27,-.28),new THREE.Vector2(.235,-.09),new THREE.Vector2(.22,.15),new THREE.Vector2(.245,.25),new THREE.Vector2(.13,.34)];
 const geo=new THREE.LatheGeometry(points,40);const p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=p.getY(i),a=Math.atan2(z,x),fold=1+Math.sin(a*10+y*2)*.022+Math.cos(a*17)*.008;p.setXYZ(i,x*fold,y,z*fold*.78);}
 geo.computeVertexNormals();return geo;
}
export function createTraveler(){
 const group=new THREE.Group(),body=new THREE.Group(),head=new THREE.Group();body.position.y=.81;group.add(body);head.position.y=1.33;group.add(head);
 add(body,foldedRobe(),P.cloth);tapered(body,[-.11,.30,.16],[.14,-.08,.19],.035,.032,P.trim);tapered(body,[.11,.30,.16],[-.04,.1,.2],.032,.027,P.trim);
 const belt=add(body,new THREE.CylinderGeometry(.239,.242,.07,32),P.sash,0,-.035,0);belt.scale.z=.8;
 ellipsoid(body,P.sash,.18,-.03,.15,.042,.048,.034);tapered(body,[.18,-.04,.16],[.18,-.25,.20],.019,.023,P.sash);
 add(group,new THREE.CylinderGeometry(.065,.075,.12,16),P.skin,0,1.17,0);
 ellipsoid(head,P.skin,0,0,0,.155,.19,.155,28);ellipsoid(head,P.hair,0,.07,-.025,.158,.13,.143,24);
 // Small features stand proud of the skin, never on a coplanar face texture.
 for(const side of [-1,1]){ellipsoid(head,P.skin,side*.153,-.01,0,.034,.052,.023,14);ellipsoid(head,P.eye,side*.061,.015,.143,.012,.009,.008,12);tapered(head,[side*.035,.047,.143],[side*.082,.049,.132],.006,.005,P.hair);}
 ellipsoid(head,P.skin,0,-.014,.155,.022,.032,.029,14);tapered(head,[-.027,-.077,.139],[.027,-.077,.139],.003,.003,P.hair);
 const brim=add(head,new THREE.ConeGeometry(.32,.15,48),P.hat,0,.255,0);const rim=add(head,new THREE.TorusGeometry(.32,.009,5,48),P.hatRib,0,.18,0);rim.rotation.x=Math.PI/2;
 for(let i=0;i<24;i++){const a=i/24*Math.PI*2;tapered(head,[Math.sin(a)*.03,.319,Math.cos(a)*.03],[Math.sin(a)*.305,.187,Math.cos(a)*.305],.0018,.0018,P.hatRib);}
 for(const r of [.13,.22]){const ring=add(head,new THREE.TorusGeometry(r,.0025,4,40),P.hatRib,0,.33-r/.32*.15,0);ring.rotation.x=Math.PI/2;}
 const strap=new THREE.CatmullRomCurve3([new THREE.Vector3(-.15,.16,.03),new THREE.Vector3(-.14,-.17,.02),new THREE.Vector3(0,-.24,.1),new THREE.Vector3(.14,-.17,.02),new THREE.Vector3(.15,.16,.03)]);add(head,new THREE.TubeGeometry(strap,24,.005,4,false),P.hatRib);
 const arms=[],forearms=[],hands=[],legs=[],knees=[];
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.275,1.07,0);group.add(arm);arms.push(arm);
  tapered(arm,[0,0,0],[side*.005,-.24,0],.10,.078,P.cloth);
  const forearm=new THREE.Group();forearm.position.y=-.24;arm.add(forearm);forearms.push(forearm);
  tapered(forearm,[0,0,0],[0,-.20,0],.079,.064,P.cloth);
  add(forearm,new THREE.CylinderGeometry(.066,.069,.04,16),P.trim,0,-.20,0);
  const hand=new THREE.Group();hand.name=side<0?'palm-left':'palm-right';hand.position.set(0,-.245,0);forearm.add(hand);hands.push(hand);
  ellipsoid(hand,P.skin,0,-.025,.007,.036,.049,.022,16);
  for(let finger=0;finger<4;finger++)ellipsoid(hand,P.skin,(finger-1.5)*.016,-.082+(finger===0||finger===3?.01:0),.009,.008,.035,.009,10);
  ellipsoid(hand,P.skin,-side*.035,-.025,.024,.014,.031,.014,12);
  const leg=new THREE.Group();leg.position.set(side*.13,.49,0);group.add(leg);legs.push(leg);
  tapered(leg,[0,0,0],[0,-.22,0],.10,.078,P.pants);
  const knee=new THREE.Group();knee.position.y=-.22;leg.add(knee);knees.push(knee);
  tapered(knee,[0,0,0],[0,-.20,0],.078,.055,P.pants);
  ellipsoid(knee,P.shoe,0,-.205,.055,.069,.047,.13,20);
  const sole=ellipsoid(knee,P.trim,0,-.236,.055,.071,.012,.132,18);
 }
 // Keep elbows and wrists separate so palms can meet at chest height.
 for(const part of [body,head,...knees])batchLocal(part);
 for(let i=0;i<2;i++){
  hands[i].removeFromParent();batchLocal(forearms[i]);forearms[i].add(hands[i]);batchLocal(hands[i]);
  forearms[i].removeFromParent();batchLocal(arms[i]);arms[i].add(forearms[i]);
 }
 const heldBeads=new THREE.Group();heldBeads.position.set(0,.75,.25);group.add(heldBeads);
 const beadMat=material('#967146',{roughness:.4}),cordMat=material('#75513a');
 add(heldBeads,new THREE.TorusGeometry(.11,.004,4,32),cordMat);
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2;add(heldBeads,new THREE.SphereGeometry(.015,8,6),beadMat,Math.sin(a)*.11,Math.cos(a)*.11,0);}
 batchLocal(heldBeads);heldBeads.visible=false;
 const down=new THREE.Vector3(0,-1,0);
 function poseHands(weight,beading){
  if(weight<=0)return;
  for(let i=0;i<2;i++){
   const side=i===0?-1:1,shoulder=arms[i].position.clone(),target=new THREE.Vector3(side*(beading?.085:.024),beading?.85:.955,beading?.28:.23);
   const direction=target.clone().sub(shoulder),distance=direction.length();direction.normalize();
   const projection=(.24**2-.245**2+distance**2)/(2*distance),height=Math.sqrt(Math.max(0,.24**2-projection**2));
   const bend=new THREE.Vector3(side*.45,-1,-.1);bend.addScaledVector(direction,-bend.dot(direction)).normalize();
   const elbow=shoulder.clone().addScaledVector(direction,projection).addScaledVector(bend,height);
   const upperQ=new THREE.Quaternion().setFromUnitVectors(down,elbow.clone().sub(shoulder).normalize());
   const lowerQ=new THREE.Quaternion().setFromUnitVectors(down,target.clone().sub(elbow).normalize());
   const lowerLocal=upperQ.clone().invert().multiply(lowerQ);
   const palmQ=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,-side*Math.PI/2,Math.PI,'YXZ'));
   const palmLocal=lowerQ.clone().invert().multiply(palmQ);
   arms[i].quaternion.slerp(upperQ,weight);forearms[i].quaternion.slerp(lowerLocal,weight);hands[i].quaternion.slerp(palmLocal,weight);
  }
 }
 let walkBlend=0;
 function animate({time,walking=false,reduced=false,sitting=false,woodProgress=1,dt=.016,groundHeight=.125,greeting=0,beading=false,beadPhase=0}){
  walkBlend=reduced?0:THREE.MathUtils.damp(walkBlend,walking?1:0,12,dt);const gait=Math.sin(time*8.5)*.48*walkBlend;
  group.position.y=groundHeight-.01+Math.abs(Math.sin(time*8.5))*.015*walkBlend;
  body.scale.y=1;body.rotation.z=Math.sin(time*4.25)*.015*walkBlend;head.rotation.z=Math.sin(time*2)*.012*(reduced?0:1);
  for(let i=0;i<2;i++){const side=i===0?-1:1;legs[i].rotation.set(i===0?gait:-gait,0,0);knees[i].rotation.x=Math.max(0,(i===0?-gait:gait))*.7;arms[i].rotation.set(i===0?-gait*.55:gait*.55,0,side*-.035);forearms[i].rotation.set(0,0,0);hands[i].rotation.set(0,0,0);}
  if(sitting){group.position.y=-.195;group.rotation.y=Math.PI;body.rotation.z=0;head.rotation.z=0;for(let i=0;i<2;i++){const side=i===0?-1:1;legs[i].rotation.set(-Math.PI/2,side*.75,side*.08);knees[i].rotation.x=2.5;arms[i].rotation.set(-.62,side*-.15,side*.18);}}
  poseHands(beading?1:greeting,beading);heldBeads.visible=beading;heldBeads.rotation.z=beadPhase*.15;
  if(greeting>0){head.rotation.x=.07*greeting;body.rotation.x=.035*greeting;}else{head.rotation.x=0;body.rotation.x=0;}
  if(woodProgress<1)arms[1].rotation.x=-.7+Math.sin(woodProgress*Math.PI)*.45;
 }
 return {group,animate};
}

function koiBody(pattern){
 const rings=26,sides=20,positions=[],colors=[],uvs=[],indices=[],color=new THREE.Color();
 for(let j=0;j<=rings;j++){
  const t=j/rings,z=-.38+t*.69,profile=Math.pow(Math.sin(Math.PI*t),.7)*(.65+t*.5)+.055;
  for(let i=0;i<=sides;i++){
   const a=i/sides*Math.PI*2,x=Math.cos(a)*.12*profile,y=Math.sin(a)*.075*profile;
   positions.push(x,y,z);uvs.push(i/sides,t);
   const angular=(center)=>Math.atan2(Math.sin(a-center),Math.cos(a-center));
   const red=[.24+(pattern%3)*.025,.54,.81-(pattern%2)*.06].some((center,k)=>((t-center)/(.105+(k%2)*.025))**2+(angular(Math.PI/2+Math.sin(pattern+k)*.6)/1.35)**2<1);
   const dark=pattern%3===2&&((t-.42)/.07)**2+(angular(Math.PI/2-.9)/.6)**2<1;
   color.set(dark?'#363c35':red?(pattern%2?'#c18138':'#bf5f35'):'#e0dfce');const scaleShade=.975+.025*Math.sin(t*140+Math.floor(i/2));color.multiplyScalar(scaleShade);colors.push(color.r,color.g,color.b);
  }
 }
 for(let j=0;j<rings;j++)for(let i=0;i<sides;i++){const a=j*(sides+1)+i;indices.push(a,a+1,a+sides+1,a+1,a+sides+2,a+sides+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function finShape(points){const s=new THREE.Shape();s.moveTo(...points[0]);for(const p of points.slice(1))s.lineTo(...p);s.closePath();return new THREE.ShapeGeometry(s);}
export function createKoi(pattern=0){
 const group=new THREE.Group();add(group,koiBody(pattern),P.koi);
 for(const side of [-1,1]){ellipsoid(group,P.eye,side*.068,.033,.224,.015,.013,.014,10);const whisker=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.025,-.01,.301),new THREE.Vector3(side*.055,-.014,.325),new THREE.Vector3(side*.075,-.005,.31)]);add(group,new THREE.TubeGeometry(whisker,8,.002,3,false),P.fin);}
 const tail=new THREE.Group();tail.position.z=-.35;group.add(tail);
 const tailMesh=add(tail,finShape([[0,0],[-.16,-.22],[-.12,-.03],[0,-.10],[.12,-.03],[.16,-.22]]),P.fin);tailMesh.rotation.x=Math.PI/2;
 for(const side of [-1,1])for(let i=0;i<3;i++)tapered(tail,[0,0,0],[side*(.06+i*.045),0,-.09-i*.06],.001,.001,P.finRay);
 const fins=[];
 for(const side of [-1,1]){const fin=new THREE.Group();group.add(fin);fin.position.set(side*.09,-.01,.06);const f=add(fin,finShape([[0,0],[side*.14,.02],[side*.2,-.10],[side*.04,-.12]]),P.fin);f.rotation.x=Math.PI/2;fins.push(fin);}
 const dorsal=add(group,finShape([[-.18,0],[.03,.09],[.16,.03],[.16,0]]),P.fin,0,.065,0);dorsal.rotation.y=Math.PI/2;
 const moving=[tail,...fins];for(const part of moving)part.removeFromParent();batchLocal(group);for(const part of moving)group.add(part);batchLocal(tail);
 function animate(time,reduced=false){tail.rotation.y=reduced?0:Math.sin(time*5+pattern)*.24;for(let i=0;i<fins.length;i++)fins[i].rotation.z=reduced?0:Math.sin(time*4+pattern+i)*.18;}
 return {group,animate};
}

function needleTuft(){
 const vertices=[];
 for(let i=0;i<7;i++){const a=i/7*Math.PI*2,x=Math.cos(a),z=Math.sin(a);vertices.push(-z*.025,0,x*.025,x*.16,.075+(i%2)*.04,z*.16,z*.025,0,-x*.025);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();return g;
}
function mapleLeaf(){
 const s=new THREE.Shape();s.moveTo(0,-.10);s.lineTo(-.045,-.035);s.lineTo(-.15,-.045);s.lineTo(-.085,.035);s.lineTo(-.14,.10);s.lineTo(-.055,.085);s.lineTo(0,.22);s.lineTo(.055,.085);s.lineTo(.14,.10);s.lineTo(.085,.035);s.lineTo(.15,-.045);s.lineTo(.045,-.035);s.closePath();
 const g=new THREE.ShapeGeometry(s),p=g.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.abs(p.getX(i))*.16+Math.sin(p.getY(i)*12)*.012);g.computeVertexNormals();return g;
}
function instanceLeaves(parent,geometry,mat,samples){
 const leaves=new THREE.InstancedMesh(geometry,mat,samples.length),d=new THREE.Object3D();
 samples.forEach((p,i)=>{d.position.set(...p.position);d.rotation.set(...p.rotation);d.scale.setScalar(p.scale);d.updateMatrix();leaves.setMatrixAt(i,d.matrix);leaves.setColorAt(i,new THREE.Color(p.color));});
 leaves.castShadow=true;leaves.receiveShadow=true;leaves.computeBoundingSphere();parent.add(leaves);return leaves;
}
export function createPine(rand){
 const group=new THREE.Group();
 const trunk=[[0,0,0],[.1,1.1,0],[-.05,2.3,.12],[.23,3.4,.09],[.14,4.55,.05]];
 for(let i=0;i<trunk.length-1;i++)tapered(group,trunk[i],trunk[i+1],.17-i*.035,.145-i*.035);
 const samples=[];
 for(let j=0;j<8;j++){
  const a=j*2.38,y=1.9+j*.30,r=1.15-j*.085,end=[Math.cos(a)*r,y+.25,Math.sin(a)*r];
  tapered(group,[.05,y-.30,.03],end,.055,.015);
  for(let k=0;k<3;k++){const side=(k-1)*.45;tapered(group,[end[0]*.65,y+.03,end[2]*.65],[end[0]+Math.sin(a)*side,y+.30,end[2]-Math.cos(a)*side],.018,.006);}
  for(let k=0;k<100;k++){
   const theta=rand()*Math.PI*2,radius=Math.sqrt(rand())*(.7-j*.035),height=(rand()-.5)*.35;
   samples.push({position:[end[0]+Math.cos(theta)*radius,y+.30+height,end[2]+Math.sin(theta)*radius*.8],rotation:[rand()*.5,rand()*6.28,rand()*.4],scale:.7+rand()*.65,color:['#426848','#547b4d','#6b8854','#78915c'][Math.floor(rand()*4)]});
  }
 }
 instanceLeaves(group,needleTuft(),P.needles,samples);return group;
}
export function createMaple(rand){
 const group=new THREE.Group(),samples=[];
 tapered(group,[0,0,0],[.18,1.8,.05],.20,.13);tapered(group,[.18,1.8,.05],[.3,3.65,.05],.13,.035);
 for(let i=0;i<9;i++){
  const a=i*2.4,r=1.1+rand()*.65,y=2.5+rand()*.95,end=[Math.cos(a)*r,y,Math.sin(a)*r];tapered(group,[.15,1.65+i*.13,0],end,.055,.012);
  for(let j=0;j<3;j++)tapered(group,[end[0]*.65,y-.25,end[2]*.65],[end[0]+(rand()-.5)*.7,y+.15,end[2]+(rand()-.5)*.7],.014,.004);
  for(let j=0;j<115;j++){const theta=rand()*6.28,radius=Math.sqrt(rand())*.8;samples.push({position:[end[0]+Math.cos(theta)*radius,y+(rand()-.5)*.55,end[2]+Math.sin(theta)*radius],rotation:[-.7+rand()*1.4,rand()*6.28,rand()*6.28],scale:.65+rand()*.65,color:['#b08143','#b99250','#a56438','#c1a264','#a3723e'][Math.floor(rand()*5)]});}
 }
 instanceLeaves(group,mapleLeaf(),P.maple,samples);return group;
}
export function createBamboo(rand,height){
 const group=new THREE.Group(),samples=[];
 tapered(group,[0,0,0],[.06,height,0],.05,.025,P.bamboo);
 for(let y=.45;y<height;y+=.55){add(group,new THREE.CylinderGeometry(.053,.053,.028,10),P.nodes,.06*y/height,y,0);if(y<1.5)continue;
  for(let j=0;j<3;j++){const a=rand()*6.28,tip=[Math.cos(a)*.6,y+.15,Math.sin(a)*.6];tapered(group,[.03,y,0],tip,.008,.003,P.bamboo);for(let k=0;k<6;k++){const f=.35+k*.12,side=k%2?-1:1;samples.push({position:[tip[0]*f+Math.sin(a)*side*.09,y+.15*f,tip[2]*f-Math.cos(a)*side*.09],rotation:[-.3+rand()*.6,a+side*.65,Math.PI/2+.2],scale:.7+rand()*.5,color:['#54794f','#6b8959','#446b49'][Math.floor(rand()*3)]});}}
 }
 batchLocal(group);
 // A narrow, pointed blade replaces the former oval leaf solids.
 const blade=finShape([[0,0],[-.04,.16],[0,.40],[.035,.15]]);
 const p=blade.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(p.getY(i)*8)*.025);blade.computeVertexNormals();
 instanceLeaves(group,blade,P.leaf,samples);return group;
}
