import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRiderSettings,defaultRiderSettings} from '../src/rider-settings.ts';
test('stored rider settings tolerate missing and malformed values',()=>{
 for(const value of [null,undefined,'bad',[],{}])assert.deepEqual(normalizeRiderSettings(value),defaultRiderSettings);
 const settings=normalizeRiderSettings({skiers:false,snowboarders:'false',skierSpeed:0,snowboarderSpeed:99,skierSize:-5,snowboarderSize:NaN});
 assert.equal(settings.skiers,false);assert.equal(settings.snowboarders,true);assert.equal(settings.skierSpeed,0);assert.equal(settings.snowboarderSpeed,3);assert.equal(settings.skierSize,.5);assert.equal(settings.snowboarderSize,1);
});
