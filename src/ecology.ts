import type { Resort } from './data';
export type TreeForm='pine'|'fir'|'spruce'|'hemlock'|'birch'|'aspen'|'larch';
export type AnimalForm='deer'|'elk'|'chamois'|'serow'|'hare';
export interface Ecology {id:string;name:string;trees:TreeForm[];colors:number[];density:number;treeline:number;wildlife:AnimalForm;animalName:string;understory:string;winterTint?:number;bareUpper?:boolean;}
const profiles:Record<string,Ecology>={
 sierra:{id:'sierra',name:'Sierra pine & fir',trees:['pine','pine','fir'],colors:[0x5b7256,0x758467,0x436654],density:.8,treeline:3200,wildlife:'deer',animalName:'Mule deer',understory:'Low evergreen scrub'},
 coastal:{id:'coastal',name:'Coastal hemlock & fir',trees:['hemlock','hemlock','fir'],colors:[0x315c50,0x46695a,0x537464],density:1,treeline:1900,wildlife:'deer',animalName:'Black-tailed deer',understory:'Snow-covered shrubs'},
 interior:{id:'interior',name:'Interior spruce & pine',trees:['spruce','pine','fir'],colors:[0x48665c,0x5d7866,0x668176],density:.9,treeline:2350,wildlife:'deer',animalName:'Mule deer',understory:'Low woody shrubs'},
 rockies:{id:'rockies',name:'Rocky Mountain spruce & aspen',trees:['spruce','fir','aspen','pine'],colors:[0x506d63,0x6c8070,0x47605a],density:.8,treeline:3450,wildlife:'elk',animalName:'Elk',understory:'Bare willow-like scrub'},
 alps:{id:'alps',name:'Alpine larch & stone pine',trees:['larch','pine','spruce'],colors:[0x637662,0x7e846b,0x506354],density:.75,treeline:2350,wildlife:'chamois',animalName:'Chamois',understory:'Low evergreen heath'},
 hokkaido:{id:'hokkaido',name:'Hokkaido winter birch',trees:['birch','birch','birch','birch','birch','fir'],colors:[0x657568,0x748778,0x4c685c],density:.58,treeline:1150,winterTint:.16,bareUpper:true,wildlife:'deer',animalName:'Sika deer',understory:'Snow-covered woody scrub'},
 honshu:{id:'honshu',name:'Japanese Alps birch & conifers',trees:['birch','birch','birch','fir'],colors:[0x687766,0x7c8772,0x496456],density:.65,treeline:2100,winterTint:.23,bareUpper:true,wildlife:'serow',animalName:'Japanese serow',understory:'Low mountain-pine scrub'},
 alaska:{id:'alaska',name:'Alaskan spruce & hemlock',trees:['spruce','hemlock','birch'],colors:[0x48695f,0x5e7c70,0x728578],density:.7,treeline:750,wildlife:'hare',animalName:'Snowshoe hare',understory:'Bare alder-like scrub'},
};
export function ecologyFor(resort:Pick<Resort,'id'|'region'|'area'|'lat'|'lon'>):Ecology{
 if(resort.region==='alps')return profiles.alps;
 if(resort.region==='japan'){
  if(resort.id==='iwanai')return {...profiles.hokkaido,name:'Iwanai winter woodland',treeline:950,density:.5};
  return profiles[resort.id==='hakuba'?'honshu':'hokkaido'];
 }
 if(resort.area==='Alaska')return profiles.alaska;
 if(resort.area==='California')return profiles.sierra;
 if(resort.lon< -121)return profiles.coastal;
 if(resort.area==='British Columbia'||resort.area==='Alberta'||resort.area==='Montana'||resort.area==='Idaho')return profiles.interior;
 return profiles.rockies;
}
// Approximate regional winter structure, not a species inventory or surveyed treeline.
export function treeAtElevation(profile:Ecology,elevation:number,choice:number){
 const exposure=Math.max(0,Math.min(1,(elevation-(profile.treeline-450))/650));
 const forms=profile.bareUpper&&elevation>profile.treeline-300?profile.trees.filter(t=>t==='birch'):elevation>profile.treeline-250?profile.trees.filter(t=>t!=='aspen'):profile.trees;
 const alpineFade=profile.bareUpper?Math.max(0,Math.min(1,(profile.treeline-elevation)/220)):1;
 return {form:forms[Math.min(forms.length-1,Math.floor(choice*forms.length))],scale:1-exposure*.6,density:profile.density*(1-exposure*.82)*alpineFade};
}
