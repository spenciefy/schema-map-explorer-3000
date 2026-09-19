import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import sharp from 'sharp';
import {resorts} from '../src/data.ts';
import {socialMetadata} from '../src/social.ts';
test('mountain and alias previews resolve to the canonical resort and real image',async()=>{
 for(const r of resorts){
  const m=socialMetadata('/'+r.id);
  assert(m.title.includes(r.name));assert(m.url.endsWith('/'+r.id));
  const image=new URL('../public'+new URL(m.image).pathname,import.meta.url);
  assert(existsSync(image));const meta=await sharp(image.pathname).metadata();
  assert.equal(meta.width,1200);assert.equal(meta.height,630);assert.equal(meta.format,'jpeg');
 }
 assert.deepEqual(socialMetadata('/iwawai'),socialMetadata('/iwanai'));
 assert.equal(socialMetadata('/').image,socialMetadata('/about').image);
});
test('favicon fallback and touch icons have declared dimensions',async()=>{
 for(const[file,size]of [['favicon-32.png',32],['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512]]){
  const meta=await sharp(new URL('../public/'+file,import.meta.url).pathname).metadata();assert.equal(meta.width,size);assert.equal(meta.height,size);
 }
 const ico=readFileSync(new URL('../public/favicon.ico',import.meta.url));assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt32LE(18),22);
});
