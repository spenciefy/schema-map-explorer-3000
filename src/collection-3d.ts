import { addTouchRotation } from './touch-rotation';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { clipFeature, elevationAt, mapReferences, type MountainData } from './geography';
import { resorts, type Resort } from './data';

export class TerrainPreview {
 private renderer?:THREE.WebGLRenderer;private scene=new THREE.Scene();private camera=new THREE.PerspectiveCamera(36,1,.1,2000);
 private mountain?:THREE.Group;private host?:HTMLElement;private request=0;private yaw=.4;private pitch=.8;private distance=360;
 private start?:{x:number;y:number;yaw:number;pitch:number};private dragged=false;
 constructor(private grid:HTMLElement){
  grid.querySelectorAll<HTMLElement>('.mountain-preview').forEach(host=>{
   const id=host.closest('a')!.getAttribute('href')!.slice(1);host.setAttribute('aria-label','Drag to rotate '+resorts.find(r=>r.id===id)!.name);
   host.title='Drag to rotate';host.closest('a')!.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();void this.activate(host,id);if(e.key==='ArrowLeft')this.yaw-=.15;if(e.key==='ArrowRight')this.yaw+=.15;if(e.key==='ArrowUp')this.pitch=Math.min(1.4,this.pitch+.1);if(e.key==='ArrowDown')this.pitch=Math.max(.2,this.pitch-.1);this.render();});
   host.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')void this.activate(host,id);});
   host.addEventListener('pointerdown',e=>{if(e.button!==0)return;void this.activate(host,id);this.start={x:e.clientX,y:e.clientY,yaw:this.yaw,pitch:this.pitch};this.dragged=false;host.setPointerCapture(e.pointerId);});
   host.addEventListener('pointermove',e=>{if(!this.start)return;const dx=e.clientX-this.start.x,dy=e.clientY-this.start.y;if(Math.hypot(dx,dy)>6)this.dragged=true;if(this.dragged){this.yaw=this.start.yaw-dx*.008;this.pitch=THREE.MathUtils.clamp(this.start.pitch+dy*.006,.2,1.4);this.render();}});
   host.addEventListener('pointerup',()=>{this.start=undefined;});host.addEventListener('pointercancel',()=>{this.start=undefined;this.dragged=true;});
   host.addEventListener('click',e=>{if(this.dragged){e.preventDefault();e.stopPropagation();this.dragged=false;}},true);
  });
  new ResizeObserver(()=>this.render()).observe(grid);
 }
 async activate(host:HTMLElement,id:string){
  if(this.host===host)return;this.host?.classList.remove('preview-active');this.host=host;this.yaw=Math.atan2(mapReferences[id].view[0],mapReferences[id].view[1]);this.pitch=.75;const request=++this.request;
  try{
   if(!this.renderer){this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.domElement.setAttribute('aria-hidden','true');this.scene.add(new THREE.HemisphereLight(0xfffaf0,0x839388,1.5));const sun=new THREE.DirectionalLight(0xffffff,2);sun.position.set(-80,150,-100);this.scene.add(sun);}
   this.renderer.domElement.remove();const response=await fetch('/geodata/'+id+'.json');if(!response.ok)throw Error();const d=await response.json() as MountainData;if(request!==this.request)return;
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
 private markers:{resort:Resort;sprite:THREE.Sprite;dot:THREE.Mesh;normal:THREE.Vector3}[]=[];private enabled=false;private ids=new Set(resorts.map(r=>r.id));private down=[0,0];
 constructor(private host:HTMLElement,private select:(resort:Resort)=>void){
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));host.append(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-label','Mountain globe. Drag or twist two fingers to rotate; scroll or pinch to zoom. Use the mountain list to select with a keyboard.');this.renderer.domElement.setAttribute('role','img');
  this.camera.position.copy(globePosition(38,-110,3.4));this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enablePan=false;this.controls.minDistance=1.3;this.controls.maxDistance=4.5;this.controls.enableDamping=true;
  addTouchRotation(this.renderer.domElement,angle=>{const offset=this.camera.position.clone().sub(this.controls.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),angle);this.camera.position.copy(this.controls.target).add(offset);this.controls.update();});
  this.scene.add(new THREE.HemisphereLight(0xffffff,0xb5c1b7,2));const sphere=new THREE.Mesh(new THREE.SphereGeometry(1,96,64),new THREE.MeshBasicMaterial({color:0xe1e5db}));this.scene.add(sphere);void this.land(sphere);
  const loader=new THREE.ImageLoader();for(const resort of resorts){const normal=globePosition(resort.lat,resort.lon),material=new THREE.SpriteMaterial({color:0xb46649,depthTest:false});const sprite=new THREE.Sprite(material);sprite.position.copy(normal).multiplyScalar(1.015);sprite.scale.set(.025,.025,1);sprite.userData.id=resort.id;this.scene.add(sprite);const dot=new THREE.Mesh(new THREE.SphereGeometry(.0045,8,6),new THREE.MeshBasicMaterial({color:0xb46649,depthTest:false}));dot.position.copy(normal).multiplyScalar(1.007);dot.userData.id=resort.id;this.scene.add(dot);this.markers.push({resort,sprite,dot,normal});loader.load('/previews/'+resort.id+'.png',img=>{const canvas=document.createElement('canvas');canvas.width=96;canvas.height=70;canvas.getContext('2d')!.drawImage(img,0,0,96,70);const ctx=canvas.getContext('2d')!,pixels=ctx.getImageData(0,0,96,70);for(let i=0;i<pixels.data.length;i+=4){if(Math.abs(pixels.data[i]-245)<10&&Math.abs(pixels.data[i+1]-243)<10&&Math.abs(pixels.data[i+2]-235)<10)pixels.data[i+3]=0;}ctx.putImageData(pixels,0,0);material.map=new THREE.CanvasTexture(canvas);material.map.colorSpace=THREE.SRGBColorSpace;material.color.setHex(0xffffff);material.needsUpdate=true;sprite.scale.set(.105,.077,1);});}
  this.renderer.domElement.addEventListener('pointerdown',e=>{this.down=[e.clientX,e.clientY];});
  this.renderer.domElement.addEventListener('click',e=>{if(Math.hypot(e.clientX-this.down[0],e.clientY-this.down[1])>6)return;const box=this.renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1),this.camera);const hit=ray.intersectObjects(this.markers.flatMap(m=>[m.sprite,m.dot].filter(o=>o.visible)))[0];if(hit)this.select(resorts.find(r=>r.id===hit.object.userData.id)!);});
  new ResizeObserver(()=>this.resize()).observe(host);this.renderer.setAnimationLoop(()=>{if(!this.enabled||document.hidden)return;this.controls.update();const occupied:THREE.Vector3[]=[];for(const m of this.markers){const front=this.ids.has(m.resort.id)&&m.normal.dot(this.camera.position.clone().sub(m.normal))>0;const p=m.sprite.position.clone().project(this.camera);m.sprite.visible=front&&!occupied.some(q=>Math.abs(q.x-p.x)<.09&&Math.abs(q.y-p.y)<.12);m.dot.visible=front;if(m.sprite.visible)occupied.push(p);}this.renderer.render(this.scene,this.camera);});
 }
 private async land(sphere:THREE.Mesh){try{const res=await fetch('/globe-land.geojson');const data=await res.json();const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;const c=canvas.getContext('2d')!;c.fillStyle='#ccd9d6';c.fillRect(0,0,2048,1024);c.fillStyle='#edf0e4';for(const feature of data.features){const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;for(const polygon of polygons){c.beginPath();for(const ring of polygon){ring.forEach(([lon,lat]:number[],i:number)=>{const x=(lon+180)/360*2048,y=(90-lat)/180*1024;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);});c.closePath();}c.fill('evenodd');}}const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;(sphere.material as THREE.MeshBasicMaterial).map=texture;(sphere.material as THREE.MeshBasicMaterial).color.setHex(0xffffff);(sphere.material as THREE.Material).needsUpdate=true;}catch{this.host.dataset.mapError='Coastlines unavailable';}}
 setVisible(show:boolean){this.enabled=show;this.resize();}filter(ids:Set<string>){this.ids=ids;}
 focus(resort:Resort){this.camera.position.copy(globePosition(resort.lat,resort.lon,2));this.controls.target.set(0,0,0);this.controls.update();this.select(resort);}
 private resize(){if(!this.enabled)return;const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
}
