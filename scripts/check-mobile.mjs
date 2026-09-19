import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [width,height] of [[320,568],[390,844],[844,390],[820,1180]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/\/src\/main.ts(?:\?.*)?$/,async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+'\nwindow.getAtlas=()=>atlas;'});});
  await page.goto('http://localhost:5173/#palisades');await page.waitForFunction(()=>window.getAtlas?.()?.data?.id==='palisades');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await page.evaluate(()=>document.querySelector('#app').getBoundingClientRect().height>innerHeight+1),false);
  await page.locator('[data-layer="labels"]').evaluate(e=>{if(e.getAttribute('aria-pressed')==='true')e.click();});await page.evaluate(()=>window.getAtlas().showPlaces=false);
  const cdp=await page.context().newCDPSession(page),box=await page.locator('#scene canvas').boundingBox(),x=box.x+box.width*.3,y=box.y+box.height*.5;
  const snap=()=>page.evaluate(()=>{const a=window.getAtlas();return {target:a.controls.target.toArray(),distance:a.camera.position.distanceTo(a.controls.target),direction:a.camera.position.clone().sub(a.controls.target).normalize().toArray()};});
  const gesture=async(points,ends)=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points.map((p,j)=>({...p,x:p.x+(ends[j].x-p.x)*i/12,y:p.y+(ends[j].y-p.y)*i/12}))});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(300);};
  let before=await snap();await gesture([{x,y,id:1}],[{x:x+40,y:y+12}]);let after=await snap();assert(Math.hypot(...after.target.map((v,i)=>v-before.target[i]))>1);
  before=after;await gesture([{x,y,id:1},{x:x+60,y,id:2}],[{x:x+35,y:y+8},{x:x+95,y:y+8}]);after=await snap();assert(Math.hypot(...after.target.map((v,i)=>v-before.target[i]))>1);assert(Math.abs(before.distance-after.distance)<1);
  before=after;await gesture([{x,y,id:1},{x:x+60,y,id:2}],[{x:x-15,y},{x:x+75,y}]);after=await snap();assert(after.distance<before.distance);assert.equal(await page.evaluate(()=>!!window.getAtlas().selectedFeature),false);
  await page.locator('#settings-toggle').click();await page.locator('#wildlife-visible').scrollIntoViewIfNeeded();assert(await page.locator('#wildlife-visible').isVisible());await page.locator('#close-settings').scrollIntoViewIfNeeded();await page.locator('#close-settings').click();
  await page.locator('#reset-view').click();await page.waitForTimeout(1500);await page.screenshot({path:`/tmp/mobile-${width}.png`});assert.deepEqual(errors,[]);console.log(`${width}×${height}: drag, two-finger pan, pinch, panels and bounds passed`);await page.close();
 }
}finally{await browser.close();}
