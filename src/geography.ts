import { westernMapReferences } from './western-resorts.ts';
export type Point = [number, number];
export interface MapFeature { id:number; kind:'trail'|'lift'; name:string; difficulty:string; type:string; area:boolean; access:string; proposed?:boolean; retired?:boolean; supports?:{id:number;point:Point;kind:string;along:number}[]; capacityNote?:string; occupancy?:number; chairSeats?:number; cabinOccupancy?:number; capacitySource?:string; detachable?:boolean; speedMps?:number; points:Point[]; }
export interface MapPlace {id:string;name:string;kind:string;point:Point;source:string;url:string;access?:string;}
export interface MapRoad {id:number;name:string;type:string;access:string;surface:string;points:Point[];}
export interface MountainData {roads?:MapRoad[];buildings?:{id:number;name:string;points:Point[]}[];places?:MapPlace[];id:string;bbox:number[];center:Point;width:number;depth:number;gridSize:number;heights:number[];features:MapFeature[];peaks:{name:string;point:Point;elevation?:string}[];forests:Point[][];landcover?:string;forestHoles?:Point[][];source:{terrain:string;terrainAttribution:string;osmTimestamp:string;downloadedAt:string;sampleSpacingMeters:Point};}
export const mapReferences:Record<string,{url:string;coverage:string;view:[number,number];note?:string;label?:string;frame?:'terrain'}>={
 ...westernMapReferences,
 northstar:{url:'https://www.northstarcalifornia.com/the-mountain/about-the-mountain/trail-map.aspx',coverage:'Mt. Pluto, Lookout Mountain & the Backside',view:[.3,-1]},
 alta:{url:'https://www.alta.com/plan-your-trip',coverage:'Alta · Little Cottonwood Canyon',view:[0,-1],note:'Alta is a skiers-only mountain.'},
 snowbird:{url:'https://www.snowbird.com/the-mountain/maps/winter-trail-map/',coverage:'Snowbird · Gad Valley, Peruvian Gulch & Mineral Basin',view:[-.3,-1]},
 breckenridge:{url:'https://www.breckenridge.com/the-mountain/about-the-mountain/trail-map.aspx',coverage:'Peaks 6–10 & Breckenridge',view:[1,.1]},
 'arapahoe-basin':{url:'https://www.arapahoebasin.com/trail-maps/',coverage:'Frontside, Beavers & Montezuma Bowl',view:[-.2,-1]},
 powder:{url:'https://powdermountain.com/trail-map',coverage:'Powder Mountain',view:[-.6,-.8],note:'Private lifts are marked; DMI is proposed in the mapped source.'},
 palisades:{url:'https://www.palisadestahoe.com/mountain-information/trail-maps',coverage:'Palisades & Alpine Meadows · Base to Base Gondola',view:[.6,-1]},
 jackson:{url:'https://www.jacksonhole.com/maps/mountain-winter',coverage:'Jackson Hole & surrounding peaks',view:[1,.5]},
 whistler:{url:'https://www.whistlerblackcomb.com/the-mountain/about-the-mountain/trail-maps.aspx',coverage:'Whistler & Blackcomb',view:[-.5,-1]},
 revelstoke:{url:'https://www.revelstokemountainresort.com/discover/about/trail-maps/',coverage:'Mount Mackenzie',view:[-1,.4]},
 'park-city':{url:'https://www.parkcitymountain.com/the-mountain/about-the-mountain/trail-map.aspx',coverage:'Park City region · includes neighboring terrain',view:[.3,-1]},
 iwanai:{url:'https://iwanairesort.com/en/lift/iwanai',coverage:'Mount Iwanai · north face, town & Sea of Japan',view:[1,-.25],frame:'terrain',note:'One double chair at the base. Upper terrain is guided CAT skiing; mapped lines are not a complete CAT route guide.'},
 niseko:{url:'https://www.niseko.ne.jp/en/map/',coverage:'Niseko United / Annupuri',view:[.6,1]},
 rusutsu:{url:'https://rusutsu.com/en/ski/course/',coverage:'Rusutsu mountain group',view:[-1,-.3]},
 hakuba:{url:'https://www.hakubavalley.com/en/ski/',coverage:'Happo-One & central Hakuba sector',view:[1,.1]},
 chamonix:{url:'https://www.montblancnaturalresort.com/en/maps',coverage:'Brévent–Flégère sector',view:[1,1]},
 verbier:{url:'https://verbier4vallees.ch/en/useful-information/interactive-map',coverage:'Verbier / western 4 Vallées sector',view:[-1,.4]},
 zermatt:{url:'https://www.matterhornparadise.ch/en/information/operating-hours',coverage:'Zermatt sector · not all Matterhorn Ski Paradise',view:[1,-1]},
 dolomites:{url:'https://www.dolomitisuperski.com/en/Experience/Ski-map',coverage:'Sella massif sector · not all Dolomiti Superski',view:[.7,-1]},
};
export const difficultyColors:Record<string,number>={novice:0x4b975d,easy:0x489666,intermediate:0x317aad,advanced:0x303d4a,expert:0x232c39,freeride:0xb8893f,unknown:0x7d8790};
export const difficultyNames:Record<string,string>={novice:'Novice',easy:'Easy',intermediate:'Intermediate',advanced:'Advanced',expert:'Expert',freeride:'Freeride',unknown:'Unrated'};
export function featureTitle(f:MapFeature){return f.name || (f.kind==='lift'?'Unnamed lift':'Unnamed trail');}
export function elevationAt(data:MountainData,x:number,z:number){
 const n=data.gridSize,u=Math.max(0,Math.min(n-1,(x/data.width+.5)*(n-1))),v=Math.max(0,Math.min(n-1,(z/data.depth+.5)*(n-1)));const i=Math.min(n-2,Math.floor(u)),j=Math.min(n-2,Math.floor(v)),a=u-i,b=v-j;
 return data.heights[j*n+i]*(1-a)*(1-b)+data.heights[j*n+i+1]*a*(1-b)+data.heights[(j+1)*n+i]*(1-a)*b+data.heights[(j+1)*n+i+1]*a*b;
}
// Barycentric interpolation matches makeTerrain's a-c-b / b-c-e triangles.
export function surfaceElevationAt(data:MountainData,x:number,z:number){
 const n=data.gridSize,u=Math.max(0,Math.min(n-1,(x/data.width+.5)*(n-1))),v=Math.max(0,Math.min(n-1,(z/data.depth+.5)*(n-1)));
 const i=Math.min(n-2,Math.floor(u)),j=Math.min(n-2,Math.floor(v)),a=u-i,b=v-j,h=data.heights,k=j*n+i;
 return a+b<=1?h[k]*(1-a-b)+h[k+1]*a+h[k+n]*b:h[k+1]*(1-b)+h[k+n]*(1-a)+h[k+n+1]*(a+b-1);
}
export function inExtent(data:MountainData,p:Point){return Math.abs(p[0])<=data.width/2&&Math.abs(p[1])<=data.depth/2;}
export function featureLength(f:MapFeature){let d=0;for(let i=1;i<f.points.length;i++)d+=Math.hypot(f.points[i][0]-f.points[i-1][0],f.points[i][1]-f.points[i-1][1]);return d;}

export function trailColor(resortId:string,difficulty:string){
 const alps=['chamonix','verbier','zermatt','dolomites'].includes(resortId);const japan=['niseko','rusutsu','hakuba','iwanai'].includes(resortId);
 if(alps&&difficulty==='easy')return 0x317aad;
 if((alps||japan)&&difficulty==='intermediate')return 0xc34843;
 return difficultyColors[difficulty]||difficultyColors.unknown;
}

/** Clip each source segment to the DEM window. Never bridge excursions outside it. */
export function clipFeature(data:Pick<MountainData,'width'|'depth'>,feature:MapFeature):MapFeature[]{
 const parts:Point[][]=[];let current:Point[]=[];
 const equal=(a:Point,b:Point)=>Math.hypot(a[0]-b[0],a[1]-b[1])<.001;
 for(let i=1;i<feature.points.length;i++){
  const a=feature.points[i-1],b=feature.points[i],dx=b[0]-a[0],dz=b[1]-a[1];let low=0,high=1,valid=true;
  const constraints=[[-dx,a[0]+data.width/2],[dx,data.width/2-a[0]],[-dz,a[1]+data.depth/2],[dz,data.depth/2-a[1]]];
  for(const [p,q] of constraints){if(p===0){if(q<0)valid=false;}else{const t=q/p;if(p<0)low=Math.max(low,t);else high=Math.min(high,t);}}
  if(!valid||low>=high){if(current.length>1)parts.push(current);current=[];continue;}
  const start:Point=[a[0]+dx*low,a[1]+dz*low],end:Point=[a[0]+dx*high,a[1]+dz*high];
  if(current.length&&!equal(current[current.length-1],start)){if(current.length>1)parts.push(current);current=[];}
  if(!current.length)current.push(start);current.push(end);
  if(high<1){parts.push(current);current=[];}
 }
 if(current.length>1)parts.push(current);
 return parts.map(points=>({...feature,points})).sort((a,b)=>featureLength(b)-featureLength(a));
}

export function mapsLink(data:MountainData,point:Point=[0,0]){const lat=data.center[1]-point[1]/111320,lon=data.center[0]+point[0]/(111320*Math.cos(data.center[1]*Math.PI/180));return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lon.toFixed(6)}`;}
