import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resorts} from '../src/data.ts';
import {mapReferences} from '../src/geography.ts';
const rows=JSON.parse(readFileSync(new URL('../research/western-resorts.json',import.meta.url)));
const get=id=>JSON.parse(readFileSync(new URL('../public/geodata/'+id+'.json',import.meta.url)));
test('western expansion has real terrain, previews and source links for every catalog tile',()=>{
 assert.equal(rows.length,42);assert.equal(resorts.length,61);assert.equal(new Set(resorts.map(r=>r.id)).size,61);
 for(const row of rows){const resort=resorts.find(r=>r.id===row.id);assert(resort,row.id);assert.equal(resort.region,'north-america');assert.equal(resort.pass,row.passType);assert.deepEqual(get(row.id).bbox,row.bbox);assert(existsSync(new URL('../public/previews/'+row.id+'.png',import.meta.url)),row.id);assert(mapReferences[row.id].url.startsWith('https://'));assert(resort.elevation>0);}
});
test('adjacent western mountains retain their own lift networks',()=>{
 const names=id=>get(id).features.filter(f=>f.kind==='lift').map(f=>f.name);
 assert(names('aspen-highlands').some(n=>n==='Loge Peak'));assert(!names('aspen-highlands').includes('Silver Queen'));
 assert(names('buttermilk').some(n=>n==='Panda Peak'));assert(!names('buttermilk').includes('Exhibition'));
 assert(names('brighton').some(n=>n.includes('Milly')));assert(!names('brighton').includes('Summit Express'));
 assert(names('solitude').some(n=>n.includes('Summit')));assert(!names('solitude').includes('Milly Express'));
});
test('new destination landmarks and mixed lift capacities are preserved',()=>{
 assert(get('big-sky').features.some(f=>/Ramcharger/i.test(f.name)&&f.occupancy===8));
 assert(get('copper').features.some(f=>f.name==='American Eagle'&&f.chairSeats===6&&f.cabinOccupancy===8));
 assert(get('deer-valley').features.some(f=>f.name==='Jordanelle Express Gondola'&&f.occupancy===4));
 assert(get('vail').features.some(f=>/Orient Express/i.test(f.name)));
 assert(get('lake-louise').features.some(f=>/Paradise/i.test(f.name)));
});
