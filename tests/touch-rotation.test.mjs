import test from 'node:test';
import assert from 'node:assert/strict';
import { twistDelta, addTouchRotation } from '../src/touch-rotation.ts';

test('twist follows rotation, ignores pure pinch, and crosses the angle seam smoothly',()=>{
 assert.equal(twistDelta([100,0],[200,0]),0);
 assert.equal(twistDelta([100,0],[0,100]),Math.PI/2);
 assert.equal(twistDelta([100,0],[0,-100]),-Math.PI/2);
 assert.ok(Math.abs(twistDelta([-100,1],[-100,-1]))<.03);
 assert.equal(twistDelta([1,0],[0,1]),0);
});
test('two touches rotate while cancellation, third fingers, and mouse input do not jump',()=>{
 const element=new EventTarget(),angles=[];
 const dispose=addTouchRotation(element,angle=>angles.push(angle));
 const send=(type,id,x,y,pointerType='touch')=>element.dispatchEvent(Object.assign(new Event(type),{pointerId:id,clientX:x,clientY:y,pointerType}));
 send('pointerdown',1,0,0);send('pointermove',1,10,10);assert.equal(angles.length,0);
 send('pointerdown',2,110,10);send('pointermove',2,10,110);assert.equal(angles[0],Math.PI/2);
 send('pointerdown',3,50,50);send('pointermove',2,110,10);assert.equal(angles.length,1);
 send('pointercancel',3,50,50);send('pointermove',2,10,110);assert.equal(angles.length,2);
 send('lostpointercapture',2,10,110);send('pointermove',1,20,20);assert.equal(angles.length,2);
 send('pointerdown',4,100,100,'mouse');send('pointermove',4,200,100,'mouse');assert.equal(angles.length,2);
 dispose();send('pointerdown',5,100,100);send('pointermove',5,0,100);assert.equal(angles.length,2);
});
