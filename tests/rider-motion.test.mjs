import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {surfaceElevationAt,clipFeature} from '../src/geography.ts';
import {downhillPaths,placeRider,RIDER_SCALE} from '../src/rider-motion.ts';
import {riderGeometry,riderSpeed} from '../src/mountain-models.ts';

test('height follows terrain triangles rather than a bilinear saddle',()=>{
 const data={gridSize:2,width:2,depth:2,heights:[0,0,0,10]};
 assert.equal(surfaceElevationAt(data,-.5,-.5),0);
 assert.equal(surfaceElevationAt(data,.5,.5),5);
});
test('all retained Palisades rider paths descend on the rendered terrain',()=>{
 const d=JSON.parse(readFileSync(new URL('../public/geodata/palisades.json',import.meta.url))),scale=240/Math.max(d.width,d.depth),height=(x,z)=>surfaceElevationAt(d,x/scale,z/scale)*scale;
 let paths=0;
 for(const f of d.features.flatMap(f=>clipFeature(d,f)).filter(f=>f.kind==='trail'&&!f.area)){
  const pts=f.points.map(([x,z])=>new THREE.Vector3(x*scale,height(x*scale,z*scale),z*scale));if(pts[0].y<pts.at(-1).y)pts.reverse();
  for(const run of downhillPaths(pts,height,d.width*scale,d.depth*scale,d.gridSize)){
   paths++;
   for(let i=1;i<run.length;i++){
    let previous=run[i-1].y;
    for(let j=1;j<=5;j++){const p=run[i-1].clone().lerp(run[i],j/5),y=height(p.x,p.z);assert(y<=previous+1e-6);previous=y;}
   }
  }
 }
 assert(paths>100);
});
test('skis and boards stay above slopes and a terrain crease',()=>{
 for(const size of [.1,.5,1,2,2.2])for(const board of [false,true])for(const height of [(x,z)=>-z*.7+x*.4,(x,z)=>Math.abs(x)*.6-z*.4])for(const carve of [-1,0,1]){
  const object=new THREE.Object3D();placeRider(object,new THREE.Vector3(),new THREE.Vector3(0,-.7,1),height,carve,size);
  const geometry=riderGeometry(board),pos=geometry.attributes.position;
  for(let i=0;i<pos.count;i++){const p=new THREE.Vector3().fromBufferAttribute(pos,i).applyMatrix4(object.matrix);assert(p.y>=height(p.x,p.z)-1e-6,`${board?'board':'ski'} intersects snow`);}
  assert.equal(object.scale.x,RIDER_SCALE*size);geometry.dispose();
 }
 assert(RIDER_SCALE<.85/2);
 for(let i=0;i<100;i++)assert(riderSpeed(i,i/100,.15,i%2===0)>=4);
});
