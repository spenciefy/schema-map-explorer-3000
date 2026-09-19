import test from 'node:test';
import assert from 'node:assert/strict';
import { createMountainLoader } from '../src/mountain-cache.ts';
const data={gridSize:2,heights:[1,2,3,4]};
test('preview and map share one request and parsed object',async()=>{
 let requests=0,parses=0;
 const load=createMountainLoader(async()=>{requests++;return {ok:true,json:async()=>{parses++;return data;}};});
 const [preview,map]=await Promise.all([load('iwanai'),load('iwanai')]);
 assert.equal(preview,map);assert.equal(await load('iwanai'),map);
 assert.equal(requests,1);assert.equal(parses,1);
});
test('least recently used mountains are evicted',async()=>{
 const requests=[];const load=createMountainLoader(async url=>{requests.push(url);return {ok:true,json:async()=>data};},2);
 await load('alta');await load('iwanai');await load('alta');await load('snowbird');await load('iwanai');
 assert.deepEqual(requests,['/geodata/alta.json','/geodata/iwanai.json','/geodata/snowbird.json','/geodata/iwanai.json']);
});
test('failed and invalid downloads can be retried',async()=>{
 let tries=0;const load=createMountainLoader(async()=>{tries++;return {ok:tries!==1,json:async()=>tries===2?{gridSize:2,heights:[]}:data};});
 await assert.rejects(load('iwanai'),/unavailable/);await assert.rejects(load('iwanai'),/Invalid/);
 assert.equal(await load('iwanai'),data);assert.equal(tries,3);
});
