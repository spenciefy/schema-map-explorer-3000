import test from 'node:test';
import assert from 'node:assert/strict';
import {resorts} from '../src/data.ts';
import {ecologyFor,treeAtElevation} from '../src/ecology.ts';
import {localeTreeGeometry,wildlifeGeometry,shrubGeometry} from '../src/ecology-models.ts';
test('all mountains receive a regional ecology with distinct landmark palettes',()=>{
 const get=id=>ecologyFor(resorts.find(r=>r.id===id));
 assert.equal(get('palisades').id,'sierra');assert.equal(get('whistler').id,'coastal');assert.equal(get('breckenridge').id,'rockies');assert.equal(get('niseko').id,'hokkaido');assert.equal(get('hakuba').wildlife,'serow');assert.equal(get('verbier').id,'alps');assert.equal(get('alyeska').id,'alaska');
 for(const resort of resorts){const p=ecologyFor(resort);assert(p.trees.length);const low=treeAtElevation(p,p.treeline-700,.9),high=treeAtElevation(p,p.treeline+200,.9);assert(high.scale<low.scale);assert(high.density<low.density);assert(p.trees.includes(high.form));}
});
test('winter tree forms and wildlife have finite, distinct geometry',()=>{
 const boxes=[];
 for(const form of ['pine','fir','spruce','hemlock','birch','aspen','larch'])for(const snow of [false,true]){const g=localeTreeGeometry(form,snow);assert([...g.attributes.position.array].every(Number.isFinite));assert.equal(g.attributes.color.count,g.attributes.position.count);g.computeBoundingBox();boxes.push(g.boundingBox.max.y);g.dispose();}
 assert(new Set(boxes).size>2);
 for(const kind of ['deer','elk','chamois','serow','hare']){const g=wildlifeGeometry(kind);assert([...g.attributes.position.array].every(Number.isFinite));assert(g.attributes.position.count>100);g.dispose();}
 for(const evergreen of [true,false])shrubGeometry(evergreen).dispose();
});

test('Japanese winter forests thin to bare upper slopes without evergreen crowns',()=>{
 for(const id of ['iwanai','niseko','rusutsu','hakuba']){
  const profile=ecologyFor(resorts.find(r=>r.id===id));
  assert(profile.winterTint<.3);
  assert.equal(treeAtElevation(profile,profile.treeline+50,.99).density,0);
  assert.equal(treeAtElevation(profile,profile.treeline-100,.99).form,'birch');
 }
 assert(ecologyFor(resorts.find(r=>r.id==='iwanai')).treeline<1085);
});
