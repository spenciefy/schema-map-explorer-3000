import test from 'node:test';
import assert from 'node:assert/strict';
import { mountainRoute } from '../src/routing.ts';
import { resorts } from '../src/data.ts';
test('each mountain supports direct paths, trailing slashes and legacy links',()=>{
 for(const r of resorts){assert.equal(mountainRoute('/'+r.id),r.id);assert.equal(mountainRoute('/'+r.id+'/'),r.id);assert.equal(mountainRoute('/','#'+r.id),r.id);}
});
test('Iwanai alias resolves; unknown and malformed routes do not',()=>{
 assert.equal(mountainRoute('/iwawai'),'iwanai');assert.equal(mountainRoute('/breckenridge'),'breckenridge');
 for(const path of ['/','/not-a-mountain','/%ZZ','/foo/breckenridge'])assert.equal(mountainRoute(path),undefined);
});
