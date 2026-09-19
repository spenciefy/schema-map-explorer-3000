import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {elevationAt} from '../src/geography.ts';
const d=JSON.parse(readFileSync(new URL('../public/geodata/iwanai.json',import.meta.url)));
test('GSI pilot preserves geographic alignment, coverage provenance and mobile texture',()=>{
 assert.deepEqual(d.imagery.bbox,d.bbox);
 assert.equal(d.imagery.projection,'linear longitude/latitude');
 for(const url of [d.imagery.url,d.imagery.mobileUrl])assert(existsSync(new URL('../public'+url,import.meta.url)));
 assert.equal(d.source.gsiSamples+d.source.fallbackSamples,d.heights.length);
 assert(d.source.gsiSamples/d.heights.length>.85);
 assert.equal(d.source.nativeResolutionMeters,10);
 assert.equal(d.source.gsiCoverage.seamlessphoto.availableTiles,d.source.gsiCoverage.seamlessphoto.requestedTiles);
 assert(d.heights.every(h=>Number.isFinite(h)&&h>=-10&&h<1200));
 const peak=d.peaks.find(p=>p.name==='Mt. Iwanai');
 assert(Math.abs(elevationAt(d,...peak.point)-1085)<20);
});
