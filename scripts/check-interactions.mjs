import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}});page.on('pageerror',e=>errors.push(e.message));
 await page.route(/\/src\/main.ts(?:\?.*)?$/,async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+'\nwindow.getAtlas=()=>atlas;'});});
 await page.goto('http://localhost:5173/');assert.equal(await page.title(),'Ski Map Explorer 3000');assert.equal(await page.locator('.mountain-tile').count(),61);
 await page.locator('a.mountain-tile[href="/palisades"]').click();await page.waitForFunction(()=>window.getAtlas?.()?.data?.id==='palisades');
 const target=()=>page.evaluate(()=>window.getAtlas().controls.target.toArray());const before=await target();await page.mouse.move(620,430);await page.mouse.down();await page.mouse.move(800,450,{steps:20});await page.mouse.up();await page.waitForTimeout(300);assert.notDeepEqual(await target(),before);
 await page.locator('#atlas-tab').click();await page.locator('[data-pass="epic"]').click();assert.equal(new URL(page.url()).hash,'#palisades');assert.equal(await page.locator('#mountain-heading').textContent(),'Palisades Tahoe');
 await page.keyboard.press('Escape');assert.equal(await page.locator('#field-guide').isHidden(),true);assert.equal(await page.locator('#atlas-tab').evaluate(e=>e===document.activeElement),true);
 await page.locator('#weather-drawer').click();assert(await page.locator('#weather-timeline').isVisible());await page.keyboard.press('Escape');assert(await page.locator('#weather-timeline').isHidden());
 await page.locator('#motion-toggle').click();const paused=await page.evaluate(()=>window.getAtlas().elapsed);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>window.getAtlas().elapsed),paused);
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#motion-toggle').click();assert.equal(await page.evaluate(()=>window.getAtlas().reducedMotion),true);assert.equal(await page.evaluate(()=>window.getAtlas().motionOverride),true);
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>!window.getAtlas().reducedMotion);await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>window.getAtlas().reducedMotion);assert.equal(await page.evaluate(()=>window.getAtlas().motionOverride),false);
 await page.locator('#zoom-in').click();await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.getAtlas().targetCamera===null),true);
 await page.route('**/geodata/vail-cover.png',async r=>{await new Promise(resolve=>setTimeout(resolve,500));await r.continue();});
 await page.evaluate(()=>location.hash='vail');await page.waitForTimeout(100);await page.evaluate(()=>location.hash='mammoth');await page.waitForFunction(()=>window.getAtlas()?.data?.id==='mammoth');await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>window.getAtlas().data.id),'mammoth');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>!window.getAtlas().reducedMotion);
 await page.evaluate(()=>{const a=window.getAtlas();const lift=a.routes.find(r=>r.feature.kind==='lift'&&!r.feature.retired&&!r.feature.proposed);a.focusFeature(lift.feature.id);});await page.locator('#follow-route').click();await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>!!window.getAtlas().journey),true);
 await page.mouse.move(700,350);await page.mouse.down();await page.mouse.move(750,390,{steps:10});await page.mouse.up();assert.equal(await page.evaluate(()=>!!window.getAtlas().journey),false);
 await page.locator('[data-layer="lifts"]').click();assert.equal(await page.evaluate(()=>window.getAtlas().liftGroup.visible),false);await page.locator('[data-layer="lifts"]').click();
 await page.locator('#close-route').click();await page.waitForTimeout(1000);
 await page.screenshot({path:'/tmp/schema-desktop.png'});
 await page.evaluate(()=>location.hash='%ZZ');await page.waitForTimeout(100);assert(await page.locator('#mountain-gallery').isVisible());
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto('http://localhost:5173/#palisades');await mobile.waitForFunction(()=>document.querySelector('#scene[aria-busy="false"]'));await mobile.screenshot({path:'/tmp/schema-mobile.png'});assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert(await mobile.locator('#pan-mode').isVisible());
 assert.deepEqual(errors,[]);console.log('Passed: naming, pan, filters, drawers, focus, pause, reduced motion, rapid navigation, invalid hash, mobile layout.');
}finally{await browser.close();}
