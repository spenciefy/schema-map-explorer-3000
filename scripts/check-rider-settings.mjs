import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/\/src\/main.ts(?:\?.*)?$/,async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+'\nwindow.getAtlas=()=>atlas;'});});
 await page.goto('http://localhost:5173/#palisades');await page.waitForFunction(()=>window.getAtlas?.()?.data?.id==='palisades');await page.locator('#settings-toggle').click();
 await page.locator('#skier-visible').uncheck();await page.waitForFunction(()=>!window.getAtlas().skiers.visible);assert(await page.locator('#skier-speed').isDisabled());assert(await page.evaluate(()=>window.getAtlas().boarders.visible));await page.locator('#skier-visible').check();
 const set=async(id,value)=>page.locator(id).evaluate((e,value)=>{e.value=String(value);e.dispatchEvent(new Event('input',{bubbles:true}));},value);
 await set('#skier-speed',0);await set('#snowboarder-speed',2);await set('#skier-size',.5);await set('#snowboarder-size',2);
 const snapshot=()=>page.evaluate(()=>window.getAtlas().actors.slice(0,6).map(a=>({board:a.board,progress:a.progress,time:a.motionTime})));
 const before=await snapshot();await page.waitForTimeout(400);const after=await snapshot();before.forEach((a,i)=>{if(!a.board)assert.deepEqual(after[i],a);else assert.notEqual(after[i].progress,a.progress);});
 await page.screenshot({path:'/tmp/rider-settings-desktop.png'});await page.reload();await page.waitForFunction(()=>window.getAtlas?.()?.data?.id==='palisades');assert.equal(await page.evaluate(()=>window.getAtlas().riderSettings.skierSpeed),0);assert.equal(await page.evaluate(()=>window.getAtlas().riderSettings.snowboarderSize),2);
 await page.locator('#settings-toggle').click();await page.locator('#reset-rider-settings').click();assert.equal(await page.locator('#skier-size').inputValue(),'1');assert.equal(await page.evaluate(()=>window.getAtlas().riderSettings.skierSpeed),1);await page.keyboard.press('Escape');assert(await page.locator('#rider-settings').isHidden());assert(await page.locator('#settings-toggle').evaluate(e=>e===document.activeElement));
 await page.evaluate(()=>location.hash='alta');await page.waitForFunction(()=>window.getAtlas()?.data?.id==='alta');await page.locator('#settings-toggle').click();assert(await page.locator('#snowboarder-visible').isDisabled());assert.equal(await page.evaluate(()=>window.getAtlas().actors.some(a=>a.board)),false);
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto('http://localhost:5173/#palisades');await mobile.waitForFunction(()=>document.querySelector('#scene[aria-busy="false"]'));await mobile.locator('#settings-toggle').click();await mobile.waitForTimeout(300);await mobile.screenshot({path:'/tmp/rider-settings-mobile.png'});assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await mobile.locator('#snowboarder-visible').uncheck();await mobile.locator('#close-settings').click();assert(await mobile.locator('#pan-mode').isVisible());
 assert.deepEqual(errors,[]);console.log('Rider settings passed: visibility, independent speeds, freeze, sizing, persistence, reset, Escape/focus, skiers-only resorts, mobile controls.');
}finally{await browser.close();}
