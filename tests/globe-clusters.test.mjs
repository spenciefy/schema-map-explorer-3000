import test from 'node:test';
import assert from 'node:assert/strict';
import { clusterPoints } from '../src/globe-clusters.ts';
test('nearby mountains cluster without dropping or duplicating destinations',()=>{
 const points=[{id:'a',x:10,y:10},{id:'b',x:20,y:20},{id:'c',x:300,y:100}];
 const groups=clusterPoints(points);assert.equal(groups.length,2);assert.deepEqual(groups.flatMap(g=>g.points.map(p=>p.id)).sort(),['a','b','c']);assert.equal(groups[0].x,15);
 assert.deepEqual(points[0],{id:'a',x:10,y:10});
});
test('groups split when screen-space separation grows with zoom',()=>{
 assert.equal(clusterPoints([{id:'a',x:0,y:0},{id:'b',x:100,y:0}]).length,1);
 assert.equal(clusterPoints([{id:'a',x:0,y:0},{id:'b',x:200,y:0}]).length,2);
 assert.deepEqual(clusterPoints([]),[]);
});
