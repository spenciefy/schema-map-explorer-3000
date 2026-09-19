export interface RiderSettings { skiers:boolean; snowboarders:boolean; skierSize:number; snowboarderSize:number; skierSpeed:number; snowboarderSpeed:number; }
export const defaultRiderSettings:RiderSettings={skiers:true,snowboarders:true,skierSize:1,snowboarderSize:1,skierSpeed:1,snowboarderSpeed:1};
export function normalizeRiderSettings(value:unknown):RiderSettings {
 const source=value&&typeof value==='object'?value as Record<string,unknown>:{};
 const number=(key:keyof RiderSettings,min:number,max:number)=>typeof source[key]==='number'&&Number.isFinite(source[key])?Math.min(max,Math.max(min,source[key] as number)):defaultRiderSettings[key] as number;
 return {skiers:typeof source.skiers==='boolean'?source.skiers:true,snowboarders:typeof source.snowboarders==='boolean'?source.snowboarders:true,skierSize:number('skierSize',.5,2),snowboarderSize:number('snowboarderSize',.5,2),skierSpeed:number('skierSpeed',0,3),snowboarderSpeed:number('snowboarderSpeed',0,3)};
}
