import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { liftPalette,defaultLiftPalette,resortLogo } from '../src/resort-identity.ts';
test('resort and named lift overrides do not leak to other lifts',()=>{
 assert.notEqual(liftPalette('jackson').station,defaultLiftPalette.station);
 assert.equal(liftPalette('whistler','PEAK 2 PEAK Gondola').carrier,0xc53035);
 assert.deepEqual(liftPalette('whistler','Creekside'),defaultLiftPalette);
 assert.deepEqual(liftPalette('unknown'),defaultLiftPalette);
});
test('registered official logos exist locally and unknown resorts have no fabricated mark',()=>{
 for(const id of ['jackson','iwanai','palisades'])assert.ok(existsSync(new URL('../public'+resortLogo(id),import.meta.url)));
 assert.equal(resortLogo('unknown'),undefined);
});
