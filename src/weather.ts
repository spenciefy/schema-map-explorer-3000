import type { Resort } from './data';
export interface Forecast { time:number[]; temp:number[]; snow:number[]; wind:number[]; cloud:number[]; timezone:string; loadedAt:number; }
const cache = new Map<string, Forecast>();
export async function loadForecasts(resorts:Resort[]):Promise<Map<string,Forecast>> {
  if(resorts.every(r=>cache.has(r.id)&&Date.now()-cache.get(r.id)!.loadedAt<15*60*1000))return cache;
  const params=new URLSearchParams({latitude:resorts.map(r=>r.lat).join(','),longitude:resorts.map(r=>r.lon).join(','),elevation:resorts.map(r=>r.elevation).join(','),hourly:'temperature_2m,snowfall,wind_speed_10m,cloud_cover',forecast_hours:'73',timezone:'auto',timeformat:'unixtime'});
  const response=await fetch(`https://api.open-meteo.com/v1/forecast?${params}`,{signal:AbortSignal.timeout(16000)});
  if(!response.ok)throw new Error(`Weather service returned ${response.status}`);
  const body=await response.json();const results=Array.isArray(body)?body:[body];
  if(results.length!==resorts.length)throw new Error('Incomplete regional forecast');
  results.forEach((data,i)=>{const h=data.hourly;if(!h?.time?.length||!['temperature_2m','snowfall','wind_speed_10m','cloud_cover'].every(k=>Array.isArray(h[k])&&h[k].length===h.time.length&&h[k].every((v:unknown)=>typeof v==='number'&&Number.isFinite(v))))throw new Error('Incomplete weather data');cache.set(resorts[i].id,{time:h.time,temp:h.temperature_2m,snow:h.snowfall,wind:h.wind_speed_10m,cloud:h.cloud_cover,timezone:data.timezone,loadedAt:Date.now()});});
  return cache;
}
export function snowTotal(f:Forecast){return Math.round(f.snow.slice(0,72).reduce((a,b)=>a+b,0));}
