import * as THREE from 'three';

export const RIDER_SCALE = .22;

// Split at every terrain triangle edge so each retained segment is downhill
// on the actual rendered mesh, including trails containing local uphill stretches.
export function downhillPaths(points:THREE.Vector3[],height:(x:number,z:number)=>number,width:number,depth:number,n:number){
 const sampled:THREE.Vector3[]=[];
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],ts=new Set([0,1]);
  const u0=(a.x/width+.5)*(n-1),u1=(b.x/width+.5)*(n-1),v0=(a.z/depth+.5)*(n-1),v1=(b.z/depth+.5)*(n-1);
  for(const [start,end] of [[u0,u1],[v0,v1],[u0+v0,u1+v1]]){
   if(Math.abs(end-start)<1e-10)continue;
   for(let k=Math.ceil(Math.min(start,end));k<=Math.floor(Math.max(start,end));k++){const t=(k-start)/(end-start);if(t>0&&t<1)ts.add(t);}
  }
  for(const t of [...ts].sort((a,b)=>a-b)){const p=a.clone().lerp(b,t);p.y=height(p.x,p.z);if(!sampled.length||p.distanceToSquared(sampled[sampled.length-1])>1e-12)sampled.push(p);}
 }
 const paths:THREE.Vector3[][]=[];let run:THREE.Vector3[]=[];
 const finish=()=>{if(run.length>1&&run[0].y-run[run.length-1].y>.02)paths.push(run);run=[];};
 for(let i=1;i<sampled.length;i++){const a=sampled[i-1],b=sampled[i];if(b.y>a.y+1e-8){finish();continue;}if(!run.length)run.push(a);run.push(b);}
 finish();return paths;
}

// Use a terrain-aligned basis and lift the equipment footprint above every
// triangle it touches. This also handles creases between adjacent DEM cells.
export function placeRider(object:THREE.Object3D,p:THREE.Vector3,direction:THREE.Vector3,height:(x:number,z:number)=>number,carve:number,size=1){
 const scale=RIDER_SCALE*size;
 const e=.04,up=new THREE.Vector3(-(height(p.x+e,p.z)-height(p.x-e,p.z))/(2*e),1,-(height(p.x,p.z+e)-height(p.x,p.z-e))/(2*e)).normalize();
 const forward=new THREE.Vector3(direction.x,0,direction.z).normalize().applyAxisAngle(new THREE.Vector3(0,1,0),carve*.16);
 forward.addScaledVector(up,-forward.dot(up)).normalize();
 const right=new THREE.Vector3().crossVectors(up,forward).normalize();
 object.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,up,forward));object.scale.setScalar(scale);object.position.copy(p);object.position.y=height(p.x,p.z);
 let clearance=0;
 for(const x of [-.22,0,.22])for(const z of [-.34,0,.38]){const foot=new THREE.Vector3(x,-.05,z).multiplyScalar(scale).applyQuaternion(object.quaternion);clearance=Math.max(clearance,height(p.x+foot.x,p.z+foot.z)-object.position.y-foot.y);}
 object.position.y+=clearance+.006;object.updateMatrix();
}
