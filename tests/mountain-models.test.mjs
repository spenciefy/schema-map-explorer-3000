import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {carrierGeometry,treeGeometry,riderGeometry,riderSpeed,makeLift,updateLift,liftDescription} from '../src/mountain-models.ts';
const get=id=>JSON.parse(readFileSync(new URL('../public/geodata/'+id+'.json',import.meta.url)));
const feature=(overrides={})=>({id:1,kind:'lift',name:'Test',type:'chair_lift',occupancy:4,area:false,difficulty:'',access:'',points:[[0,0],[1000,0]],...overrides});
function dispose(group){group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
test('procedural tree, chair, cabin, and rider geometry merges into finite buffers',()=>{
 for(const g of [treeGeometry(),treeGeometry(true),riderGeometry(false),riderGeometry(true),...[1,2,3,4,6,8].map(n=>carrierGeometry('chair_lift',n)),carrierGeometry('gondola',8),carrierGeometry('funitel',28),carrierGeometry('cable_car',85)]){assert(g);assert(g.attributes.position.count>0);assert([...g.attributes.position.array].every(Number.isFinite));assert.equal(g.attributes.color.count,g.attributes.position.count);g.dispose();}
 const double=carrierGeometry('chair_lift',2),six=carrierGeometry('chair_lift',6);double.computeBoundingBox();six.computeBoundingBox();assert(six.boundingBox.max.x>double.boundingBox.max.x*2);double.dispose();six.dispose();
});
test('capacities are retained for all requested mountain aerial lifts and grounded in sources',()=>{
 for(const id of ['northstar','alta','snowbird','breckenridge','arapahoe-basin','palisades'])for(const f of get(id).features.filter(f=>['chair_lift','gondola','funitel','cable_car'].includes(f.type))){assert(Number.isInteger(f.occupancy)&&f.occupancy>0,id+' '+f.name);assert(f.capacitySource?.startsWith('https://'));if(f.type==='chair_lift')assert(f.occupancy<=8);}
 const lifts=get('palisades').features;assert.equal(lifts.find(f=>f.name==='Gold Coast Funitel').occupancy,28);assert.equal(lifts.find(f=>f.name==='Base to Base').occupancy,8);assert.equal(lifts.find(f=>f.name==='Summit Six').occupancy,6);
});
test('Alpine and full Base to Base gondola remain inside expanded DEM with sourced pylons',()=>{
 const d=get('palisades'),g=d.features.find(f=>f.name==='Base to Base');assert(g.supports.length>20);assert(g.points.every(([x,z])=>Math.abs(x)<=d.width/2&&Math.abs(z)<=d.depth/2));assert(Math.max(...g.points.map(p=>p[1]))-Math.min(...g.points.map(p=>p[1]))>3400);for(const name of ['Roundhouse','Lakeview','Sherwood Express','Treeline Cirque Upper'])assert(d.features.some(f=>f.name===name));
});
test('unknown capacity never produces invented chairs; known lift matrices are finite and pause deterministically',()=>{
 const pts=[new THREE.Vector3(0,0,0),new THREE.Vector3(10,2,0)],group=new THREE.Group(),height=x=>x*.2;
 assert.equal(makeLift(feature({occupancy:undefined}),pts,.01,height,group).length,0);assert.match(liftDescription(feature({occupancy:undefined})),/unverified/);
 const [lift]=makeLift(feature(),pts,.01,height,group),dummy=new THREE.Object3D();updateLift(lift,3,dummy);const previous=Array.from(lift.mesh.instanceMatrix.array);assert(previous.every(Number.isFinite));updateLift(lift,3,dummy);assert.deepEqual(Array.from(lift.mesh.instanceMatrix.array),previous);updateLift(lift,4,dummy);assert.notDeepEqual(Array.from(lift.mesh.instanceMatrix.array),previous);dispose(group);
});
test('rider speeds vary with turn phase, rider skill, terrain grade and discipline',()=>{
 assert.notEqual(riderSpeed(1,.2,.15,false),riderSpeed(2,.2,.15,false));assert.notEqual(riderSpeed(1,.2,.15,false),riderSpeed(1,.8,.15,false));assert(riderSpeed(1,.2,.4,false)>riderSpeed(1,.2,.05,false));assert.notEqual(riderSpeed(1,.2,.15,false),riderSpeed(1,.2,.15,true));
});

test('degenerate mapped lift fragments never create an empty animated curve',()=>{
 const group=new THREE.Group();assert.deepEqual(makeLift(feature(),[new THREE.Vector3(),new THREE.Vector3()],.02,()=>0,group),[]);assert.equal(group.children.length,0);
});
