import { resorts } from '../src/data.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {elevationAt,clipFeature,featureLength,trailColor} from '../src/geography.ts';
const flat={width:100,depth:100,gridSize:2,heights:[0,100,200,300]};
const feature=points=>({id:1,kind:'trail',name:'Test',difficulty:'easy',type:'downhill',area:false,access:'',points});
test('north/south and east/west coordinate orientation and bilinear height',()=>{
 assert.equal(elevationAt(flat,-50,-50),0);assert.equal(elevationAt(flat,50,-50),100);
 assert.equal(elevationAt(flat,-50,50),200);assert.equal(elevationAt(flat,0,0),150);
});
test('clip crossings even when both endpoints are outside the DEM',()=>{
 const parts=clipFeature(flat,feature([[-100,0],[100,0]]));
 assert.deepEqual(parts[0].points,[[-50,0],[50,0]]);assert.equal(featureLength(parts[0]),100);
});
test('never connect a route across an excursion outside the DEM',()=>{
 const parts=clipFeature(flat,feature([[0,0],[100,0],[100,40],[0,40]]));
 assert.equal(parts.length,2);assert.equal(parts.reduce((n,p)=>n+featureLength(p),0),100);
 assert.deepEqual(clipFeature(flat,feature([[-100,-100],[-100,100]])),[]);
});
test('regional intermediate trail colors',()=>{assert.notEqual(trailColor('palisades','intermediate'),trailColor('niseko','intermediate'));assert.equal(trailColor('niseko','intermediate'),trailColor('verbier','intermediate'));});
const files=readdirSync(new URL('../public/geodata/',import.meta.url)).filter(f=>f.endsWith('.json'));
test('all destination geographic extracts have valid terrain, coverage, and source metadata',()=>{
 const ids=resorts.map(r=>r.id);assert.deepEqual(files.map(f=>f.replace('.json','')).sort(),ids.sort());
 for(const file of files){const d=JSON.parse(readFileSync(new URL('../public/geodata/'+file,import.meta.url)));
  assert.equal(d.heights.length,d.gridSize**2,file);assert(d.heights.every(Number.isFinite),file);
  assert(d.features.length>10,file);assert(d.source.osmTimestamp,file);assert(d.width>0&&d.depth>0,file);
  const [south,west,north,east]=d.bbox;
  assert(Math.abs(d.depth-(north-south)*111320)<.1,file);
  assert(Math.abs(d.width-(east-west)*111320*Math.cos(d.center[1]*Math.PI/180))<.1,file);
  assert(d.features.every(f=>f.points.length>=2&&f.points.every(p=>p.length===2&&p.every(Number.isFinite))),file);
  assert(d.landcover&&existsSync(new URL('../public'+d.landcover,import.meta.url)),file);
  const clipped=d.features.flatMap(f=>clipFeature(d,f));
  assert(clipped.every(f=>f.points.every(p=>Math.abs(p[0])<=d.width/2+.001&&Math.abs(p[1])<=d.depth/2+.001)),file);
 }
});
test('recognizable lifts and source access status are preserved',()=>{
 const get=id=>JSON.parse(readFileSync(new URL('../public/geodata/'+id+'.json',import.meta.url)));
 assert(get('palisades').features.some(f=>f.kind==='lift'&&/KT.*22/i.test(f.name)));
 assert(get('powder').features.some(f=>f.kind==='lift'&&/Hidden Lake/.test(f.name)));
 assert(get('powder').features.some(f=>/DMI/.test(f.name)&&f.proposed));
 assert(get('powder').features.some(f=>f.kind==='lift'&&f.access==='private'));
 assert(get('whistler').features.some(f=>f.kind==='lift'&&/peak.*2.*peak/i.test(f.name)));
});

test('every destination contains sourced roads, buildings, and places',()=>{
 for(const file of files){const d=JSON.parse(readFileSync(new URL('../public/geodata/'+file,import.meta.url)));
  assert(d.roads.length>0,file);assert(d.buildings.length>0,file);assert(d.places.length>0,file);assert(d.source.placesTimestamp,file);
  assert(d.roads.every(r=>r.points.length>1&&r.points.every(p=>p.every(Number.isFinite))),file);
  assert(d.buildings.every(b=>b.points.length>3&&b.points.every(p=>p.every(Number.isFinite))),file);
  assert(d.places.every(p=>p.point.every(Number.isFinite)&&p.url.startsWith('https://www.openstreetmap.org/')),file);
 }
});
test('Powder lodge geometry agrees with the official resort-linked location references',()=>{
 const d=JSON.parse(readFileSync(new URL('../public/geodata/powder.json',import.meta.url)));
 const refs=[['Hidden Lake Lodge',41.3696636,-111.7645186],['Timberline Lodge',41.378963,-111.780685],['Sundown Lodge',41.3769851,-111.7869793]];
 for(const[name,lat,lon]of refs){const p=d.places.find(p=>p.name===name);assert(p,name);const x=(lon-d.center[0])*111320*Math.cos(d.center[1]*Math.PI/180),z=(d.center[1]-lat)*111320;assert(Math.hypot(x-p.point[0],z-p.point[1])<100,name);}
});

test('new mountains preserve landmark lifts and separate neighboring resort networks',()=>{
 const get=id=>JSON.parse(readFileSync(new URL('../public/geodata/'+id+'.json',import.meta.url)));
 for(const[id,name] of [['northstar','Comstock Express'],['alta','Collins'],['snowbird','Aerial Tram'],['breckenridge','Kensho SuperChair'],['arapahoe-basin','Lenawee Express']]){assert(get(id).features.some(f=>f.kind==='lift'&&f.name===name),id+' '+name);}
 assert(!get('alta').features.some(f=>f.kind==='lift'&&f.name==='Gadzoom'));
 assert(!get('snowbird').features.some(f=>f.kind==='lift'&&f.name==='Collins'));
 assert(!get('breckenridge').features.some(f=>f.kind==='lift'&&['Resolution','Alpine'].includes(f.name)));
 for(const id of ['alta','snowbird','breckenridge'])assert(get(id).source.resortBoundary);
});
