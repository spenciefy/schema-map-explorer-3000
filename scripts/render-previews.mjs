import {chromium} from '@playwright/test';
import {mkdir,readFile} from 'node:fs/promises';
const western=process.argv.includes('--western')?JSON.parse(await readFile(new URL('../research/western-resorts.json',import.meta.url),'utf8')):null;
const requested=process.argv.slice(2).filter(arg=>arg!=='--western');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1000,height:800},deviceScaleFactor:1});
 await page.route('http://localhost:5173/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
 await page.goto('http://localhost:5173/');
 const ids=await page.evaluate(async western=>{
  document.body.innerHTML='<div id="preview" style="width:720px;height:520px"></div><div id="labels" hidden></div>';document.body.style.cssText='margin:0;background:#f5f3eb';
  const {AtlasScene}=await import('/src/scene.ts');const {resorts}=await import('/src/data.ts');
  const {mapReferences}=await import('/src/geography.ts');if(western)for(const r of western)mapReferences[r.id]={url:r.mapUrl,coverage:r.name,view:r.view};
  window.previewAtlas=new AtlasScene(document.querySelector('#preview'),document.querySelector('#labels'),()=>{});window.previewResorts=western||resorts;
  window.previewAtlas.showLabels=false;window.previewAtlas.showPlaces=false;window.previewAtlas.showSnow=false;window.previewAtlas.paused=true;
  return window.previewResorts.map(r=>r.id);
 },western);
 await mkdir('public/previews',{recursive:true});
 for(const id of ids.filter(id=>!requested.length||requested.includes(id))){
  await page.evaluate(async id=>{const a=window.previewAtlas;a.selected=id;await a.load(window.previewResorts.find(r=>r.id===id));const direction=a.camera.position.clone().sub(a.controls.target).normalize();a.controls.target.set(0,(a.maxElevation-a.minElevation)*a.scale*.3,0);a.camera.position.copy(a.controls.target).addScaledVector(direction,430);a.controls.update();a.renderer.render(a.scene,a.camera);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},id);
  await page.locator('#preview canvas').screenshot({path:`public/previews/${id}.png`,omitBackground:true});console.log(id);
 }
}finally{await browser.close();}
