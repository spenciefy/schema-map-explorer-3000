import { defaultLiftPalette, type LiftPalette } from './resort-identity.ts';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { MapFeature } from './geography';

// Small objects are enlarged as map symbols. Route coordinates remain geographic.
export class Parts {
 pieces:THREE.BufferGeometry[]=[];
 add(g:THREE.BufferGeometry,color:number,x=0,y=0,z=0,rx=0,ry=0,rz=0){
  if(g.index){const original=g;g=g.toNonIndexed();original.dispose();}
  g.rotateX(rx);g.rotateY(ry);g.rotateZ(rz);g.translate(x,y,z);
  const c=new THREE.Color(color),a=new Float32Array(g.attributes.position.count*3);
  for(let i=0;i<a.length;i+=3){a[i]=c.r;a[i+1]=c.g;a[i+2]=c.b;}
  g.setAttribute('color',new THREE.BufferAttribute(a,3));g.deleteAttribute('uv');this.pieces.push(g);
 }
 box(w:number,h:number,d:number,c:number,x=0,y=0,z=0){this.add(new THREE.BoxGeometry(w,h,d),c,x,y,z);}
 rod(a:THREE.Vector3,b:THREE.Vector3,r:number,c:number){const g=new THREE.CylinderGeometry(r,r,a.distanceTo(b),5);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize()));const p=a.clone().add(b).multiplyScalar(.5);this.add(g,c,p.x,p.y,p.z);}
 finish(){const g=mergeGeometries(this.pieces)!;this.pieces.forEach(p=>p.dispose());return g;}
}
export const modelMaterial=()=>new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8});
const steel=0x384d52,red=0xb84b32;
export function liftDescription(f:MapFeature){
 if(f.retired)return 'Retired alignment · not animated';
 const type=f.type.replaceAll('_',' ');
 if(f.type==='mixed_lift')return f.chairSeats&&f.cabinOccupancy?`${f.chairSeats}-seat chairs / ${f.cabinOccupancy}-person gondolas`:'Mixed lift · capacities unverified';
 return f.occupancy?`${f.occupancy}-${f.type==='chair_lift'?'seat chair':`person ${type}`}`:`${type}${['chair_lift','gondola','cable_car'].includes(f.type)?' · capacity unverified':''}`;
}
export function carrierGeometry(type:string,seats:number,palette:LiftPalette=defaultLiftPalette){
 const p=new Parts(),steel=palette.structure,red=palette.carrier;
 if(type==='chair_lift'){
  const w=seats*.48;
  p.box(w+.12,.09,.10,steel,0,-1.15,.24);
  for(let i=0;i<seats;i++){const x=(i-(seats-1)/2)*.48;p.box(.43,.09,.47,0x273b46,x,-1.15,0);p.box(.43,.39,.08,red,x,-.91,-.22);}
  p.box(.07,1,.07,steel,0,-.47,-.25);p.box(w+.13,.06,.06,steel,0,-.68,.27);
  for(const x of [-w/2,w/2])p.rod(new THREE.Vector3(x,-1.13,-.24),new THREE.Vector3(x,-.67,.27),.035,steel);
 }else if(['gondola','funitel','cable_car','funicular'].includes(type)){
  const tram=type==='cable_car',w=tram?2.7:1.5,d=tram?Math.max(2.8,Math.sqrt(seats)*.47):Math.max(1.3,Math.sqrt(seats)*.55);
  p.box(w,1.05,d,palette.glazing,0,-1.25,0);p.box(w+.08,.33,d+.08,red,0,-1.9,0);p.box(w+.12,.13,d+.12,0xe2ded0,0,-.65,0);
  for(const x of [-w/2,0,w/2])p.box(.065,1.3,d+.03,steel,x,-1.28,0);
  for(const z of [-d/2,0,d/2])p.box(w+.03,1.3,.065,steel,0,-1.28,z);
  if(type==='funitel'){p.box(.09,.6,.09,steel,-.55,-.28,0);p.box(.09,.6,.09,steel,.55,-.28,0);}else p.box(.09,.6,.09,steel,0,-.28,0);
 }else{
  p.box(.055,1,.055,steel,0,-.5,0);
  if(type==='t-bar')p.box(.85,.07,.08,red,0,-1,0);
  else p.add(new THREE.CylinderGeometry(.17,.17,.05,8),red,0,-1,0);
 }
 return p.finish();
}
export interface LiftVisual {curve:THREE.CurvePath<THREE.Vector3>;length:number;mesh:THREE.InstancedMesh;count:number;size:number;spacing:number;speed:number;tram:boolean;phaseOffset:number;}
// Physical signs on station fascias, with depth testing and world-space scale.
function stationSigns(name:string,p:THREE.Vector3,size:number,spacing:number,group:THREE.Group,palette:LiftPalette){
 if(!name||typeof document==='undefined')return;
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;
 const ctx=canvas.getContext('2d')!;ctx.fillStyle='#'+palette.sign.toString(16).padStart(6,'0');ctx.fillRect(0,0,1024,128);
 ctx.fillStyle='#'+palette.lettering.toString(16).padStart(6,'0');ctx.font='600 66px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(name,512,67,960);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const material=new THREE.MeshBasicMaterial({map:texture});
 for(const side of [-1,1]){
  const front=new THREE.Mesh(new THREE.PlaneGeometry(spacing*2.85,size*.62),material);
  front.position.set(p.x,p.y+size*.4,p.z+side*size*2.005);front.rotation.y=side===1?0:Math.PI;group.add(front);
  const flank=new THREE.Mesh(new THREE.PlaneGeometry(size*3.8,size*.62),material);
  flank.position.set(p.x+side*spacing*1.505,p.y+size*.4,p.z);flank.rotation.y=side*Math.PI/2;group.add(flank);
 }
}
export function makeLift(f:MapFeature,groundPoints:THREE.Vector3[],scale:number,height:(x:number,z:number)=>number,group:THREE.Group,palette:LiftPalette=defaultLiftPalette):LiftVisual[]{
 const steel=palette.structure;
 if(groundPoints.length<2||groundPoints.every(p=>p.distanceToSquared(groundPoints[0])<1e-10))return [];
 if(f.retired||f.proposed||f.access==='private'||['zip_line','yes','pylon'].includes(f.type))return [];
 if(f.type==='magic_carpet'||f.type==='funicular'){
  const belt=new Parts();for(let i=1;i<groundPoints.length;i++){const a=groundPoints[i-1].clone(),b=groundPoints[i].clone();a.y+=.025;b.y+=.025;belt.rod(a,b,Math.max(scale*.8,.045),0x445452);}if(belt.pieces.length)group.add(new THREE.Mesh(belt.finish(),modelMaterial()));return [];
 }
 const groundCurve=new THREE.CurvePath<THREE.Vector3>();for(let i=1;i<groundPoints.length;i++)groundCurve.add(new THREE.LineCurve3(groundPoints[i-1],groundPoints[i]));
 const length=groundCurve.getLength(),surface=['platter','t-bar','j-bar','rope_tow','drag_lift','magic_carpet','funicular'].includes(f.type);
 const parts=new Parts(),size=Math.max(scale*5,.32),spacing=surface?.13:size*2,clearance=surface?size*1.6:Math.max(scale*16,size*4.4);
 const towerCount=Math.max(1,Math.ceil(length/(180*scale))),supports:THREE.Vector3[]=[];
 const mapped=f.supports||[];
 // Keep every mapped bend/terminal; use mapped pylons when available.
 const stations=mapped.filter(p=>p.kind==='station');
 let positions=mapped.length>=2?[groundPoints[0],...mapped.map(s=>new THREE.Vector3(s.point[0]*scale,0,s.point[1]*scale)),groundPoints[groundPoints.length-1]]:Array.from({length:towerCount+1},(_,i)=>groundCurve.getPoint(i/towerCount));
 const bends:THREE.Vector3[]=[];
 for(let i=1;i<groundPoints.length-1;i++){const a=groundPoints[i].clone().sub(groundPoints[i-1]).setY(0).normalize(),b=groundPoints[i+1].clone().sub(groundPoints[i]).setY(0).normalize();if(a.dot(b)<.98)bends.push(groundPoints[i]);}
 const along=(p:THREE.Vector3)=>{let distance=Infinity,progress=0,walked=0;for(let i=1;i<groundPoints.length;i++){const a=groundPoints[i-1],v=groundPoints[i].clone().sub(a).setY(0),len=v.length(),t=THREE.MathUtils.clamp(p.clone().sub(a).setY(0).dot(v)/(len*len||1),0,1),near=a.clone().addScaledVector(v,t).setY(0).distanceTo(p.clone().setY(0));if(near<distance){distance=near;progress=walked+t*len;}walked+=len;}return {distance,progress};};
 positions=[...positions,...bends].filter(p=>along(p).distance<8*scale).sort((a,b)=>along(a).progress-along(b).progress);
 for(const p of positions){if(supports.length&&p.distanceTo(new THREE.Vector3(supports[supports.length-1].x,p.y,supports[supports.length-1].z))<.08)continue;const q=p.clone();q.y=height(p.x,p.z)+clearance;supports.push(q);}
 if(supports.length<2)return [];
 // Piecewise spans with restrained cable sag, raised to maintain ground clearance.
 const pts:THREE.Vector3[]=[];
 for(let i=1;i<supports.length;i++){
  const a=supports[i-1],b=supports[i];let raise=0;
  for(let j=0;j<=12;j++){const t=j/12,p=a.clone().lerp(b,t);raise=Math.max(raise,height(p.x,p.z)+clearance*.7-p.y+Math.sin(Math.PI*t)*clearance*.10);}
  if(raise>0){a.y+=raise;b.y+=raise;}
 }
 for(let i=1;i<supports.length;i++)for(let j=i===1?0:1;j<=12;j++){const t=j/12,p=supports[i-1].clone().lerp(supports[i],t);p.y-=Math.sin(Math.PI*t)*clearance*.10;pts.push(p);}
 const curve=new THREE.CurvePath<THREE.Vector3>();for(let i=1;i<pts.length;i++)curve.add(new THREE.LineCurve3(pts[i-1],pts[i]));
 for(let i=0;i<supports.length;i++){
  const p=supports[i],t=(supports[Math.min(i+1,supports.length-1)].clone().sub(supports[Math.max(0,i-1)]).normalize()),side=new THREE.Vector3(t.z,0,-t.x).normalize();
  if(f.type==='magic_carpet')continue;
  parts.rod(new THREE.Vector3(p.x,height(p.x,p.z),p.z),p,size*.16,steel);
  parts.rod(p.clone().addScaledVector(side,-spacing*1.4),p.clone().addScaledVector(side,spacing*1.4),size*.12,steel);
  for(const sign of [-1,1]){const at=p.clone().addScaledVector(side,sign*spacing);parts.box(size*.45,size*.16,size*.65,0x86918c,at.x,at.y,at.z);}
 }
 for(const sign of surface?[0]:f.type==='funitel'?[-1.275,-.725,.725,1.275]:[-1,1])for(let i=1;i<pts.length;i++){
  const tangent=pts[i].clone().sub(pts[i-1]),side=new THREE.Vector3(tangent.z,0,-tangent.x).normalize().multiplyScalar(sign*spacing);
  const a=pts[i-1].clone().add(side),b=pts[i].clone().add(side);
  parts.rod(a,b,f.type==='magic_carpet'?size*.6:Math.max(.025,size*.055),f.type==='magic_carpet'?0x64736e:0x37494b);
 }
 if(!surface)for(const p of [supports[0],supports[supports.length-1],...stations.map(s=>new THREE.Vector3(s.point[0]*scale,height(s.point[0]*scale,s.point[1]*scale)+clearance,s.point[1]*scale))]){
  stationSigns(f.name,p,size,spacing,group,palette);
  parts.box(spacing*3,size*.7,size*4,palette.station,p.x,p.y+size*.4,p.z);parts.box(spacing*3.2,size*.16,size*4.2,palette.roof,p.x,p.y+size*.8,p.z);
 }
 if(parts.pieces.length)group.add(new THREE.Mesh(parts.finish(),modelMaterial()));
 const specs=f.type==='mixed_lift'?(f.chairSeats&&f.cabinOccupancy?[{type:'chair_lift',occupancy:f.chairSeats},{type:'gondola',occupancy:f.cabinOccupancy}]:[]):[{type:f.type,occupancy:f.occupancy}];
 return specs.flatMap((spec,index)=>{
  if(spec.type==='magic_carpet'||spec.type==='rope_tow'||spec.type==='funicular'||!spec.occupancy)return [];
  const tram=spec.type==='cable_car',count=tram?2:Math.min(36,Math.max(4,Math.floor(length/(scale*65))));
  const mesh=new THREE.InstancedMesh(carrierGeometry(spec.type,spec.occupancy,palette),modelMaterial(),count);mesh.frustumCulled=false;group.add(mesh);
  return [{curve,length:curve.getLength(),mesh,count,size,spacing:surface?0:spacing,speed:(f.speedMps|| (surface?1.8:f.detachable?5:2.5))*scale,tram,phaseOffset:index*.5/count}];
 });
}
export function updateLift(lift:LiftVisual,time:number,dummy:THREE.Object3D){
 for(let i=0;i<lift.count;i++){
  const phase=lift.tram?(Math.sin(time*lift.speed/lift.length)+1)/2:(time*lift.speed/(2*lift.length)+i/lift.count+lift.phaseOffset)%1;
  const up=lift.tram?i===0:phase<.5,t=lift.tram?(i===0?phase:1-phase):(up?phase*2:2-phase*2);
  const p=lift.curve.getPoint(t),v=lift.curve.getTangent(t),side=new THREE.Vector3(v.z,0,-v.x).normalize();
  dummy.position.copy(p).addScaledVector(side,up?lift.spacing:-lift.spacing);dummy.rotation.set(0,Math.atan2(v.x,v.z)+(up?0:Math.PI),0);dummy.scale.setScalar(lift.size);dummy.updateMatrix();lift.mesh.setMatrixAt(i,dummy.matrix);
 }
 lift.mesh.instanceMatrix.needsUpdate=true;
}
export function treeGeometry(snow=false){
 const p=new Parts();if(!snow)p.add(new THREE.CylinderGeometry(.035,.10,1.8,5),0x655d43,0,.9,0);
 for(let tier=0;tier<5;tier++)for(let branch=0;branch<5;branch++){
  const angle=branch*Math.PI*2/5+tier*1.73,radius=(1-tier*.16)*.38,y=.4+tier*.29;
  const g=new THREE.TetrahedronGeometry(1,0);g.scale(radius*.95,snow?.065:.14,radius*.40);g.rotateZ(-.2);g.rotateY(-angle);
  p.add(g,snow?0xe6e8db:0xffffff,Math.cos(angle)*radius*.55,y+(snow?.10:0),Math.sin(angle)*radius*.55);
 }
 return p.finish();
}
export function riderGeometry(board:boolean){
 const p=new Parts();
 // Forward stance, articulated knees, helmet and goggles make the silhouette legible.
 p.add(new THREE.BoxGeometry(.17,.21,.13),0xffffff,0,.34,.035,.18);
 p.add(new THREE.SphereGeometry(.074,8,6),0x263c47,0,.50,.07);
 p.box(.125,.038,.035,0x9ed8ee,0,.503,.132);
 for(const side of [-1,1]){
  const hip=new THREE.Vector3(side*.055,.25,.015),knee=new THREE.Vector3(side*.08,.15,.105),boot=new THREE.Vector3(side*.09,.055,.025);
  p.rod(hip,knee,.036,0x263d48);p.rod(knee,boot,.03,0x263d48);
  p.box(.058,.05,.11,0x172d37,side*.09,.05,.045);
  const shoulder=new THREE.Vector3(side*.095,.405,.04),elbow=new THREE.Vector3(side*.145,.31,.015),hand=new THREE.Vector3(side*.18,.28,.11);
  p.rod(shoulder,elbow,.028,0xffffff);p.rod(elbow,hand,.025,0xffffff);
  p.add(new THREE.SphereGeometry(.028,6,4),0x172d37,hand.x,hand.y,hand.z);
  if(!board){
   p.box(.055,.018,.66,0xe9b653,side*.09,.022,.025);
   p.add(new THREE.BoxGeometry(.055,.018,.09),0xe9b653,side*.09,.036,.39,-.3);
   p.box(.055,.016,.075,0x253f4d,side*.09,.027,-.255);
   p.rod(hand,new THREE.Vector3(side*.22,.015,-.23),.009,0x344d58);
   p.add(new THREE.SphereGeometry(.024,6,4),0x344d58,side*.22,.025,-.22);
  }
 }
 if(board){for(const g of p.pieces)g.rotateY(Math.PI/2);p.add(new THREE.CapsuleGeometry(.075,.52,2,8),0xe7a35c,0,.025,0,Math.PI/2);}
 return p.finish();
}
export function riderSpeed(time:number,phase:number,grade:number,board:boolean){
 const turn=.5+.5*Math.sin(time*(board?1.4:1.9)+phase*19),skill=.65+phase*.65;
 return THREE.MathUtils.clamp((8+Math.max(0,grade)*22)*skill*(.75+.25*turn),4,24);
}
