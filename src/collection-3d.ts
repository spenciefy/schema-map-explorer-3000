import { clusterPoints } from './globe-clusters';
import { loadMountain } from './mountain-cache';
import { addTouchRotation } from './touch-rotation';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { clipFeature, elevationAt, mapReferences } from './geography';
import { resorts, type Resort } from './data';

export class TerrainPreview {
 private renderer?:THREE.WebGLRenderer;private scene=new THREE.Scene();private camera=new THREE.PerspectiveCamera(35,1,.1,2000);
 private mountain?:THREE.Group;private host?:HTMLElement;private request=0;private yaw=.4;private pitch=.8;private distance=430;
 private start?:{x:number;y:number;yaw:number;pitch:number};private dragged=false;
 constructor(private grid:HTMLElement){
  grid.querySelectorAll<HTMLElement>('.mountain-preview').forEach(host=>{
   const id=host.closest('a')!.getAttribute('href')!.slice(1);host.setAttribute('aria-label','Drag to rotate '+resorts.find(r=>r.id===id)!.name);
   host.closest('a')!.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();void this.activate(host,id);if(e.key==='ArrowLeft')this.yaw-=.15;if(e.key==='ArrowRight')this.yaw+=.15;if(e.key==='ArrowUp')this.pitch=Math.min(1.4,this.pitch+.1);if(e.key==='ArrowDown')this.pitch=Math.max(.2,this.pitch-.1);this.render();});
   host.addEventListener('pointerdown',e=>{if(e.button!==0)return;if(this.host!==host){this.yaw=Math.atan2(mapReferences[id].view[0],mapReferences[id].view[1]);this.pitch=.75;}this.start={x:e.clientX,y:e.clientY,yaw:this.yaw,pitch:this.pitch};this.dragged=false;host.setPointerCapture(e.pointerId);});
   host.addEventListener('pointermove',e=>{if(!this.start)return;const dx=e.clientX-this.start.x,dy=e.clientY-this.start.y;if(!this.dragged&&Math.hypot(dx,dy)>6){this.dragged=true;void this.activate(host,id);}if(this.dragged){this.yaw=this.start.yaw-dx*.008;this.pitch=THREE.MathUtils.clamp(this.start.pitch+dy*.006,.2,1.4);this.render();}});
   host.addEventListener('pointerup',()=>{this.start=undefined;});host.addEventListener('pointercancel',()=>{this.start=undefined;this.dragged=true;});
   host.addEventListener('click',e=>{if(this.dragged){e.preventDefault();e.stopPropagation();this.dragged=false;}},true);
  });
  new ResizeObserver(()=>this.render()).observe(grid);
 }
 async activate(host:HTMLElement,id:string){
  if(this.host===host)return;this.host?.classList.remove('preview-active');this.host=host;this.yaw=Math.atan2(mapReferences[id].view[0],mapReferences[id].view[1]);this.pitch=.75;const request=++this.request;
  try{
   if(!this.renderer){this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.domElement.setAttribute('aria-hidden','true');this.scene.add(new THREE.HemisphereLight(0xfffaf0,0x839388,1.5));const sun=new THREE.DirectionalLight(0xffffff,2);sun.position.set(-80,150,-100);this.scene.add(sun);}
   this.renderer.domElement.remove();const d=await loadMountain(id);if(request!==this.request)return;
   if(this.mountain){this.scene.remove(this.mountain);this.mountain.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){o.geometry.dispose();(o.material as THREE.Material).dispose();}});}
   let cover:ImageData|undefined;if(d.landcover){try{const img=new Image();img.src=d.landcover;await img.decode();const c=document.createElement('canvas');c.width=c.height=97;const ctx=c.getContext('2d')!;ctx.imageSmoothingEnabled=false;ctx.drawImage(img,0,0,97,97);cover=ctx.getImageData(0,0,97,97);}catch{}}if(request!==this.request)return;
   const group=new THREE.Group(),scale=240/Math.max(d.width,d.depth),min=d.heights.reduce((a,b)=>Math.min(a,b),Infinity),max=d.heights.reduce((a,b)=>Math.max(a,b),-Infinity);
   const n=97,vertices:number[]=[],indices:number[]=[],colors:number[]=[];
   for(let z=0;z<n;z++)for(let x=0;x<n;x++){const px=(x/(n-1)-.5)*d.width,pz=(z/(n-1)-.5)*d.depth;const type=cover?.data[(z*n+x)*4],water=id==='iwanai'&&type===80;vertices.push(px*scale,((water?0:elevationAt(d,px,pz))-min)*scale,pz*scale);const color=new THREE.Color(water?0x729da8:type===10?(resorts.find(r=>r.id===id)!.region==='japan'?0xcdd3c8:0xaabbb0):0xe8e9df);colors.push(color.r,color.g,color.b);}
   for(let z=0;z<n-1;z++)for(let x=0;x<n-1;x++){const a=z*n+x;indices.push(a,a+n,a+1,a+1,a+n,a+n+1);}
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();group.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide})));
   for(const f of d.features.filter(f=>!f.area).flatMap(f=>clipFeature(d,f))){const pts=f.points.map(p=>new THREE.Vector3(p[0]*scale,(elevationAt(d,...p)-min)*scale+.15,p[1]*scale));if(pts.length>1)group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:f.kind==='lift'?0xb96b50:0x83998c,transparent:true,opacity:.55})));}
   group.position.y=-(max-min)*scale*.35;this.mountain=group;this.scene.add(group);host.append(this.renderer.domElement);host.classList.add('preview-active');this.render();
  }catch{if(request===this.request){host.classList.remove('preview-active');this.host=undefined;}}
 }
 hide(){this.request++;this.host?.classList.remove('preview-active');this.host=undefined;this.renderer?.domElement.remove();this.start=undefined;}
 private render(){if(!this.renderer||!this.host||!this.mountain)return;const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.camera.position.set(Math.sin(this.yaw)*Math.cos(this.pitch)*this.distance,Math.sin(this.pitch)*this.distance,Math.cos(this.yaw)*Math.cos(this.pitch)*this.distance);this.camera.lookAt(0,0,0);this.renderer.render(this.scene,this.camera);}
}

export function globePosition(lat:number,lon:number,r=1){const a=THREE.MathUtils.degToRad(lat),b=THREE.MathUtils.degToRad(lon);return new THREE.Vector3(Math.cos(a)*Math.cos(b)*r,Math.sin(a)*r,-Math.cos(a)*Math.sin(b)*r);}
export class MountainGlobe {
 private renderer:THREE.WebGLRenderer;private scene=new THREE.Scene();private camera=new THREE.PerspectiveCamera(38,1,.01,20);private controls:OrbitControls;
 private markerLayer=document.createElement('div');private markerButtons=new Map<string,HTMLButtonElement>();private markerState='';private enabled=false;private ids=new Set(resorts.map(r=>r.id));
 constructor(private host:HTMLElement,private select:(resort:Resort)=>void,private selectGroup:(resorts:Resort[])=>void){
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));host.append(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-label','Mountain globe. Drag or twist two fingers to rotate; scroll or pinch to zoom. Use the mountain list to select with a keyboard.');this.renderer.domElement.setAttribute('role','img');
  this.camera.position.copy(globePosition(38,-110,3.4));this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enablePan=false;this.controls.minDistance=1.08;this.controls.maxDistance=4.5;this.controls.enableDamping=true;
  addTouchRotation(this.renderer.domElement,angle=>{const offset=this.camera.position.clone().sub(this.controls.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),angle);this.camera.position.copy(this.controls.target).add(offset);this.controls.update();});
  this.scene.add(new THREE.HemisphereLight(0xffffff,0xb5c1b7,2));const sphere=new THREE.Mesh(new THREE.SphereGeometry(1,96,64),new THREE.MeshBasicMaterial({color:0xe1e5db}));this.scene.add(sphere);void this.land(sphere);
  this.markerLayer.className='globe-marker-layer';host.append(this.markerLayer);
  new ResizeObserver(()=>this.resize()).observe(host);this.renderer.setAnimationLoop(()=>{if(!this.enabled||document.hidden)return;this.controls.update();this.renderer.render(this.scene,this.camera);this.updateMarkers();});

 }
 private async land(sphere:THREE.Mesh){try{const res=await fetch('/globe-land.geojson');const data=await res.json();const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;const c=canvas.getContext('2d')!;c.fillStyle='#ccd9d6';c.fillRect(0,0,2048,1024);c.fillStyle='#edf0e4';for(const feature of data.features){const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;for(const polygon of polygons){c.beginPath();for(const ring of polygon){ring.forEach(([lon,lat]:number[],i:number)=>{const x=(lon+180)/360*2048,y=(90-lat)/180*1024;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);});c.closePath();}c.fill('evenodd');}}const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;(sphere.material as THREE.MeshBasicMaterial).map=texture;(sphere.material as THREE.MeshBasicMaterial).color.setHex(0xffffff);(sphere.material as THREE.Material).needsUpdate=true;}catch{this.host.dataset.mapError='Coastlines unavailable';}}
 setVisible(show:boolean){this.enabled=show;this.resize();}filter(ids:Set<string>){this.ids=ids;this.markerState='';}
 focus(resort:Resort){this.camera.position.copy(globePosition(resort.lat,resort.lon,2));this.controls.target.set(0,0,0);this.controls.update();this.select(resort);}
 region(lat:number,lon:number,distance=2){this.camera.position.copy(globePosition(lat,lon,distance));this.controls.target.set(0,0,0);this.controls.update();}
 private updateMarkers(){
  const w=this.host.clientWidth,h=this.host.clientHeight;
  const state=[...this.camera.position.toArray(),...this.camera.quaternion.toArray(),w,h].join(',');if(state===this.markerState)return;this.markerState=state;
  const points=resorts.filter(r=>this.ids.has(r.id)).flatMap(resort=>{const normal=globePosition(resort.lat,resort.lon);if(normal.dot(this.camera.position.clone().sub(normal))<=0)return [];const p=normal.clone().multiplyScalar(1.006).project(this.camera),x=(p.x+1)*w/2,y=(1-p.y)*h/2;return p.z<1&&x>22&&x<w-22&&y>22&&y<h-22?[{id:resort.id,resort,x,y}]:[];});
  const groups=clusterPoints(points),active=new Set<string>();
  for(const group of groups){const members=group.points.map(p=>p.resort),key=members.map(r=>r.id).sort().join('|');active.add(key);let button=this.markerButtons.get(key);
   if(!button){button=document.createElement('button');button.className='globe-marker';this.markerButtons.set(key,button);this.markerLayer.append(button);button.onclick=()=>{if(members.length===1){this.select(members[0]);return;}const normal=members.reduce((sum,r)=>sum.add(globePosition(r.lat,r.lon)),new THREE.Vector3()).normalize();this.camera.position.copy(normal.multiplyScalar(1+Math.max(.08,(this.camera.position.length()-1)*.55)));this.controls.update();this.selectGroup(members);};}
   button.textContent=members.length===1?members[0].name:String(members.length);button.classList.toggle('is-cluster',members.length>1);button.setAttribute('aria-label',members.length===1?'Select '+members[0].name:'Explore '+members.length+' mountains: '+members.map(r=>r.name).join(', '));button.title=members.map(r=>r.name).join(', ');button.style.left=group.x+'px';button.style.top=group.y+'px';
  }
  for(const [key,button] of this.markerButtons)if(!active.has(key)){button.remove();this.markerButtons.delete(key);}
 }
 private resize(){if(!this.enabled)return;const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
}
