import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Resort } from './data';

const TAU = Math.PI * 2;
const clamp = THREE.MathUtils.clamp;
function rand(seed: number) { let n = seed; return () => { n = (n * 1664525 + 1013904223) >>> 0; return n / 4294967296; }; }
function hash(x: number,z: number,s: number) { const n = Math.sin(x*127.1+z*311.7+s*13.7)*43758.5453; return n-Math.floor(n); }
function noise(x: number,z: number,s: number) { const a=Math.floor(x),b=Math.floor(z); let u=x-a,v=z-b;u=u*u*(3-2*u);v=v*v*(3-2*v);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(a,b,s),hash(a+1,b,s),u),THREE.MathUtils.lerp(hash(a,b+1,s),hash(a+1,b+1,s),u),v); }
function localHeight(x: number,z: number,r: Resort) {
  const xx=x/r.radius, zz=z/r.radius;
  const a = Math.atan2(zz,xx);
  const dist=Math.sqrt(xx*xx+zz*zz);
  const radial=1+0.09*Math.sin(a*5+r.seed)+0.06*Math.sin(a*9+r.seed);
  const core = Math.max(0,1-dist/radial);
  const ridge = Math.abs(Math.sin(a*3+r.seed+dist*2));
  const detail = (noise(x*.12,z*.12,r.seed)-.5)*3.6 + (noise(x*.4,z*.4,r.seed)-.5)*1.25;
  const main=r.height*.76*Math.pow(core,1.3)*(1+ridge*.2*Math.min(1,dist*5));
  const second=r.height*.60*Math.pow(Math.max(0,1-Math.hypot((xx+.40)*1.65,(zz+.12)*1.7)),1.15);
  const third=r.height*.46*Math.pow(Math.max(0,1-Math.hypot((xx-.36)*1.85,(zz+.20)*1.9)),1.15);
  const shoulders=Math.max(main,second,third);
  return Math.max(0,shoulders+detail*Math.min(1,core*5));
}
interface Marker { element: HTMLButtonElement; point: THREE.Vector3; resort: Resort; }
interface Lift { chairs: THREE.Group[]; a: THREE.Vector3; b: THREE.Vector3; wheelA: THREE.Mesh; wheelB: THREE.Mesh; }
interface Skier { mesh: THREE.Group; resort: Resort; phase:number; lane:number; }
export class AtlasScene {
  renderer: THREE.WebGLRenderer; scene = new THREE.Scene(); camera: THREE.PerspectiveCamera; controls: OrbitControls;
  world = new THREE.Group(); markers: Marker[]=[]; lifts: Lift[]=[]; skiers: Skier[]=[];
  snow: THREE.Points; snowPositions: Float32Array; snowMaterial: THREE.PointsMaterial;
  sun: THREE.DirectionalLight; ambient: THREE.HemisphereLight; clock = new THREE.Clock();
  selected = ''; paused = false; reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  targetCamera: THREE.Vector3 | null=null; targetLook: THREE.Vector3 | null=null;
  snowfall=.6; wind=8; sunlight=1; active: Resort[]=[]; showSnow=true;
  ring: THREE.Mesh; animationId=0; frame=0; onSelect:(id:string)=>void;
  private view = new THREE.Vector3(); private elapsed=0; private mobile=innerWidth<760;
  constructor(public host:HTMLElement,public labelHost:HTMLElement,onSelect:(id:string)=>void) {
    this.onSelect=onSelect;
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    this.renderer.setClearColor(0xe9ede8,0);
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.06;
    this.renderer.domElement.setAttribute('aria-label','Interactive 3D mountain atlas. Drag to orbit, scroll to zoom. Resort buttons are available beside the map.');
    this.renderer.domElement.setAttribute('role','img');this.host.append(this.renderer.domElement);
    this.camera=new THREE.PerspectiveCamera(34,1,.1,1100);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.enableDamping=true;this.controls.dampingFactor=.07;this.controls.minDistance=45;this.controls.maxDistance=440;
    this.controls.maxPolarAngle=Math.PI*.43;this.controls.minPolarAngle=.22;this.controls.maxTargetRadius=125;
    this.controls.rotateSpeed=.55;this.controls.panSpeed=.6;this.controls.zoomSpeed=.7;
    this.controls.addEventListener('start',()=>{this.targetCamera=null;this.targetLook=null;});
    this.scene.add(this.world);
    this.ambient = new THREE.HemisphereLight(0xeaf3ff,0xc1b9a6,2.4);this.scene.add(this.ambient);
    this.sun=new THREE.DirectionalLight(0xfff4d9,3.7);this.sun.position.set(-80,140,60);this.sun.castShadow=true;
    this.sun.shadow.mapSize.set(2048,2048);this.sun.shadow.camera.left=-160;this.sun.shadow.camera.right=160;this.sun.shadow.camera.top=150;this.sun.shadow.camera.bottom=-150;
    this.sun.shadow.camera.far=450;this.sun.shadow.normalBias=.14;this.sun.shadow.bias=-.00015;this.sun.shadow.radius=3;this.scene.add(this.sun);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(1600,1600),new THREE.ShadowMaterial({color:0x486354,opacity:.12}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.4;floor.receiveShadow=true;this.scene.add(floor);
    const grid=new THREE.GridHelper(800,80,0x929f97,0xc6cfc6);grid.position.y=-1.2;(grid.material as THREE.Material).transparent=true;(grid.material as THREE.Material).opacity=.07;this.scene.add(grid);
    this.ring=new THREE.Mesh(new THREE.RingGeometry(4.2,4.45,80),new THREE.MeshBasicMaterial({color:0xd55a36,transparent:true,opacity:.75,side:THREE.DoubleSide}));this.ring.rotation.x=-Math.PI/2;this.scene.add(this.ring);
    this.snowPositions=new Float32Array(2400*3);const random=rand(91);
    for(let i=0;i<2400;i++){this.snowPositions[i*3]=(random()-.5)*260;this.snowPositions[i*3+1]=random()*90;this.snowPositions[i*3+2]=(random()-.5)*190;}
    const snowGeometry=new THREE.BufferGeometry();snowGeometry.setAttribute('position',new THREE.BufferAttribute(this.snowPositions,3));
    const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;const ctx=canvas.getContext('2d')!;const grad=ctx.createRadialGradient(16,16,0,16,16,16);grad.addColorStop(0,'rgba(255,255,255,1)');grad.addColorStop(.25,'rgba(255,255,255,0.9)');grad.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,32,32);
    this.snowMaterial=new THREE.PointsMaterial({color:0xffffff,size:.8,map:new THREE.CanvasTexture(canvas),transparent:true,opacity:.8,depthWrite:false});this.snow=new THREE.Points(snowGeometry,this.snowMaterial);this.scene.add(this.snow);
    new ResizeObserver(()=>this.resize()).observe(host);this.resize();this.home(true);this.animate();
  }
  resize(){const w=this.host.clientWidth,h=this.host.clientHeight;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();const mobile=innerWidth<760;if(mobile!==this.mobile){this.mobile=mobile;this.home(true);}}
  height(x:number,z:number){let h=1.4;for(const r of this.active)h=Math.max(h,localHeight(x-r.x,z-r.z,r)+1.4);return h;}
  setRegion(resorts:Resort[]) {
    this.world.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});
    this.world.clear();this.lifts=[];this.skiers=[];this.markers.forEach(m=>m.element.remove());this.markers=[];this.active=resorts;
    this.makeTerrain();
    for(const r of resorts){this.makeTrees(r);this.makeLift(r);this.makeVillage(r);this.makeSkiers(r);
      const el=document.createElement('button');el.className='map-marker';el.dataset.resort=r.id;el.setAttribute('aria-label',`Explore ${r.name}`);
      el.innerHTML=`<span class="marker-dot"></span><span class="marker-body"><span class="marker-name">${r.name}</span><span class="marker-weather"><span class="marker-snow">${r.snow} cm</span><span class="marker-period"> / 3 days</span></span></span>`;
      el.onclick=()=>this.onSelect(r.id);this.labelHost.append(el);this.markers.push({element:el,point:new THREE.Vector3(r.x+5,this.height(r.x+5,r.z)+7,r.z),resort:r});
    }
    this.home();
  }
  makeTerrain(){
    // A cut-out sculptural relief, deliberately schematic rather than navigable geography.
    const positions:number[]=[],colors:number[]=[],indices:number[]=[];const N=180,M=140,W=232,D=170;
    const snow=new THREE.Color(0xf8f7ed),rock=new THREE.Color(0xa8aaa3),low=new THREE.Color(0xe9ede3);
    for(let j=0;j<=M;j++)for(let i=0;i<=N;i++){
      const x=(i/N-.5)*W,z=(j/M-.5)*D;const h=this.height(x,z);positions.push(x,h,z);
      const slope=Math.hypot(this.height(x+.4,z)-h,this.height(x,z+.4)-h)/.4;
      const col=snow.clone();const fleck=noise(x*.32,z*.32,9);
      if(slope>1.6&&h>14)col.lerp(rock,clamp((slope-1.6)*.65,0,.66));
      if(h<3)col.lerp(low,.7);col.multiplyScalar(.96+fleck*.065);colors.push(col.r,col.g,col.b);
    }
    function inside(x:number,z:number){const a=Math.atan2(z/85,x/116);return (x/116)**2+(z/85)**2<(.94+.035*Math.sin(a*7)+.025*Math.cos(a*11))**2;}
    for(let j=0;j<M;j++)for(let i=0;i<N;i++){const x=((i+.5)/N-.5)*W,z=((j+.5)/M-.5)*D;if(!inside(x,z))continue;const a=j*(N+1)+i,b=a+1,c=a+N+1,d=c+1;indices.push(a,c,b,b,c,d);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
    const land=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0}));land.castShadow=true;land.receiveShadow=true;this.world.add(land);
    // Exposed contour layers at the perimeter give the atlas a crafted, physical edge.
    for(let layer=0;layer<3;layer++){
      const path:THREE.Vector3[]=[];for(let k=0;k<=240;k++){const a=k/240*TAU;const r=.94+.035*Math.sin(a*7)+.025*Math.cos(a*11);path.push(new THREE.Vector3(Math.cos(a)*116*r, .85-layer*.85,Math.sin(a)*85*r));}
      const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(path),new THREE.LineBasicMaterial({color:layer===0?0xc0c7b8:0xcfd4c8}));this.world.add(line);
    }
    // Fine elevation contours on the valley floor.
    for(const r of this.active){for(let k=0;k<3;k++){
      const points:THREE.Vector3[]=[];for(let i=0;i<=160;i++){const a=i/160*TAU,rad=r.radius*(1.12+k*.16)*(1+.035*Math.sin(a*7+r.seed));const x=r.x+Math.cos(a)*rad,z=r.z+Math.sin(a)*rad*.82;points.push(new THREE.Vector3(x,this.height(x,z)+.035,z));}
      const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xb7c2b2,transparent:true,opacity:.32}));this.world.add(line);
    }}
  }
  makeTrees(r:Resort){
    const random=rand(r.seed*981);const treeData:{x:number,z:number,y:number,s:number}[]=[];
    for(let i=0;i<760;i++){
      const x=r.x+(random()-.5)*r.radius*2.25,z=r.z+(random()-.5)*r.radius*2.1;const h=this.height(x,z);const dist=Math.hypot(x-r.x,z-r.z)/r.radius;
      if(h>r.height*.58||dist>1.13||h<2.1||noise(x*.13,z*.13,r.seed)<.38)continue;
      // Leave a wide, skiable clearing in front of each peak.
      if(z>r.z && Math.abs(x-r.x-5)<4.5+(z-r.z)*.17)continue;
      treeData.push({x,z,y:h,s:.65+random()*.85});
    }
    const greens=[0x4c6658,0x647767,0x354f47];
    const dummy=new THREE.Object3D();
    for(let layer=0;layer<3;layer++){
      const mesh=new THREE.InstancedMesh(new THREE.ConeGeometry(.6-layer*.12,1.7-layer*.2,5),new THREE.MeshStandardMaterial({color:greens[layer],roughness:1}),treeData.length);
      const caps=new THREE.InstancedMesh(new THREE.ConeGeometry(.46-layer*.095,.97-layer*.1,5),new THREE.MeshStandardMaterial({color:0xf0f2e9,roughness:1}),treeData.length);
      treeData.forEach((t,i)=>{dummy.position.set(t.x,t.y+(.9+layer*.65)*t.s,t.z);dummy.scale.setScalar(t.s);dummy.rotation.y=i*1.618;dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);dummy.position.y+=(.39-layer*.035)*t.s;dummy.updateMatrix();caps.setMatrixAt(i,dummy.matrix);});
      mesh.castShadow=true;mesh.receiveShadow=true;caps.castShadow=true;this.world.add(mesh,caps);
    }
  }
  cylinderBetween(a:THREE.Vector3,b:THREE.Vector3,radius:number,color:number){const dir=b.clone().sub(a);const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,dir.length(),5),new THREE.MeshStandardMaterial({color,roughness:.8}));m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());m.castShadow=true;this.world.add(m);return m;}
  makeLift(r:Resort){
    const bottom=new THREE.Vector3(r.x+10,0,r.z+r.radius*.72),top=new THREE.Vector3(r.x+3,0,r.z+2);bottom.y=this.height(bottom.x,bottom.z)+4;top.y=this.height(top.x,top.z)+4;
    for(let i=0;i<5;i++){const p=bottom.clone().lerp(top,i/4),floor=this.height(p.x,p.z);this.cylinderBetween(new THREE.Vector3(p.x,floor,p.z),p,.15,0x69756d);this.cylinderBetween(p.clone().add(new THREE.Vector3(-1.15,0,0)),p.clone().add(new THREE.Vector3(1.15,0,0)),.12,0x47554e);}
    for(const side of [-1,1]){const pts=[];for(let i=0;i<=60;i++){const t=i/60,p=bottom.clone().lerp(top,t);p.x+=side*.86;p.y-=Math.sin((t*4%1)*Math.PI)*.15;pts.push(p);}this.world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x627269})));}
    const wheel=(p:THREE.Vector3)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(.85,.12,5,16),new THREE.MeshStandardMaterial({color:0xc75634}));m.rotation.x=Math.PI/2;m.position.copy(p);this.world.add(m);return m;};
    const chairs:THREE.Group[]=[];
    for(let i=0;i<18;i++){const group=new THREE.Group();const bar=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,1,4),new THREE.MeshStandardMaterial({color:0x405247}));bar.position.y=-.5;group.add(bar);const seat=new THREE.Mesh(new THREE.BoxGeometry(.82,.16,.48),new THREE.MeshStandardMaterial({color:i%4===0?0xd75938:0x586b5e}));seat.position.y=-1;group.add(seat);const back=new THREE.Mesh(new THREE.BoxGeometry(.82,.44,.08),new THREE.MeshStandardMaterial({color:0x65786a}));back.position.set(0,-.8,-.22);group.add(back);this.world.add(group);chairs.push(group);}
    this.lifts.push({chairs,a:bottom,b:top,wheelA:wheel(bottom),wheelB:wheel(top)});
  }
  makeVillage(r:Resort){
    for(let i=0;i<4;i++){const x=r.x+15+i*2.9,z=r.z+r.radius*.75+Math.sin(i)*3,y=this.height(x,z);
      const group=new THREE.Group();const house=new THREE.Mesh(new THREE.BoxGeometry(2.1,1.6,2.5),new THREE.MeshStandardMaterial({color:i===0?0xa26745:0xbda386}));house.position.y=.8;house.castShadow=true;group.add(house);
      const roof=new THREE.Mesh(new THREE.ConeGeometry(2.1,1.2,4),new THREE.MeshStandardMaterial({color:0xe8eae1}));roof.rotation.y=Math.PI/4;roof.scale.z=1.15;roof.position.y=1.85;roof.castShadow=true;group.add(roof);
      const door=new THREE.Mesh(new THREE.PlaneGeometry(.45,.8),new THREE.MeshStandardMaterial({color:0xf2c180,emissive:0xbe662b,emissiveIntensity:.35}));door.position.set(0,.6,1.26);group.add(door);group.position.set(x,y,z);this.world.add(group);
    }
  }
  makeSkiers(r:Resort){
    const colors=[0xe35435,0xe1a735,0x426980,0x2b4c43,0xcd6658];
    for(let i=0;i<9;i++){const group=new THREE.Group();const jacket=new THREE.Mesh(new THREE.CapsuleGeometry(.15,.32,2,4),new THREE.MeshStandardMaterial({color:colors[i%5]}));jacket.position.y=.6;group.add(jacket);const head=new THREE.Mesh(new THREE.SphereGeometry(.14,5,4),new THREE.MeshStandardMaterial({color:0x253d36}));head.position.y=.98;group.add(head);
      for(const side of [-1,1]){const ski=new THREE.Mesh(new THREE.BoxGeometry(.07,.035,1.1),new THREE.MeshStandardMaterial({color:0x55676a}));ski.position.set(side*.16,.07,0);group.add(ski);const leg=new THREE.Mesh(new THREE.CylinderGeometry(.07,.06,.35,4),new THREE.MeshStandardMaterial({color:0x33443e}));leg.position.set(side*.12,.28,0);group.add(leg);}
      group.scale.setScalar(.85);this.world.add(group);this.skiers.push({mesh:group,resort:r,phase:i/9,lane:(i%3-1)*2.1});
    }
    // Delicate carved tracks: the human scale in an otherwise enormous landscape.
    for(let j=0;j<6;j++)for(const offset of [-.12,.12]){const points=[];for(let i=0;i<=70;i++){const t=i/70,x=r.x+Math.sin(t*11+j)*1.7+(j-2)*1.6+offset,z=r.z+5+t*r.radius*.63;points.push(new THREE.Vector3(x,this.height(x,z)+.10,z));}this.world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xa4b9bf,transparent:true,opacity:.34})));}
  }
  select(id:string,fly=false){this.selected=id;this.markers.forEach(m=>m.element.classList.toggle('selected',m.resort.id===id));const r=this.active.find(x=>x.id===id);if(!r)return;this.ring.position.set(r.x+7,this.height(r.x+7,r.z+r.radius*.64)+.1,r.z+r.radius*.64);if(fly){this.targetLook=new THREE.Vector3(r.x+12,10,r.z);this.targetCamera=new THREE.Vector3(r.x+70,86,r.z+125);}}
  filter(ids:Set<string>){this.markers.forEach(m=>{m.element.hidden=!ids.has(m.resort.id);});}
  home(immediate=false){const small=innerWidth<760;const look=new THREE.Vector3(small?0:14,4,0);const pos=new THREE.Vector3(small?150:130,small?220:165,small?300:235);if(immediate){this.camera.position.copy(pos);this.controls.target.copy(look);this.controls.update();}else{this.targetCamera=pos;this.targetLook=look;}}
  zoom(factor:number){const offset=this.camera.position.clone().sub(this.controls.target).multiplyScalar(factor);offset.clampLength(45,440);this.targetCamera=this.controls.target.clone().add(offset);this.targetLook=this.controls.target.clone();}
  setWeather(hour:number,snowfall:number,wind:number,cloud:number){this.sunlight=Math.max(.2,Math.sin(((hour%24)-6)/12*Math.PI));this.sun.position.set(-100+((hour%24)/24)*190,60+this.sunlight*90,65);this.sun.intensity=1.2+this.sunlight*2.5;this.sun.color.set(this.sunlight<.35?0xffc18c:0xfff4df);this.ambient.intensity=1.25+this.sunlight*.95;this.ambient.color.set(this.sunlight<.3?0x9eaccb:0xeaf3ff);this.snowfall=snowfall;this.wind=wind;this.snowMaterial.opacity=.35+Math.min(1,snowfall)*.45;this.snow.geometry.setDrawRange(0,Math.round(clamp(snowfall*1000,0,2400)));this.host.style.filter=`saturate(${1-cloud*.0015})`;}
  animate=()=>{
    this.animationId=requestAnimationFrame(this.animate);if(document.hidden){this.clock.getDelta();return;}const delta=Math.min(this.clock.getDelta(),.04);const moving=!this.paused&&!this.reducedMotion;
    if(moving)this.elapsed+=delta;
    const t=this.elapsed;
    if(this.targetCamera&&this.targetLook){const a=this.reducedMotion?1:1-Math.exp(-delta*4);this.camera.position.lerp(this.targetCamera,a);this.controls.target.lerp(this.targetLook,a);if(this.camera.position.distanceTo(this.targetCamera)<.08){this.targetCamera=null;this.targetLook=null;}}
    this.controls.update();
    for(const lift of this.lifts){lift.chairs.forEach((chair,i)=>{const phase=(t*.025+i/lift.chairs.length)%1;const up=phase<.5;const f=up?phase*2:2-phase*2;chair.position.copy(lift.a).lerp(lift.b,f);chair.position.x+=up?.86:-.86;chair.rotation.y=up?Math.PI:0;});lift.wheelA.rotation.z=t*.7;lift.wheelB.rotation.z=t*.7;}
    for(const skier of this.skiers){const f=(t*.026+skier.phase)%1,r=skier.resort,x=r.x+Math.sin(f*12+skier.phase*TAU)*1.8+skier.lane,z=r.z+5+f*r.radius*.67;skier.mesh.position.set(x,this.height(x,z)+.13,z);skier.mesh.rotation.y=Math.cos(f*12+skier.phase*TAU)*.75;}
    this.snow.visible=this.showSnow;
    if(moving&&this.showSnow&&this.snowfall>0){for(let i=0;i<this.snowPositions.length;i+=3){this.snowPositions[i]+=delta*this.wind*.08;this.snowPositions[i+1]-=delta*(2+i%5*.25);if(this.snowPositions[i+1]<0)this.snowPositions[i+1]=85;if(this.snowPositions[i]>130)this.snowPositions[i]=-130;}this.snow.geometry.attributes.position.needsUpdate=true;}
    const w=this.host.clientWidth,h=this.host.clientHeight;
    this.markers.forEach(m=>{this.view.copy(m.point).project(this.camera);const x=(this.view.x*.5+.5)*w,y=(-this.view.y*.5+.5)*h;m.element.style.transform=`translate(${x}px,${y}px) translate(-50%, -100%)`;m.element.style.visibility=this.view.z>1||x<0||x>w||y<0||y>h?'hidden':'visible';m.element.style.zIndex=m.resort.id===this.selected?'5':String(Math.round(3-this.view.z));});
    this.renderer.render(this.scene,this.camera);this.frame++;
  }
}
