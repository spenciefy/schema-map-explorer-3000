import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/\/src\/main.ts(?:\?.*)?$/,async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+'\nwindow.getAtlas=()=>atlas;'});});
 await page.goto('http://localhost:5173/#palisades');
 for(const id of ['palisades','whistler','breckenridge','verbier','niseko','hakuba','alyeska']){
  await page.evaluate(id=>location.hash=id,id);await page.waitForFunction(id=>window.getAtlas?.()?.data?.id===id&&window.getAtlas()?.world.visible,id);await page.waitForTimeout(150);
  const result=await page.evaluate(()=>{const a=window.getAtlas();return {profile:a.ecology.id,forms:a.geometryGroup.children.filter(o=>o.userData.treeForm).map(o=>o.userData.treeForm),animals:a.wildlife.count,finite:Array.from(a.wildlife.instanceMatrix.array).every(Number.isFinite)};});assert(result.forms.length>=2);assert(result.animals>0);assert(result.finite);console.log(id,result);
  if(id==='niseko'){await page.locator('#settings-toggle').click();await page.locator('#wildlife-visible').uncheck();await page.waitForFunction(()=>!window.getAtlas().wildlife.visible);await page.screenshot({path:'/tmp/niseko-ecology.png'});await page.locator('#close-settings').click();}
 }
 await page.reload();await page.waitForFunction(()=>window.getAtlas?.()?.wildlife);assert.equal(await page.evaluate(()=>window.getAtlas().showWildlife),false);assert.deepEqual(errors,[]);
 console.log('Regional ecology, geometry, wildlife placement and saved visibility passed.');
}finally{await browser.close();}
