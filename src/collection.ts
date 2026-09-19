import { resorts, type Resort } from './data';
import { MountainGlobe, TerrainPreview } from './collection-3d';
export function setupCollection(navigate:(path:string)=>void){
 const grid=document.querySelector<HTMLElement>('.mountain-grid')!,world=document.querySelector<HTMLElement>('#globe-view')!,about=document.querySelector<HTMLElement>('#about-page')!,toolbar=document.querySelector<HTMLElement>('.collection-tools')!;
 const search=document.querySelector<HTMLInputElement>('#mountain-search')!,results=document.querySelector<HTMLElement>('#globe-results')!,empty=document.querySelector<HTMLElement>('#collection-empty')!,card=document.querySelector<HTMLElement>('#globe-card')!;
 let mode='grid',isAbout=false,isGallery=true,globe:MountainGlobe|undefined;const previews=new TerrainPreview(grid);
 const regionBar=document.createElement('div');regionBar.className='globe-regions';for(const [label,lat,lon,distance] of [['World',38,-110,3.4],['North America',43,-113,1.8],['Alps',46,9,1.3],['Japan',39,139,1.5]] as const){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{globe?.region(lat,lon,distance);card.hidden=true;};regionBar.append(b);}world.prepend(regionBar);
 const tiles=[...grid.querySelectorAll<HTMLAnchorElement>('.mountain-tile')];
 const showResort=(r:Resort)=>{card.hidden=false;card.replaceChildren();const a=document.createElement('a');a.href='/'+r.id;const img=document.createElement('img');img.src='/previews/'+r.id+'.png';img.alt='';const name=document.createElement('strong');name.textContent=r.name;const area=document.createElement('span');area.textContent=r.area;a.append(img,name,area);a.onclick=e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();navigate(a.pathname);};card.append(a);addClose();};
 const addClose=()=>{const close=document.createElement('button');close.className='globe-card-close';close.textContent='×';close.setAttribute('aria-label','Close mountain selection');close.onclick=()=>card.hidden=true;card.prepend(close);};
 const showGroup=(members:Resort[])=>{card.hidden=false;card.replaceChildren();const title=document.createElement('strong');title.textContent=members.length+' mountains';card.append(title);for(const r of members){const button=document.createElement('button');button.className='globe-group-resort';button.textContent=r.name;button.onclick=()=>globe?.focus(r);card.append(button);}addClose();};
 function update(){
  const query=search.value.trim().toLocaleLowerCase(),matches=resorts.filter(r=>`${r.name} ${r.area} ${r.country} ${r.pass}`.toLocaleLowerCase().includes(query)),ids=new Set(matches.map(r=>r.id));
  tiles.forEach(tile=>{tile.hidden=!ids.has(tile.pathname.slice(1));});
  grid.hidden=isAbout||mode!=='grid';world.hidden=isAbout||mode!=='globe';about.hidden=!isAbout;toolbar.hidden=isAbout;empty.hidden=isAbout||matches.length>0;empty.textContent='No mountains found.';
  document.querySelector<HTMLElement>('#collection-status')!.hidden=isAbout;
  document.querySelector('#collection-status')!.textContent=matches.length+(matches.length===1?' mountain':' mountains');
  document.querySelectorAll<HTMLButtonElement>('[data-collection-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.collectionView===mode)));
  if(mode==='globe'&&!isAbout&&isGallery){if(!globe){try{globe=new MountainGlobe(document.querySelector('#globe-canvas')!,showResort,showGroup);}catch{document.querySelector('#globe-canvas')!.textContent='3D globe unavailable. Choose a mountain below.';}}globe?.filter(ids);}
  globe?.setVisible(mode==='globe'&&!isAbout&&isGallery);results.replaceChildren();
  for(const r of matches){const button=document.createElement('button');button.textContent=r.name;button.onclick=()=>{globe?.focus(r);showResort(r);};results.append(button);}
  card.hidden=true;if(mode==='globe'&&!isAbout&&isGallery&&matches.length===1)globe?.focus(matches[0]);
 }
 search.addEventListener('input',()=>{previews.hide();update();});
 document.querySelectorAll<HTMLButtonElement>('[data-collection-view]').forEach(b=>b.onclick=()=>{mode=b.dataset.collectionView!;previews.hide();update();});
 document.querySelector('#collection-about')!.addEventListener('click',e=>{const event=e as MouseEvent;if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;e.preventDefault();navigate('/about');});
 document.querySelector('#collection-home')!.addEventListener('click',e=>{const event=e as MouseEvent;if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;e.preventDefault();navigate('/');});
 return {setRoute(aboutRoute:boolean,gallery:boolean){isAbout=aboutRoute;isGallery=gallery;if(!gallery)previews.hide();update();}};
}
