// Compose share cards from the app's real terrain renders, without invented geography.
import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resorts} from '../src/data.ts';
const root=new URL('../public/',import.meta.url);
const out=new URL('social/',root);await mkdir(out,{recursive:true});
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const mark='<path d="M9 47 27 15 39 35 47 23 60 47Z" fill="#f5f3eb"/><path d="m27 15 12 20-11-5-8 8Z" fill="#90aaa1"/><path d="m39 35 8-12 13 24H44Z" fill="#bd5b3b"/>';
const favicon=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 68"><rect width="68" height="68" rx="15" fill="#263e35"/>${mark}</svg>`;
await writeFile(new URL('favicon.svg',root),favicon);
for(const [file,size]of [['favicon-32.png',32],['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512]])await sharp(Buffer.from(favicon)).resize(size,size).png().toFile(new URL(file,root).pathname);
const png=await sharp(Buffer.from(favicon)).resize(32,32).png().toBuffer();
const ico=Buffer.alloc(22);ico.writeUInt16LE(1,2);ico.writeUInt16LE(1,4);ico[6]=32;ico[7]=32;ico.writeUInt16LE(1,10);ico.writeUInt16LE(32,12);ico.writeUInt32LE(png.length,14);ico.writeUInt32LE(22,18);
await writeFile(new URL('favicon.ico',root),Buffer.concat([ico,png]));
const image=async(id,x,y,w,h)=>`<image href="data:image/png;base64,${(await readFile(new URL(`previews/${id}.png`,root))).toString('base64')}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
const shell=body=>`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f5f3eb"/>${body}</svg>`;
const text=(x,y,size,body,weight=400,color='#263e35')=>`<text x="${x}" y="${y}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}" letter-spacing="${size>45?-2:0}">${escape(body)}</text>`;
const brand=`<g transform="translate(55 45) scale(.65)"><rect width="68" height="68" rx="15" fill="#263e35"/>${mark}</g>${text(112,78,32,'topo.ski',700)}`;
const credit=text(56,604,12,'Terrain: Mapzen · Map data © OpenStreetMap contributors',400,'#78877d');
const gridIds=['palisades','jackson','whistler','niseko','breckenridge','zermatt'];
const grid=await Promise.all(gridIds.map((id,i)=>image(id,20+(i%3)*400,30+Math.floor(i/3)*285,380,275)));
const home=shell(grid.join(''));
await sharp(Buffer.from(home)).jpeg({quality:92,mozjpeg:true}).toFile(new URL('home.jpg',out).pathname);
for(const r of resorts){
 const words=r.name.split(' ');const lines=[];let line='';for(const word of words){if((line+' '+word).trim().length>18&&line){lines.push(line);line=word;}else line=(line+' '+word).trim();}lines.push(line);
 const svg=shell(`${await image(r.id,390,70,830,599)}${brand}${text(57,191,20,r.area.toUpperCase(),400,'#62766a')}${lines.map((l,i)=>text(54,268+i*67,62,l,700)).join('')}${credit}`);
 await sharp(Buffer.from(svg)).jpeg({quality:90,mozjpeg:true}).toFile(new URL(`${r.id}.jpg`,out).pathname);
}
console.log(`Generated favicon family and ${resorts.length+1} share cards.`);
