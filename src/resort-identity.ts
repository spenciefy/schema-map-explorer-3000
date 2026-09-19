import logoSources from '../public/resort-logos/sources.json' with { type: 'json' };
export interface LiftPalette { structure:number; station:number; roof:number; sign:number; lettering:number; carrier:number; glazing:number; }
// User-requested blue is a fallback, not a verified paint survey of every lift.
export const defaultLiftPalette:LiftPalette={structure:0x344651,station:0x37658b,roof:0x254a70,sign:0x254a70,lettering:0xfffaf0,carrier:0x37658b,glazing:0x29414e};
export const resortPalettes:Record<string,Partial<LiftPalette>>={
 // Black/red resort treatment requested by Spencer; Big Red reference in source notes.
 jackson:{structure:0x202326,station:0x27292b,roof:0xb8292d,sign:0x202326,carrier:0xb8292d,glazing:0x1f292e},
};
export function liftPalette(resort:string,liftName=''):LiftPalette {
 const palette={...defaultLiftPalette,...resortPalettes[resort]};
 // Distinctive carrier color documented by the official resort, not inferred from its logo.
 if(resort==='whistler'&&/peak\s*(?:2|to)\s*peak/i.test(liftName))palette.carrier=0xc53035;
 return palette;
}
export function resortLogo(id:string):string|undefined{return (logoSources as Record<string,{file:string}>)[id]?.file;}
