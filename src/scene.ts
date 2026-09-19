import { addTouchRotation } from './touch-rotation';
import { snowcatGeometry } from './snowcat-model';
import { ecologyFor, treeAtElevation, type Ecology, type TreeForm } from './ecology';
import { localeTreeGeometry, shrubGeometry, wildlifeGeometry } from './ecology-models';
import { defaultRiderSettings, type RiderSettings } from './rider-settings';
import { downhillPaths, placeRider } from './rider-motion';
import { makeLift, updateLift, riderGeometry, riderSpeed, modelMaterial, type LiftVisual } from './mountain-models';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Resort } from './data';
import { surfaceElevationAt, elevationAt, inExtent, clipFeature, trailColor, featureLength, featureTitle, mapReferences, type MountainData, type MapFeature, type MapPlace, type Point } from './geography';

function random(seed:number){let n=seed;return()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};}
const clamp=THREE.MathUtils.clamp;
interface GeoLabel {el:HTMLButtonElement;point:THREE.Vector3;feature?:MapFeature;peak?:boolean;place?:MapPlace;road?:boolean;priority:number;}
interface Route3D {feature:MapFeature;points:THREE.Vector3[];curve:THREE.CurvePath<THREE.Vector3>;length:number;line:THREE.Line;}

const cache=new Map<string,MountainData>();
export class AtlasScene {
 renderer:THREE.WebGLRenderer;scene=new THREE.Scene();camera:THREE.PerspectiveCamera;controls:OrbitControls;world=new THREE.Group();
 sun:THREE.DirectionalLight;ambient:THREE.HemisphereLight;clock=new THREE.Clock();
 selected='';active:Resort[]=[];data?:MountainData;features:MapFeature[]=[];markers:{element:HTMLButtonElement;resort:Resort}[]=[];
 suspended=false;paused=false;motionOverride=false;reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;showSnow=true;showTrails=true;showLifts=true;showLabels=false;showRoads=true;showPlaces=true;contextGroup=new THREE.Group();buildingGroup=new THREE.Group();
 targetCamera:THREE.Vector3|null=null;targetLook:THREE.Vector3|null=null;
 scale=1;minElevation=0;maxElevation=0;exaggeration=1;topDown=false;elapsed=0;animationId=0;requestId=0;
 routes:Route3D[]=[];labels:GeoLabel[]=[];trees?:THREE.InstancedMesh;lifts:LiftVisual[]=[];
 snowcatPositions:THREE.Vector3[]=[];
 ecology?:Ecology;wildlife?:THREE.InstancedMesh;wildlifePoses:{x:number;y:number;z:number;angle:number}[]=[];showWildlife=true;
 riderSettings:RiderSettings={...defaultRiderSettings};
 actors:{route:Route3D;phase:number;progress:number;motionTime:number;board:boolean;index:number}[]=[];skiers?:THREE.InstancedMesh;boarders?:THREE.InstancedMesh;
 snow:THREE.Points;snowPositions:Float32Array;snowMaterial:THREE.PointsMaterial;snowfall=0;wind=5;
 selectedFeature?:MapFeature;highlight?:THREE.Line;journey?:{route:Route3D;start:number};traveler:THREE.Mesh;
 raycaster=new THREE.Raycaster();pointer=new THREE.Vector2();hovered:number|null=null;mobile=innerWidth<760;geometryGroup=new THREE.Group();liftGroup=new THREE.Group();trailGroup=new THREE.Group();
 private touchPointers=new Set<number>();private suppressPick=false;
 private coverImage?:HTMLImageElement;private temp=new THREE.Vector3();private dummy=new THREE.Object3D();private down={x:0,y:0};private tooltip:HTMLDivElement;
 constructor(public host:HTMLElement,public labelHost:HTMLElement,public onSelect:(id:string)=>void){
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.03;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.renderer.domElement.setAttribute('role','img');this.renderer.domElement.setAttribute('aria-label','Geographic 3D trail map. Drag or use arrow keys to pan, right-drag to rotate, scroll to zoom. On touch, pinch to zoom and twist two fingers to rotate. Search and select named trails and lifts in the mountain explorer.');this.renderer.domElement.tabIndex=0;host.append(this.renderer.domElement);
  this.camera=new THREE.PerspectiveCamera(35,1,.1,1800);this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enablePan=true;this.controls.screenSpacePanning=false;this.controls.panSpeed=1.2;this.setInteractionMode('pan');this.controls.enableDamping=true;this.controls.dampingFactor=.08;this.controls.minDistance=15;this.controls.maxDistance=600;this.controls.maxPolarAngle=Math.PI*.47;this.controls.minPolarAngle=.015;this.controls.rotateSpeed=.6;this.controls.zoomSpeed=.7;this.controls.maxTargetRadius=200;this.controls.target.set(0,20,0);this.camera.position.set(-130,160,-210);
  addTouchRotation(this.renderer.domElement,angle=>{const offset=this.camera.position.clone().sub(this.controls.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),angle);this.camera.position.copy(this.controls.target).add(offset);this.controls.update();});
  this.controls.listenToKeyEvents(this.renderer.domElement);this.controls.keyPanSpeed=22;
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',event=>{this.reducedMotion=event.matches;this.motionOverride=false;this.controls.enableDamping=!event.matches;window.dispatchEvent(new Event('motion-preference-changed'));});this.controls.enableDamping=!this.reducedMotion;
  this.controls.addEventListener('start',()=>{this.tooltip.hidden=true;this.targetCamera=null;this.targetLook=null;this.journey=undefined;this.traveler.visible=false;this.host.style.cursor='grabbing';});this.controls.addEventListener('end',()=>this.host.style.cursor='grab');
  this.scene.add(this.world);this.ambient=new THREE.HemisphereLight(0xd8eaff,0x9fa69c,2.25);this.scene.add(this.ambient);
  this.sun=new THREE.DirectionalLight(0xfff6e5,2.8);this.sun.position.set(-100,85,100);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-180,right:180,top:180,bottom:-180,far:600});this.sun.shadow.bias=-.0002;this.sun.shadow.normalBias=.06;this.scene.add(this.sun);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(1200,1200),new THREE.ShadowMaterial({color:0x547080,opacity:.16}));floor.rotation.x=-Math.PI/2;floor.position.y=-4;floor.receiveShadow=true;this.scene.add(floor);
  this.snowPositions=new Float32Array(3000*3);const rnd=random(419);for(let i=0;i<3000;i++){this.snowPositions[i*3]=(rnd()-.5)*270;this.snowPositions[i*3+1]=rnd()*150;this.snowPositions[i*3+2]=(rnd()-.5)*270;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(this.snowPositions,3));this.snowMaterial=new THREE.PointsMaterial({color:0xffffff,size:.35,transparent:true,opacity:.7,depthWrite:false});this.snow=new THREE.Points(g,this.snowMaterial);this.scene.add(this.snow);
  this.traveler=new THREE.Mesh(new THREE.SphereGeometry(.7,12,8),new THREE.MeshBasicMaterial({color:0xf07536}));this.traveler.visible=false;this.scene.add(this.traveler);
  this.tooltip=document.createElement('div');this.tooltip.className='terrain-tooltip';this.tooltip.hidden=true;host.append(this.tooltip);
  this.raycaster.params.Line={threshold:.7};this.renderer.domElement.addEventListener('pointerdown',e=>{if(!this.touchPointers.size)this.suppressPick=false;this.touchPointers.add(e.pointerId);if(this.touchPointers.size>1)this.suppressPick=true;this.down={x:e.clientX,y:e.clientY};});
  for(const type of ['pointerup','pointercancel'])this.renderer.domElement.addEventListener(type,e=>{this.touchPointers.delete((e as PointerEvent).pointerId);});
  this.renderer.domElement.addEventListener('pointermove',e=>{if(e.buttons&&Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y)>5)this.suppressPick=true;});
  this.renderer.domElement.addEventListener('click',e=>{if(this.suppressPick||Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y)>5)return;const f=this.pick(e);if(f)this.focusFeature(f.id);});
  this.renderer.domElement.addEventListener('pointermove',e=>{if(e.buttons)return;const f=this.pick(e);this.tooltip.hidden=!f;if(f){this.tooltip.textContent=`${f.kind==='lift'?'↟':'↘'} ${featureTitle(f)}`;this.tooltip.style.left=`${e.clientX-host.getBoundingClientRect().left+15}px`;this.tooltip.style.top=`${e.clientY-host.getBoundingClientRect().top-28}px`;}this.host.style.cursor=f?'pointer':'grab';});
  this.renderer.domElement.addEventListener('pointerleave',()=>this.tooltip.hidden=true);
  new ResizeObserver(()=>this.resize()).observe(host);this.resize();this.animate();
 }
 setInteractionMode(mode:'pan'|'rotate'){
  const pan=mode==='pan';this.controls.mouseButtons.LEFT=pan?THREE.MOUSE.PAN:THREE.MOUSE.ROTATE;this.controls.mouseButtons.RIGHT=pan?THREE.MOUSE.ROTATE:THREE.MOUSE.PAN;
  this.controls.touches.ONE=pan?THREE.TOUCH.PAN:THREE.TOUCH.ROTATE;this.controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;
 }
 resize(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();const m=innerWidth<760;if(m!==this.mobile){this.mobile=m;this.home(true);}}
 setRegion(resorts:Resort[]){this.active=resorts;}
 select(id:string,fly=false){if(this.selected===id&&this.data){if(fly)this.home();return;}if(this.selected===id&&!this.data&&this.host.classList.contains('terrain-loading'))return;const resort=this.active.find(r=>r.id===id);if(!resort)return;this.selected=id;void this.load(resort);}
 async load(resort:Resort){const request=++this.requestId;this.host.classList.add('terrain-loading');this.labelHost.classList.add('terrain-loading');this.data=undefined;this.features=[];this.world.visible=false;this.labels.forEach(l=>l.el.hidden=true);this.tooltip.hidden=true;this.journey=undefined;this.traveler.visible=false;
  window.dispatchEvent(new CustomEvent('terrain-loading',{detail:resort.id}));
  try{let data=cache.get(resort.id);if(!data){const response=await fetch(`/geodata/${resort.id}.json`);if(!response.ok)throw new Error('Mountain data unavailable');data=await response.json() as MountainData;if(data.gridSize**2!==data.heights.length)throw new Error('Invalid terrain grid');cache.set(resort.id,data);}if(request!==this.requestId)return;
   let coverImage:HTMLImageElement|undefined;
   if(data.landcover){try{const cover=new Image();await new Promise<void>((resolve,reject)=>{cover.onload=()=>resolve();cover.onerror=reject;cover.src=data!.landcover!;});coverImage=cover;}catch{console.warn('Land cover unavailable; using mapped forest polygons.');}}
   if(request!==this.requestId)return;
   this.clear();this.ecology=ecologyFor(resort);this.data=data;this.coverImage=coverImage;this.scale=240/Math.max(data.width,data.depth);this.minElevation=data.heights.reduce((a,b)=>Math.min(a,b),Infinity);this.maxElevation=data.heights.reduce((a,b)=>Math.max(a,b),-Infinity);
   this.features=data.features.flatMap(f=>clipFeature(data!,f));
   this.makeTerrain();this.makeContext();this.makePaths();this.makeActors();this.makeSnowcats();this.makeLabels();this.world.visible=true;this.home(true);
   window.dispatchEvent(new CustomEvent('terrain-ready',{detail:{id:resort.id,data,features:this.features}}));
  }catch(error){if(request!==this.requestId)return;window.dispatchEvent(new CustomEvent('terrain-error',{detail:resort.id}));console.error('Terrain loading failed',error);}
  finally{if(request===this.requestId){this.host.classList.remove('terrain-loading');this.labelHost.classList.remove('terrain-loading');}}
 }
 clear(){this.snowcatPositions=[];this.wildlife=undefined;this.wildlifePoses=[];this.world.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){if(m instanceof THREE.MeshStandardMaterial)m.map?.dispose();m.dispose();}}});this.world.clear();this.labels.forEach(l=>l.el.remove());this.labels=[];this.routes=[];this.lifts=[];this.actors=[];this.selectedFeature=undefined;this.highlight=undefined;this.geometryGroup=new THREE.Group();this.liftGroup=new THREE.Group();this.trailGroup=new THREE.Group();this.contextGroup=new THREE.Group();this.buildingGroup=new THREE.Group();this.world.add(this.geometryGroup,this.liftGroup,this.trailGroup,this.contextGroup,this.buildingGroup);}
 height(x:number,z:number){return this.data?(surfaceElevationAt(this.data,x/this.scale,z/this.scale)-this.minElevation)*this.scale*this.exaggeration:0;}
 project(p:Point,offset=0){return new THREE.Vector3(p[0]*this.scale,this.height(p[0]*this.scale,p[1]*this.scale)+offset,p[1]*this.scale);}
 makeTerrain(){const d=this.data!,n=d.gridSize,vertices:number[]=[],uv:number[]=[],indices:number[]=[],colors:number[]=[];
  const mask=document.createElement('canvas');mask.width=mask.height=1024;const ctx=mask.getContext('2d',{willReadFrequently:true})!;
  const waterMask=this.selected==='iwanai'?new Uint8Array(1024*1024):undefined;
  const px=(p:Point)=>[(p[0]/d.width+.5)*1024,(p[1]/d.depth+.5)*1024];
  if(this.coverImage){ctx.drawImage(this.coverImage,0,0,1024,1024);const img=ctx.getImageData(0,0,1024,1024);for(let i=0;i<img.data.length;i+=4){if(waterMask)waterMask[i/4]=img.data[i]===80?1:0;const forest=img.data[i]===10;img.data[i]=img.data[i+1]=img.data[i+2]=255;img.data[i+3]=forest?255:0;}ctx.putImageData(img,0,0);}
  ctx.fillStyle='#ffffff';for(const polygon of d.forests){if(polygon.length<3)continue;ctx.beginPath();polygon.forEach((p,i)=>{const [x,y]=px(p);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.closePath();ctx.fill();}
  ctx.globalCompositeOperation='destination-out';for(const polygon of d.forestHoles||[]){ctx.beginPath();polygon.forEach((p,i)=>{const[x,y]=px(p);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.closePath();ctx.fill();}ctx.lineCap='round';ctx.lineJoin='round';
  for(const f of this.features){if(f.kind!=='trail')continue;ctx.lineWidth=clamp(33/d.width*1024,2,10);ctx.beginPath();f.points.forEach((p,i)=>{const[x,y]=px(p);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});if(f.area){ctx.closePath();ctx.fill();}else ctx.stroke();}
  for(const road of d.roads||[]){ctx.lineWidth=Math.max(1,(road.type==='track'?4:road.type==='service'?7:12)/d.width*1024);ctx.beginPath();road.points.forEach((p,i)=>{const[x,y]=px(p);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.stroke();}
  for(const b of d.buildings||[]){ctx.beginPath();b.points.forEach((p,i)=>{const[x,y]=px(p);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.closePath();ctx.fill();}
  const maskData=ctx.getImageData(0,0,1024,1024).data;
  const waterAt=(x:number,z:number)=>!!waterMask?.[Math.max(0,Math.min(1023,Math.floor((z/d.depth+.5)*1023)))*1024+Math.max(0,Math.min(1023,Math.floor((x/d.width+.5)*1023)))];
  const forestAt=(x:number,z:number)=>{const i=Math.floor((x/d.width+.5)*1023),j=Math.floor((z/d.depth+.5)*1023);if(i<0||i>1023||j<0||j>1023)return 0;return waterAt(x,z)?0:maskData[(j*1024+i)*4+3]/255;};
  const snow=new THREE.Color(0xf1eee0),green=new THREE.Color(this.ecology!.colors[0]),rock=new THREE.Color(0x909f9e);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=(i/(n-1)-.5)*d.width,z=(j/(n-1)-.5)*d.depth,h=d.heights[j*n+i];vertices.push(x*this.scale,((waterAt(x,z)?0:h)-this.minElevation)*this.scale*this.exaggeration,z*this.scale);uv.push(i/(n-1),1-j/(n-1));const dx=(d.heights[j*n+Math.min(n-1,i+1)]-d.heights[j*n+Math.max(0,i-1)])/(2*d.width/(n-1)),dz=(d.heights[Math.min(n-1,j+1)*n+i]-d.heights[Math.max(0,j-1)*n+i])/(2*d.depth/(n-1));const slope=Math.hypot(dx,dz);const forest=forestAt(x,z);const c=snow.clone().lerp(green,forest*(this.ecology!.winterTint??.80)*(this.ecology!.bareUpper?Math.max(0,Math.min(1,(this.ecology!.treeline-h)/220)):1));if(slope>.8)c.lerp(rock,clamp((slope-.8)*.75,0,.75));const aspect=clamp((dx*.4+dz*.25),-.2,.2);c.lerp(new THREE.Color(0x8aa4b6),Math.max(0,-aspect));if(waterAt(x,z))c.setHex(0x729da8);colors.push(c.r,c.g,c.b);}
  for(let j=0;j<n-1;j++)for(let i=0;i<n-1;i++){const a=j*n+i,b=a+1,c=a+n,e=c+1;indices.push(a,c,b,b,c,e);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(new Float32Array(vertices.length),3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0}));mesh.receiveShadow=true;mesh.castShadow=true;this.geometryGroup.add(mesh);
  // Vertical edges expose the real relief without modifying the sampled heightfield.
  const edge:number[]=[];for(let i=0;i<n;i++)edge.push(i);for(let j=1;j<n;j++)edge.push(j*n+n-1);for(let i=n-2;i>=0;i--)edge.push((n-1)*n+i);for(let j=n-2;j>0;j--)edge.push(j*n);
  const side:number[]=[],si:number[]=[];edge.forEach(k=>{side.push(vertices[k*3],vertices[k*3+1],vertices[k*3+2],vertices[k*3],-3,vertices[k*3+2]);});edge.forEach((_,i)=>{const a=i*2,b=((i+1)%edge.length)*2;si.push(a,b,a+1,a+1,b,b+1);});const sideGeo=new THREE.BufferGeometry();sideGeo.setAttribute('position',new THREE.Float32BufferAttribute(side,3));sideGeo.setIndex(si);sideGeo.computeVertexNormals();this.geometryGroup.add(new THREE.Mesh(sideGeo,new THREE.MeshStandardMaterial({color:0xc5c7b7,roughness:1,side:THREE.DoubleSide})));
  // Regional silhouettes remain constrained to actual mapped forest and piste clearings.
  const profile=this.ecology!,rnd=random(209),trees:{x:number;z:number;y:number;size:number;form:TreeForm}[]=[];
  for(let i=0;i<(this.selected==='iwanai'?100000:35000);i++){
   const x=(rnd()-.5)*d.width,z=(rnd()-.5)*d.depth;if(forestAt(x,z)<.5)continue;
   const elevation=elevationAt(d,x,z),spec=treeAtElevation(profile,elevation,rnd());if(rnd()>spec.density)continue;
   const size=(.55+rnd()*.4)*spec.scale*(this.selected==='iwanai'?this.scale/(240/5310):1);
   trees.push({x:x*this.scale,z:z*this.scale,y:this.height(x*this.scale,z*this.scale),size,form:spec.form});
  }
  for(const form of new Set(profile.trees)){
   const group=trees.filter(t=>t.form===form);if(!group.length)continue;
   const trunk=new THREE.InstancedMesh(localeTreeGeometry(form),modelMaterial(),group.length),cap=new THREE.InstancedMesh(localeTreeGeometry(form,true),modelMaterial(),group.length);
   const color=new THREE.Color();group.forEach((t,i)=>{this.dummy.position.set(t.x,t.y,t.z);this.dummy.scale.set(t.size,t.size,t.size);this.dummy.rotation.set(0,i*2.4,0);this.dummy.updateMatrix();trunk.setMatrixAt(i,this.dummy.matrix);cap.setMatrixAt(i,this.dummy.matrix);color.setHex(['birch','aspen','larch'].includes(form)?0xffffff:profile.colors[i%profile.colors.length]);trunk.setColorAt(i,color);});
   trunk.receiveShadow=true;trunk.userData.treeForm=form;this.geometryGroup.add(trunk,cap);this.trees=trunk;
  }
  const shrubs=trees.filter((_,i)=>i%53===0).slice(0,350),shrub=new THREE.InstancedMesh(shrubGeometry(['sierra','alps','honshu'].includes(profile.id)),modelMaterial(),shrubs.length);
  shrubs.forEach((t,i)=>{this.dummy.position.set(t.x,t.y,t.z);this.dummy.rotation.set(0,i*2.4,0);this.dummy.scale.setScalar(.5);this.dummy.updateMatrix();shrub.setMatrixAt(i,this.dummy.matrix);});this.geometryGroup.add(shrub);
  // Sparse, stationary animals in forest habitat: illustrative encounters, never live sightings.
  for(let i=17;i<trees.length&&this.wildlifePoses.length<12;i+=113){const t=trees[i],x=t.x+.8,z=t.z+.8;
   if(forestAt(x/this.scale,z/this.scale)<.5)continue;
   const heights=[this.height(x-.14,z-.14),this.height(x+.14,z-.14),this.height(x-.14,z+.14),this.height(x+.14,z+.14)];
   if(Math.max(...heights)-Math.min(...heights)>.16||this.wildlifePoses.some(p=>Math.hypot(p.x-x,p.z-z)<6))continue;
   this.wildlifePoses.push({x,z,y:Math.max(...heights),angle:rnd()*Math.PI*2});
  }
  this.wildlife=new THREE.InstancedMesh(wildlifeGeometry(profile.wildlife),modelMaterial(),this.wildlifePoses.length);this.wildlife.userData.species=profile.animalName;this.world.add(this.wildlife);

 }
 sampleFeature(f:MapFeature,offset:number){const d=this.data!,points:THREE.Vector3[]=[];
  for(let i=1;i<f.points.length;i++){const a=f.points[i-1],b=f.points[i],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/25));for(let k=i===1?0:1;k<=steps;k++){const t=k/steps,p:Point=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];points.push(this.project(p,offset));}}
  return points;
 }
 makeContext(){const d=this.data!;const roadMeshes:THREE.BufferGeometry[]=[];
  for(const road of d.roads||[]){const f:MapFeature={...road,kind:'trail',difficulty:'unknown',area:false};for(const part of clipFeature(d,f)){
   const pts=this.sampleFeature(part,.19),width=(road.type==='track'?3:road.type==='service'?5:8)*this.scale;
   if(road.type==='track'){const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineDashedMaterial({color:0x9f9580,dashSize:.35,gapSize:.3,transparent:true,opacity:.65}));line.computeLineDistances();this.contextGroup.add(line);continue;}
   const verts:number[]=[],indices:number[]=[];for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],len=Math.hypot(b.x-a.x,b.z-a.z)||1,dx=-(b.z-a.z)/len*width/2,dz=(b.x-a.x)/len*width/2;for(const sign of [-1,1]){const x=pts[i].x+dx*sign,z=pts[i].z+dz*sign;verts.push(x,this.height(x,z)+.2,z);}if(i){const k=i*2;indices.push(k-2,k,k-1,k-1,k,k+1);}}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);roadMeshes.push(g);
  }}
  if(roadMeshes.length){const merged=mergeGeometries(roadMeshes)!;roadMeshes.forEach(g=>g.dispose());this.contextGroup.add(new THREE.Mesh(merged,new THREE.MeshBasicMaterial({color:0xaa8c63,side:THREE.DoubleSide})));}
  const buildings:THREE.BufferGeometry[]=[];
  for(const b of d.buildings||[]){if(!b.points.every(p=>inExtent(d,p)))continue;const shape=new THREE.Shape();b.points.forEach((p,i)=>{if(i===0)shape.moveTo(p[0]*this.scale,-p[1]*this.scale);else shape.lineTo(p[0]*this.scale,-p[1]*this.scale);});const height=6*this.scale;const g=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,steps:1});g.rotateX(-Math.PI/2);const base=Math.max(...b.points.map(p=>this.height(p[0]*this.scale,p[1]*this.scale)));g.translate(0,base+.06,0);buildings.push(g);}
  if(buildings.length){const merged=mergeGeometries(buildings)!;buildings.forEach(g=>g.dispose());merged.clearGroups();const mesh=new THREE.Mesh(merged,new THREE.MeshStandardMaterial({color:0x9d7358,roughness:1}));mesh.castShadow=true;this.buildingGroup.add(mesh);}
  for(const place of (d.places||[]).filter(p=>inExtent(d,p.point))){const marker=new THREE.Mesh(new THREE.ConeGeometry(.45,.8,4),new THREE.MeshStandardMaterial({color:place.kind==='lodge'?0xb94e2e:0x897255,roughness:1}));marker.position.copy(this.project(place.point,.6));marker.rotation.y=Math.PI/4;this.buildingGroup.add(marker);}
  this.contextGroup.visible=this.showRoads;this.buildingGroup.visible=this.showPlaces;
 }
 focusPlace(place:MapPlace){this.clearFocus();this.journey=undefined;this.traveler.position.copy(this.project(place.point,1));this.traveler.visible=true;this.flyTo(this.project(place.point),48);window.dispatchEvent(new CustomEvent('place-selected',{detail:place}));}
 makePaths(){
  for(const f of this.features){const pts=this.sampleFeature(f,f.kind==='lift'?.8:.12);if(pts.length<2)continue;
   if(f.kind==='lift'&&pts[0].y>pts[pts.length-1].y)pts.reverse();if(f.kind==='trail'&&pts[0].y<pts[pts.length-1].y)pts.reverse();
   const color=f.kind==='lift'?(f.access==='private'||f.proposed||f.retired?0x9b8d80:0xb54c37):(trailColor(this.selected,f.difficulty));
   const mat=f.kind==='lift'?new THREE.LineDashedMaterial({color,dashSize:.8,gapSize:.35,transparent:true,opacity:.95}):new THREE.LineBasicMaterial({color,transparent:true,opacity:f.area?.35:.87});
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),mat);line.computeLineDistances();line.userData.feature=f;(f.kind==='lift'?this.liftGroup:this.trailGroup).add(line);
   const curve=new THREE.CurvePath<THREE.Vector3>();for(let i=1;i<pts.length;i++)curve.add(new THREE.LineCurve3(pts[i-1],pts[i]));const route={feature:f,points:pts,curve,length:curve.getLength(),line};this.routes.push(route);
   if(f.kind==='lift')this.lifts.push(...makeLift(f,this.sampleFeature(f,0),this.scale,(x,z)=>this.height(x,z),this.liftGroup));
  }
  this.trailGroup.visible=this.showTrails;this.liftGroup.visible=this.showLifts;
 }
 focusSnowcats(){const point=this.snowcatPositions[0];if(point){this.clearFocus();this.journey=undefined;this.flyTo(point,15);}}
 makeSnowcats(){
  if(this.selected!=='iwanai')return;
  // Static illustrative vehicles on mapped clearings, not a claimed CAT itinerary.
  const candidates=[this.features.find(f=>f.id===1468762438),this.features.find(f=>f.name==='C'&&f.kind==='trail')];
  candidates.forEach((feature,index)=>{if(!feature)return;
   const point=feature.points[Math.floor(feature.points.length*(index?.35:.55))];
   const x=point[0]*this.scale,z=point[1]*this.scale;
   const mesh=new THREE.Mesh(snowcatGeometry(),modelMaterial());const size=this.scale*1.5;
   mesh.scale.setScalar(size);mesh.position.set(x,this.height(x,z)+.06,z);
   mesh.rotation.y=index?-.4:.7;mesh.castShadow=true;mesh.userData.illustrative=true;
   // Raise the tracks over the highest terrain beneath the vehicle footprint.
   let floor=mesh.position.y;for(const dx of [-size*2.1,size*2.1])for(const dz of [-size*3,size*3])floor=Math.max(floor,this.height(x+dx,z+dz)+.04);
   mesh.position.y=floor;this.geometryGroup.add(mesh);this.snowcatPositions.push(mesh.position.clone());
  });
 }
 makeActors(){const d=this.data!;const candidates=this.routes.filter(r=>r.feature.kind==='trail'&&!r.feature.area&&r.feature.access!=='private'&&!r.feature.proposed&&!r.feature.retired).flatMap(route=>downhillPaths(route.points,(x,z)=>this.height(x,z),d.width*this.scale,d.depth*this.scale,d.gridSize).map(points=>{const curve=new THREE.CurvePath<THREE.Vector3>();for(let i=1;i<points.length;i++)curve.add(new THREE.LineCurve3(points[i-1],points[i]));return {...route,points,curve,length:curve.getLength()};})).filter(r=>r.length>3).sort((a,b)=>b.length-a.length).slice(0,100);let ski=0,board=0;
  this.actors=candidates.map((route,i)=>{const snowboarding=!['alta','deer-valley'].includes(this.selected)&&i%3===0;return {route,phase:i*.618%1,progress:i*.618%1,motionTime:i*.618,board:snowboarding,index:snowboarding?board++:ski++};});
  this.skiers=new THREE.InstancedMesh(riderGeometry(false),modelMaterial(),ski);this.boarders=new THREE.InstancedMesh(riderGeometry(true),modelMaterial(),board);
  for(const actor of this.actors)(actor.board?this.boarders:this.skiers).setColorAt(actor.index,new THREE.Color([0xe07851,0xf3ca57,0x8bb4d4,0x98b79d][actor.index%4]));this.world.add(this.skiers,this.boarders);
 }
 makeLabels(){const d=this.data!;
  for(const place of (d.places||[]).filter(p=>inExtent(d,p.point))){const el=document.createElement('button');el.className='geo-label lodge-label';el.textContent=`⌂ ${place.name}`;el.setAttribute('aria-label',`Explore ${place.name}`);el.onclick=()=>this.focusPlace(place);this.labelHost.append(el);this.labels.push({el,point:this.project(place.point,1.5),place,priority:this.selected==='powder'&&['Hidden Lake Lodge','Timberline Lodge','Sundown Lodge'].includes(place.name)?8:place.kind==='lodge'?6:2});}
  const roadNames=new Set<string>();for(const road of [...(d.roads||[])].sort((a,b)=>featureLength({...b,kind:'trail',area:false,difficulty:''})-featureLength({...a,kind:'trail',area:false,difficulty:''}))){if(!road.name||roadNames.has(road.name)||roadNames.size>=18)continue;const point=road.points[Math.floor(road.points.length/2)];if(!inExtent(d,point))continue;roadNames.add(road.name);const place:MapPlace={id:'way/'+road.id,name:road.name,kind:road.type==='track'?'Track / service route':'Road',point,source:'OpenStreetMap',url:'https://www.openstreetmap.org/way/'+road.id,access:road.access};const el=document.createElement('button');el.className='geo-label road-label';el.textContent=road.name;el.onclick=()=>this.focusPlace(place);this.labelHost.append(el);this.labels.push({el,point:this.project(point,.5),road:true,priority:0});}

  for(const p of d.peaks.filter(p=>inExtent(d,p.point)).slice(0,20)){const el=document.createElement('button');el.className='geo-label peak-label';el.textContent=`△ ${p.name}`;el.title=`${p.name} · ${Math.round(elevationAt(d,...p.point)).toLocaleString()} m (DEM)`;el.onclick=()=>{const point=this.project(p.point);this.flyTo(point,55);};this.labelHost.append(el);this.labels.push({el,point:this.project(p.point,1.5),peak:true,priority:4});}
  const longest=[...this.routes].filter(r=>r.feature.name&&!r.feature.area).sort((a,b)=>b.length-a.length);const seen=new Set<string>();
  for(const route of longest){const f=route.feature;if(seen.has(f.name))continue;seen.add(f.name);const lift=f.kind==='lift';if(!lift&&this.labels.filter(l=>l.feature?.kind==='trail').length>=26)continue;
   const el=document.createElement('button');el.className=`geo-label ${lift?'lift-label':'trail-label'}`;el.dataset.feature=String(f.id);el.textContent=`${lift?'↟ ':''}${f.name}${f.retired?' · retired':f.access==='private'?' · private':f.proposed?' · proposed':''}`;el.setAttribute('aria-label',`Explore ${f.kind} ${f.name}`);el.onclick=()=>this.focusFeature(f.id);el.style.setProperty('--route-color',`#${(lift?0xb54c37:trailColor(this.selected,f.difficulty)).toString(16).padStart(6,'0')}`);this.labelHost.append(el);this.labels.push({el,point:route.curve.getPoint(.58).add(new THREE.Vector3(0,.7,0)),feature:f,priority:lift?3:1});
  }
 }
 pick(e:PointerEvent|MouseEvent){const r=this.renderer.domElement.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const candidates=this.routes.filter(r=>(r.feature.kind==='lift'?this.showLifts:this.showTrails));const hit=this.raycaster.intersectObjects(candidates.map(r=>r.line),false)[0];return hit?.object.userData.feature as MapFeature|undefined;}
 focusFeature(id:number){const route=this.routes.find(r=>r.feature.id===id);if(!route)return;this.selectedFeature=route.feature;this.journey=undefined;this.traveler.visible=false;
  if(this.highlight){this.world.remove(this.highlight);this.highlight.geometry.dispose();(this.highlight.material as THREE.Material).dispose();}
  this.highlight=new THREE.Line(new THREE.BufferGeometry().setFromPoints(route.points.map(p=>p.clone().add(new THREE.Vector3(0,.2,0)))),new THREE.LineBasicMaterial({color:0xe88630,depthTest:false,transparent:true,opacity:1}));this.highlight.renderOrder=10;this.world.add(this.highlight);
  this.labels.forEach(l=>l.el.classList.toggle('chosen',l.feature?.id===id));this.flyTo(route.curve.getPoint(.5),Math.max(40,route.length*1.8));window.dispatchEvent(new CustomEvent('feature-selected',{detail:route.feature}));
 }
 followSelected(){const route=this.routes.find(r=>r.feature.id===this.selectedFeature?.id);if(!route)return;this.journey={route,start:this.elapsed};this.traveler.visible=true;this.targetCamera=null;this.targetLook=null;}
 flyTo(point:THREE.Vector3,distance:number){const dir=this.camera.position.clone().sub(this.controls.target).normalize();this.targetLook=point.clone();this.targetCamera=point.clone().add(dir.multiplyScalar(Math.min(distance,260)));}
 clearFocus(){this.journey=undefined;this.traveler.visible=false;this.selectedFeature=undefined;if(this.highlight){this.world.remove(this.highlight);this.highlight.geometry.dispose();(this.highlight.material as THREE.Material).dispose();this.highlight=undefined;}this.labels.forEach(l=>l.el.classList.remove('chosen'));}
 home(immediate=false){if(!this.data)return;this.clearFocus();this.journey=undefined;this.traveler.visible=false;const d=this.data,height=(this.maxElevation-this.minElevation)*this.scale*this.exaggeration;const liftPoints=mapReferences[this.selected]?.frame==='terrain'?[]:this.features.filter(f=>f.kind==='lift'&&!f.proposed).flatMap(f=>f.points).filter(p=>inExtent(d,p));const xs=liftPoints.map(p=>p[0]*this.scale),zs=liftPoints.map(p=>p[1]*this.scale);const mx=xs.length?(Math.min(...xs)+Math.max(...xs))/2:0,mz=zs.length?(Math.min(...zs)+Math.max(...zs))/2:0;const look=new THREE.Vector3(mx,this.height(mx,mz)*.35,mz);const ref=mapReferences[this.selected];const v=new THREE.Vector3(ref?.view[0]||0,0,ref?.view[1]||1).normalize();const distance=this.mobile?Math.min(590,Math.max(430,390/this.camera.aspect)):325;const pos=this.topDown?look.clone().add(new THREE.Vector3(0,distance,.1)):look.clone().add(v.multiplyScalar(distance*.84)).add(new THREE.Vector3(0,distance*.61,0));
  if(immediate||this.reducedMotion){this.camera.position.copy(pos);this.controls.target.copy(look);this.controls.update();this.targetCamera=null;this.targetLook=null;}else{this.targetCamera=pos;this.targetLook=look;}
 }
 zoom(factor:number){this.journey=undefined;const offset=(this.targetCamera||this.camera.position).clone().sub(this.controls.target).multiplyScalar(factor);offset.clampLength(15,600);this.targetCamera=this.controls.target.clone().add(offset);this.targetLook=this.controls.target.clone();}
 filter(_ids:Set<string>){/* Resort filters affect the destination list, never alter geographic geometry. */}
 toggleLayer(layer:'trails'|'lifts'|'labels'|'roads'|'places',show:boolean){if(layer==='trails'){this.showTrails=show;this.trailGroup.visible=show;}if(layer==='lifts'){this.showLifts=show;this.liftGroup.visible=show;}if(layer==='labels')this.showLabels=show;if(layer==='roads'){this.showRoads=show;this.contextGroup.visible=show;}if(layer==='places'){this.showPlaces=show;this.buildingGroup.visible=show;}}
 setWeather(hour:number,snowfall:number,wind:number,cloud:number){const light=Math.max(.25,Math.sin(((hour%24)-6)/12*Math.PI));this.sun.intensity=1.5+light*2.5;this.sun.color.set(light<.35?0xffcf9c:0xfff6e5);this.ambient.intensity=.95+light*.5;this.ambient.color.set(light<.3?0x96b1d4:0xd8eaff);this.snowfall=snowfall;this.wind=wind;this.snow.geometry.setDrawRange(0,Math.round(clamp(snowfall*1200,0,3000)));this.host.style.filter=`saturate(${1-cloud*.001})`;}
 animate=()=>{this.animationId=requestAnimationFrame(this.animate);if(document.hidden||this.suspended){this.clock.getDelta();return;}const delta=Math.min(this.clock.getDelta(),.05),moving=!this.paused&&(!this.reducedMotion||this.motionOverride);if(moving)this.elapsed+=delta;const time=this.elapsed;
  if(this.targetCamera&&this.targetLook){const a=this.reducedMotion?1:1-Math.exp(-delta*4);this.camera.position.lerp(this.targetCamera,a);this.controls.target.lerp(this.targetLook,a);if(this.camera.position.distanceTo(this.targetCamera)<.1){this.targetCamera=null;this.targetLook=null;}}
  if(this.journey){const {route,start}=this.journey;const t=Math.min((time-start)/24,1),p=route.curve.getPoint(t),ahead=route.curve.getPoint(Math.min(1,t+.04));this.traveler.position.copy(p).add(new THREE.Vector3(0,.5,0));if(moving){const direction=p.clone().sub(ahead);direction.y=0;direction.normalize();const pos=p.clone().add(direction.multiplyScalar(16)).add(new THREE.Vector3(0,12,0));this.camera.position.lerp(pos,1-Math.exp(-delta*1.83));this.controls.target.lerp(ahead,1-Math.exp(-delta*3.71));}if(t>=1){this.journey=undefined;this.traveler.visible=false;}}
  this.controls.dampingFactor=1-Math.exp(-delta*5);this.controls.update(delta);
  const compass=document.querySelector<HTMLElement>('.compass-rose');if(compass){const north=this.controls.target.clone().add(new THREE.Vector3(0,0,-10)).project(this.camera),origin=this.controls.target.clone().project(this.camera);const angle=Math.atan2((north.x-origin.x)*this.camera.aspect,north.y-origin.y)*180/Math.PI;compass.style.transform=`rotate(${angle}deg)`;compass.querySelector<HTMLElement>('span')!.style.transform=`rotate(${-angle}deg)`;}
  if(this.wildlife){this.wildlife.visible=this.showWildlife;this.wildlifePoses.forEach((p,i)=>{this.dummy.position.set(p.x,p.y,p.z);this.dummy.rotation.set(0,p.angle,0);const size=this.ecology?.wildlife==='elk'?.38:.30;this.dummy.scale.set(size,size*(1+Math.sin(time*.8+i)*.012),size);this.dummy.updateMatrix();this.wildlife!.setMatrixAt(i,this.dummy.matrix);});this.wildlife.instanceMatrix.needsUpdate=true;}
  for(const lift of this.lifts)updateLift(lift,time,this.dummy);
  if(this.skiers&&this.boarders){this.skiers.visible=this.riderSettings.skiers;this.boarders.visible=this.riderSettings.snowboarders;this.actors.forEach(actor=>{
   const speed=actor.board?this.riderSettings.snowboarderSpeed:this.riderSettings.skierSpeed;const size=(actor.board?this.riderSettings.snowboarderSize:this.riderSettings.skierSize)*(.92+actor.phase*.16);
   if(moving)actor.motionTime+=delta*speed;
   const tangent=actor.route.curve.getTangent(actor.progress),grade=Math.max(0,-tangent.y)/Math.max(.2,Math.hypot(tangent.x,tangent.z));
   if(moving)actor.progress=(actor.progress+delta*speed*riderSpeed(actor.motionTime,actor.phase,grade,actor.board)*this.scale/actor.route.length)%1;
   const t=actor.progress,p=actor.route.curve.getPoint(t),v=actor.route.curve.getTangent(t),carve=Math.sin(actor.motionTime*(actor.board?1.4:1.9)+actor.phase*19);
   const reveal=THREE.MathUtils.smoothstep(Math.min(t,1-t),0,.025);placeRider(this.dummy,p,v,(x,z)=>this.height(x,z),carve,size*reveal);(actor.board?this.boarders!:this.skiers!).setMatrixAt(actor.index,this.dummy.matrix);
  });this.skiers.instanceMatrix.needsUpdate=true;this.boarders.instanceMatrix.needsUpdate=true;}
  this.snow.visible=this.showSnow;if(moving&&this.snowfall>0){for(let i=0;i<this.snowPositions.length;i+=3){this.snowPositions[i]+=delta*this.wind*.07;this.snowPositions[i+1]-=delta*3;if(this.snowPositions[i+1]<0)this.snowPositions[i+1]=140;if(this.snowPositions[i]>135)this.snowPositions[i]=-135;}this.snow.geometry.attributes.position.needsUpdate=true;}
  const w=this.host.clientWidth,h=this.host.clientHeight,occupied:{x:number,y:number,width:number}[]=[];const distance=this.camera.position.distanceTo(this.controls.target);
  for(const label of [...this.labels].sort((a,b)=>(b.feature?.id===this.selectedFeature?.id?10:b.priority)-(a.feature?.id===this.selectedFeature?.id?10:a.priority))){const allowed=label.place ? this.showPlaces&&(label.place.kind==='lodge'||distance<180) : label.road ? this.showRoads&&this.showLabels : this.showLabels&&(label.feature?.kind==='lift'?this.showLifts:label.feature?.kind==='trail'?this.showTrails:true)&&(!label.feature||label.feature.kind==='lift'||distance<190||label.feature.id===this.selectedFeature?.id);
   this.temp.copy(label.point).project(this.camera);const x=(this.temp.x*.5+.5)*w;let y=(-this.temp.y*.5+.5)*h;const originalY=y;const width=Math.min(190,label.el.textContent!.length*(this.mobile?4:5.3)+16);const collides=()=>occupied.some(o=>Math.abs(o.x-x)<(o.width+width)/2+5&&Math.abs(o.y-y)<23);if(label.place?.kind==='lodge'){for(let tries=0;tries<3&&collides();tries++)y-=26;}const collision=collides();label.el.style.setProperty('--leader',`${originalY-y}px`);const visible=allowed&&!collision&&this.temp.z<1&&x>35&&x<w-35&&y>30&&y<h-25&&this.world.visible;
   label.el.hidden=!visible;if(visible){occupied.push({x,y,width});label.el.style.transform=`translate(${x}px,${y}px) translate(-50%,-100%)`;}}
  this.renderer.render(this.scene,this.camera);
 }
}
