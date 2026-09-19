import { resorts, type Resort } from './data';
import { MountainGlobe, TerrainPreview } from './collection-3d';
export function setupCollection(navigate:(path:string)=>void){
 const grid=document.querySelector<HTMLElement>('.mountain-grid')!,world=document.querySelector<HTMLElement>('#globe-view')!,about=document.querySelector<HTMLElement>('#about-page')!,toolbar=document.querySelector<HTMLElement>('.collection-tools')!;
 const search=document.querySelector<HTMLInputElement>('#mountain-search')!,results=document.querySelector<HTMLElement>('#globe-results')!,empty=document.querySelector<HTMLElement>('#collection-empty')!,card=document.querySelector<HTMLElement>('#globe-card')!;
 let mode='grid',isAbout=false,isGallery=true,globe:MountainGlobe|undefined;const previews=new TerrainPreview(grid);
 const tiles=[...grid.querySelectorAll<HTMLAnchorElement>('.mountain-tile')];
 const showResort=(r:Resort)=>{card.hidden=false;card.replaceChildren();const a=document.createElement('a');a.href='/'+r.id;const img=document.createElement('img');img.src='/previews/'+r.id+'.png';img.alt='';const name=document.createElement('strong');name.textContent=r.name;const area=document.createElement('span');area.textContent=r.area;a.append(img,name,area);a.onclick=e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();navigate(a.pathname);};card.append(a);};
 function update(){
  const query=search.value.trim().toLocaleLowerCase(),matches=resorts.filter(r=>`${r.name} ${r.area} ${r.country} ${r.pass}`.toLocaleLowerCase().includes(query)),ids=new Set(matches.map(r=>r.id));
  tiles.forEach(tile=>{tile.hidden=!ids.has(tile.pathname.slice(1));});
  grid.hidden=isAbout||mode!=='grid';world.hidden=isAbout||mode!=='globe';about.hidden=!isAbout;toolbar.hidden=isAbout;empty.hidden=isAbout||matches.length>0;empty.textContent='No mountains found.';
  document.querySelector<HTMLElement>('#collection-status')!.hidden=isAbout;
  document.querySelector('#collection-status')!.textContent=matches.length+(matches.length===1?' mountain':' mountains');
  document.querySelectorAll<HTMLButtonElement>('[data-collection-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.collectionView===mode)));
  if(mode==='globe'&&!isAbout&&isGallery){if(!globe){try{globe=new MountainGlobe(document.querySelector('#globe-canvas')!,showResort);}catch{document.querySelector('#globe-canvas')!.textContent='3D globe unavailable. Choose a mountain below.';}}globe?.filter(ids);}
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
