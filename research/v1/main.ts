import './style.css';
import { AtlasScene } from './scene';
import { resorts, regions, demoWeather, type Region, type Pass, type Resort } from './data';
import { loadForecasts, snowTotal, type Forecast } from './weather';
const icons:Record<string,string>={
 mountain:'<path d="m2 19 7-13 5 8 3-5 5 10H2Z"/><path d="m6 12 3 2 3-2"/>',
 arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
 snow:'<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 3 3-3M9 20l3-3 3 3M3 10l4-1-1-4M18 19l-1-4 4-1M3 14l4 1-1 4M18 5l-1 4 4 1"/>',
 wind:'<path d="M3 8h12a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M5 17h5a2 2 0 1 1-2 2"/>',
 bookmark:'<path d="M6 3h12v18l-6-4-6 4V3Z"/>',
 compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',
 sound:'<path d="m11 4-5 4H2v8h4l5 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
 muted:'<path d="m11 4-5 4H2v8h4l5 4V4Zm5 5 6 6m0-6-6 6"/>',
 play:'<path d="m8 4 12 8-12 8V4Z"/>',pause:'<path d="M8 4v16M16 4v16"/>',
 globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
 cloud:'<path d="M7 18a5 5 0 1 1 1-10 6 6 0 0 1 11 3 3.5 3.5 0 0 1 0 7H7Z"/>',
 reset:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
};
function icon(name:string,cls=''){return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.mountain}</svg>`;}
let region:Region='north-america',pass:Pass='all',selected='powder',live=false,hour=17,playing=false,weatherLoading=false,weatherError=false;
let forecasts=new Map<string,Forecast>(),requestId=0;
let saved:Set<string>;try{saved=new Set(JSON.parse(localStorage.getItem('chasing-winter:saved')||'[]'));}catch{saved=new Set();}
let view:'atlas'|'saved'='atlas';
const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`
  <div id="scene"></div><div class="atmosphere"></div><div id="map-labels"></div>
  <header class="topbar">
    <button class="brand" id="brand-home" aria-label="Return to atlas overview">${icon('mountain')}<span>CHASING WINTER<span class="brand-sub">A MOUNTAIN ATLAS</span></span></button>
    <nav class="main-nav" aria-label="Main navigation"><button class="nav-item active" id="atlas-tab">The atlas</button><button class="nav-item" id="saved-tab">My mountains <span id="saved-count">0</span></button></nav>
    <button class="weather-switch" id="weather-switch" aria-pressed="false"><span class="status-dot"></span><span id="mode-name">Winter demo</span><span class="switch-track"><span></span></span></button>
  </header>
  <main>
    <section class="intro"><div class="eyebrow"><span class="tiny-line"></span>FOLLOW THE FEELING</div><h1>Somewhere,<br>it’s snowing.</h1><p>A little atlas for a big love of winter. <br>Find a mountain. Follow the snow.</p>
      <button class="chase-button" id="chase">${icon('snow')}<span>Find my next mountain</span>${icon('arrow')}</button>
    </section>
    <button id="back-to-atlas" class="back-to-atlas">${icon('arrow')}Back to the atlas</button><div class="map-context"><span id="region-subtitle">THE GREAT WEST</span><span id="coordinates">40°–51° N / 110°–123° W</span></div>
    <aside class="mountain-panel" aria-label="Mountain details">
      <div class="panel-topline"><span class="eyebrow">YOUR NEXT ALPINE DAYDREAM</span><span id="resort-index">05 / 06</span></div>
      <div id="resort-detail"></div>
      <div class="nearby-heading"><span id="list-title">EXPLORE THE REGION</span><span id="visible-count"></span></div>
      <div class="pass-filters" role="group" aria-label="Filter mountains by pass"><button data-pass="all" class="active" aria-pressed="true">All mountains</button><button data-pass="ikon" aria-pressed="false">Ikon</button><button data-pass="epic" aria-pressed="false">Epic</button></div>
      <div id="resort-list" class="resort-list"></div>
      <div id="source-note" class="source-note"></div>
    </aside>
    <div class="map-tools" aria-label="Map controls"><button id="reset-view" title="Reset view" aria-label="Reset map view">${icon('compass')}</button><div class="zoom-tools"><button id="zoom-in" aria-label="Zoom in">${icon('plus')}</button><button id="zoom-out" aria-label="Zoom out">${icon('minus')}</button></div><button id="motion-toggle" aria-label="Pause mountain animation" title="Pause mountain animation">${icon('pause')}</button><button id="sound-toggle" aria-label="Enable mountain ambience" aria-pressed="false" title="Mountain ambience">${icon('muted')}</button></div>
    <div class="compass-rose" aria-hidden="true"><span>N</span><svg viewBox="0 0 64 64"><path d="M32 9 37 32 32 55 27 32Z" fill="none" stroke="currentColor"/><path d="m9 32 23-5 23 5-23 5Z" fill="none" stroke="currentColor"/><path d="m32 9 5 23h-5Z" fill="currentColor"/></svg></div>
    <div class="map-caption"><span class="caption-dot"></span><span>Little lifts. Long weekends. Endless possibilities.</span></div>
    <section class="bottom-deck" aria-label="Region and forecast timeline">
      <div class="region-picker"><span class="eyebrow">PICK YOUR HORIZON</span><div role="group" aria-label="Choose region"><button data-region="north-america" class="active" aria-pressed="true">North America</button><button data-region="alps" aria-pressed="false">The Alps</button><button data-region="japan" aria-pressed="false">Japan</button></div></div>
      <div class="timeline"><div class="timeline-heading"><span>${icon('snow')}<span id="timeline-title">A WINTER WEEKEND</span></span><output id="time-label" for="time-slider">Saturday, 9 am</output></div><div class="timeline-controls"><button id="timeline-play" aria-label="Play weekend forecast">${icon('play')}</button><div class="slider-wrap"><input id="time-slider" type="range" min="0" max="48" step="1" value="17" aria-label="Explore forecast time"/><div class="time-ticks"><span id="tick-start">FRI · 4 PM</span><span id="tick-mid">SATURDAY</span><span id="tick-end">SUN · 4 PM</span></div></div></div></div>
    </section>
  </main>
  <footer><span>AN ATLAS FOR THE WANDERERS <span class="footer-star">✳</span></span><span class="interaction-hint">Drag to explore <span>·</span> Scroll to get closer</span><button id="about-button">Illustrated terrain & data notes ${icon('plus')}</button></footer>
  <div id="toast" role="status" aria-live="polite"></div>
  <dialog id="about-dialog"><button id="close-about" aria-label="Close data notes">${icon('close')}</button><div class="eyebrow">A NOTE FROM THE ATLAS</div><h2>A world to wander.</h2><p>Chasing Winter is an interactive sketch of the places we dream of skiing. Terrain, trails, lifts, and skiers are artistic miniatures, not geographic or operating maps.</p><p><strong>Winter demo</strong> is an imagined snowy weekend. Switch to <strong>Live forecast</strong> to load current modeled weather from <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> at each resort’s listed elevation. Snow totals cover the first 72 forecast hours, including the current hour. They are forecasts, not resort snowfall observations. The snow-covered terrain stays illustrative.</p><p>Pass filters indicate destination partnerships, not guaranteed access. Days, reservations, and restrictions depend on your pass and season. Check <a href="https://www.ikonpass.com/en/destinations" target="_blank" rel="noopener">Ikon</a> or <a href="https://www.epicpass.com/regions.aspx" target="_blank" rel="noopener">Epic</a> before planning.</p><p class="small-note">Inspired by a love of mountain weekends, sculptural snow art, and the joy of following a storm.</p></dialog>`;
const $=<T extends HTMLElement=HTMLElement>(s:string)=>document.querySelector<T>(s)!;
let atlas:AtlasScene | undefined;
try{atlas=new AtlasScene($('#scene'),$('#map-labels'),id=>selectResort(id,true));}catch{ $('#scene').innerHTML='<div class="canvas-error">Your browser couldn’t start the 3D map. Try a browser with WebGL enabled. You can still explore mountains using the list.</div>'; }
function currentRegion(){return resorts.filter(r=>r.region===region);}
function visibleResorts(){return currentRegion().filter(r=>(pass==='all'||r.pass===pass)&&(view!=='saved'||saved.has(r.id)));}
function getResort(){return resorts.find(r=>r.id===selected)!;}
function total(r:Resort){if(!live)return r.snow;const f=forecasts.get(r.id);return f&&!weatherLoading&&!weatherError?snowTotal(f):null;}
function formatTotal(r:Resort){const n=total(r);return n===null?'—':`${n}`;}
function conditions(r:Resort){if(!live)return demoWeather(r,16+hour);const f=forecasts.get(r.id);if(!f||weatherError||weatherLoading)return null;const i=Math.min(hour,f.time.length-1);return {snow:snowTotal(f),temp:Math.round(f.temp[i]),wind:Math.round(f.wind[i]),cloud:f.cloud[i],snowfall:f.snow[i]};}
function renderDetail(){
 const r=getResort(),c=conditions(r),isSaved=saved.has(r.id),wx=!c?'cloud':c.snowfall>.2?'snow':c.cloud>55?'cloud':'sun';
 $('#resort-index').textContent=`${String(currentRegion().findIndex(x=>x.id===r.id)+1).padStart(2,'0')} / ${String(currentRegion().length).padStart(2,'0')}`;
 $('#resort-detail').innerHTML=`<div class="place-label">${r.area.toUpperCase()} <span> / </span> ${r.country.toUpperCase()}</div><div class="resort-title"><h2>${r.name}</h2><button id="save-mountain" class="save-mountain ${isSaved?'saved':''}" aria-label="${isSaved?'Unsave':'Save'} ${r.name}" aria-pressed="${isSaved}">${icon('bookmark')}</button></div><p class="resort-description">${r.description}</p><div class="snow-report"><div class="snow-amount">${formatTotal(r)}<span>cm</span></div><div class="snow-caption">${icon(wx)}<span>${live?'next 72 hours':'over a dream weekend'}<strong>${!c?'Forecast unavailable':c.snowfall>.2?'A little fresh magic':c.cloud>55?'Under a winter sky':'Bluebird state of mind'}</strong></span></div></div><div class="condition-row"><span>${icon('sun')}${c?`${c.temp}°`:'—'}</span><span>${icon('wind')}${c?`${c.wind} km/h`:'—'}</span><span>${r.elevation.toLocaleString()} m <span class="alt-label">forecast elevation</span></span></div><div class="detail-actions"><button id="explore-mountain">Explore mountain ${icon('arrow')}</button><a href="${r.url}" target="_blank" rel="noopener" aria-label="Visit ${r.name} official website">Resort ↗</a></div>`;
 $('#save-mountain').onclick=()=>{if(saved.has(r.id))saved.delete(r.id);else saved.add(r.id);try{localStorage.setItem('chasing-winter:saved',JSON.stringify([...saved]));}catch{}render();notify(saved.has(r.id)?`${r.name} added to your mountains.`:`${r.name} removed from your mountains.`);};
 $('#explore-mountain').onclick=()=>{document.body.classList.add('mountain-focus');renderList();atlas?.select(r.id,true);notify('Take a closer look. Drag to circle the mountain.');};
 $('#source-note').innerHTML=weatherLoading&&live?'<span class="loading-dot"></span> Gathering mountain forecasts…':weatherError&&live?'<span>Forecast unavailable.</span> <button id="retry-weather">Try again ↗</button>':live?`<span class="status-dot live"></span> Modeled forecast · <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a><br>Fetched ${new Date(forecasts.get(r.id)?.loadedAt||Date.now()).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})} · ${r.elevation.toLocaleString()} m`:'<span class="demo-dot"></span> Imagined snow, real places.<br>Switch on live forecasts to see what’s coming.';
 const retry=document.querySelector<HTMLButtonElement>('#retry-weather');if(retry)retry.onclick=fetchWeather;
}
function renderList(){
 const list=visibleResorts();$('#visible-count').textContent=`${list.length} PLACES`;$('#list-title').textContent=view==='saved'?'YOUR SAVED MOUNTAINS':'EXPLORE THE REGION';
 $('#resort-list').innerHTML=list.length?list.map((r,i)=>`<button class="resort-row ${selected===r.id?'active':''}" data-select="${r.id}" aria-pressed="${selected===r.id}"><span class="row-index">${String(i+1).padStart(2,'0')}</span><span class="row-title">${r.name}<span>${r.area} <b class="pass-tag ${r.pass}">${r.pass==='independent'?'IND.':r.pass.toUpperCase()}</b></span></span><span class="row-snow">${formatTotal(r)}<small>cm</small></span>${icon('arrow')}</button>`).join(''):`<div class="empty-state">${view==='saved'?'Keep a mountain in mind. Save a favorite with the bookmark above, or try another region.':'No mountains match this pass in this region.'}</div>`;
 document.querySelectorAll<HTMLButtonElement>('[data-select]').forEach(el=>el.onclick=()=>selectResort(el.dataset.select!,false));
 atlas?.filter(new Set(document.body.classList.contains('mountain-focus')?[selected]:list.map(r=>r.id)));atlas?.markers.forEach(m=>{m.element.querySelector('.marker-snow')!.textContent=`${formatTotal(m.resort)} cm`;m.element.querySelector('.marker-period')!.textContent=live?' / 72 hours':' / demo';});
}
function render(){
 $('#saved-count').textContent=String(saved.size);$('#region-subtitle').textContent=regions[region].subtitle;$('#coordinates').textContent=regions[region].coordinates;
 document.querySelectorAll<HTMLButtonElement>('[data-region]').forEach(el=>{el.classList.toggle('active',el.dataset.region===region);el.setAttribute('aria-pressed',String(el.dataset.region===region));});
 document.querySelectorAll<HTMLButtonElement>('[data-pass]').forEach(el=>{el.classList.toggle('active',el.dataset.pass===pass);el.setAttribute('aria-pressed',String(el.dataset.pass===pass));});
 $('#atlas-tab').classList.toggle('active',view==='atlas');$('#saved-tab').classList.toggle('active',view==='saved');
 renderDetail();renderList();updateTime();atlas?.select(selected);
}
function selectResort(id:string,fly=false){selected=id;if(fly)document.body.classList.add('mountain-focus');atlas?.select(id,fly);renderDetail();renderList();updateTime();$('.mountain-panel').scrollTop=0;}
function setRegion(next:Region){document.body.classList.remove('mountain-focus');region=next;const available=visibleResorts();selected=(available[0]||currentRegion()[0]).id;atlas?.setRegion(currentRegion());if(live)fetchWeather();render();}
let toastTimer:ReturnType<typeof setTimeout>;
function notify(message:string){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3600);}
async function fetchWeather(){const id=++requestId;weatherLoading=true;weatherError=false;render();try{const result=await loadForecasts(currentRegion());if(id!==requestId||!live)return;forecasts=result;}catch(error){if(id!==requestId||!live)return;console.warn('Weather unavailable:',error);weatherError=true;notify('The forecast service is unavailable. You can still explore the winter demo.');}finally{if(id===requestId&&live){weatherLoading=false;render();}}}
function updateTime(){
 const c=conditions(getResort());let displayHour=16+hour,label='';
 if(live){const f=forecasts.get(selected);if(f&&!weatherLoading&&!weatherError){const time=new Date(f.time[Math.min(hour,f.time.length-1)]*1000);label=new Intl.DateTimeFormat('en-US',{weekday:'short',hour:'numeric',timeZone:f.timezone}).format(time);displayHour=Number(new Intl.DateTimeFormat('en-GB',{hour:'2-digit',hourCycle:'h23',timeZone:f.timezone}).format(time));}else label=weatherLoading?'Loading forecast…':'Forecast unavailable';}else{const h=(16+hour)%24;const day=['Friday','Saturday','Sunday'][Math.floor((16+hour)/24)];label=`${day}, ${h%12||12} ${h<12?'am':'pm'}`;}
 $('#time-label').textContent=label+(live?' · local':'');$('#time-slider').setAttribute('aria-valuetext',label);$('#timeline-title').textContent=live?'THE NEXT THREE DAYS':'A WINTER WEEKEND';
 $('#tick-start').textContent=live?'NOW':'FRI · 4 PM';$('#tick-mid').textContent=live?'+ 36 HOURS':'SATURDAY';$('#tick-end').textContent=live?'+ 72 HOURS':'SUN · 4 PM';
 ($('#time-slider') as HTMLInputElement).max=live?'72':'48';($('#time-slider') as HTMLInputElement).value=String(hour);$('#time-slider').style.setProperty('--progress',`${hour/(live?72:48)*100}%`);
 atlas?.setWeather(displayHour,c?.snowfall||0,c?.wind||0,c?.cloud||0);
 document.body.classList.toggle('evening',displayHour%24<7||displayHour%24>18);
}
$('#weather-switch').onclick=()=>{live=!live;hour=live?0:17;weatherError=false;weatherLoading=false;$('#weather-switch').setAttribute('aria-pressed',String(live));$('#mode-name').textContent=live?'Live forecast':'Winter demo';$('#weather-switch').classList.toggle('is-live',live);if(live)fetchWeather();else{requestId++;render();}notify(live?'Current modeled weather at mountain elevation.':'An imagined winter weekend. All snowfall values are demo data.');};
$('#time-slider').oninput=(event)=>{hour=Number((event.target as HTMLInputElement).value);renderDetail();updateTime();};
$('#timeline-play').onclick=()=>{playing=!playing;$('#timeline-play').innerHTML=icon(playing?'pause':'play');$('#timeline-play').setAttribute('aria-label',playing?'Pause forecast timeline':'Play forecast timeline');};
setInterval(()=>{if(playing&&!document.hidden){hour=(hour+1)%(live?73:49);renderDetail();updateTime();}},1100);
function goHome(){document.body.classList.remove('mountain-focus');atlas?.home();renderList();}$('#reset-view').onclick=goHome;$('#brand-home').onclick=goHome;$('#back-to-atlas').onclick=goHome;$('#zoom-in').onclick=()=>atlas?.zoom(.8);$('#zoom-out').onclick=()=>atlas?.zoom(1.25);
$('#motion-toggle').onclick=()=>{if(!atlas)return;const wasPaused=atlas.paused||atlas.reducedMotion;atlas.reducedMotion=false;atlas.paused=!wasPaused;$('#motion-toggle').innerHTML=icon(atlas.paused?'play':'pause');$('#motion-toggle').setAttribute('aria-label',atlas.paused?'Resume mountain animation':'Pause mountain animation');};
$('#chase').onclick=()=>{if(live&&(weatherLoading||weatherError)){notify('Wait for available forecasts, or switch to winter demo.');return;}const choices=visibleResorts().filter(r=>total(r)!==null).sort((a,b)=>(total(b)||0)-(total(a)||0));if(!choices.length){notify('Choose another region or save a mountain to start exploring.');return;}selectResort(choices[0].id,true);notify(`${choices[0].name} has the most ${live?'forecast':'demo'} snow in this view: ${formatTotal(choices[0])} cm.`);};
for(const el of document.querySelectorAll<HTMLButtonElement>('[data-region]'))el.onclick=()=>setRegion(el.dataset.region as Region);
for(const el of document.querySelectorAll<HTMLButtonElement>('[data-pass]'))el.onclick=()=>{pass=el.dataset.pass as Pass;const list=visibleResorts();if(list.length&&!list.some(r=>r.id===selected))selected=list[0].id;render();};
$('#atlas-tab').onclick=()=>{view='atlas';render();};$('#saved-tab').onclick=()=>{view='saved';const list=visibleResorts();if(list.length)selected=list[0].id;render();};
const dialog=$<HTMLDialogElement>('#about-dialog');$('#about-button').onclick=()=>dialog.showModal();$('#close-about').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
let audio:AudioContext|undefined,audioGain:GainNode|undefined,audioEnabled=false;
$('#sound-toggle').onclick=async()=>{try{if(!audio){audio=new AudioContext();const buffer=audio.createBuffer(1,audio.sampleRate*4,audio.sampleRate);const data=buffer.getChannelData(0);let last=0;for(let i=0;i<data.length;i++){last=(last+Math.random()*.04-.02)/1.02;data[i]=last*3;}const source=audio.createBufferSource();source.buffer=buffer;source.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=450;audioGain=audio.createGain();audioGain.gain.value=0;source.connect(filter);filter.connect(audioGain);audioGain.connect(audio.destination);source.start();}await audio.resume();audioEnabled=!audioEnabled;audioGain!.gain.setTargetAtTime(audioEnabled?.16:0,audio.currentTime,.6);$('#sound-toggle').innerHTML=icon(audioEnabled?'sound':'muted');$('#sound-toggle').setAttribute('aria-pressed',String(audioEnabled));$('#sound-toggle').setAttribute('aria-label',audioEnabled?'Mute mountain ambience':'Enable mountain ambience');}catch{notify('Audio is unavailable in this browser.');}};
atlas?.setRegion(currentRegion());render();
if(atlas?.reducedMotion){$('#motion-toggle').innerHTML=icon('play');$('#motion-toggle').setAttribute('aria-label','Resume mountain animation');}
