import { westernResorts } from './western-resorts.ts';
export type Region = 'north-america' | 'alps' | 'japan';
export type Pass = 'all' | 'ikon' | 'epic' | 'saved';
export interface Resort {
  id: string; name: string; country: string; area: string; region: Region;
  pass: 'ikon' | 'epic' | 'independent'; lat: number; lon: number; elevation: number;
  x: number; z: number; height: number; radius: number; seed: number;
  snow: number; temp: number; wind: number; description: string; url: string;
}
export const regions: Record<Region, { name: string; subtitle: string; coordinates: string }> = {
  'north-america': { name: 'North America', subtitle: 'THE GREAT WEST', coordinates: '39°–51° N / 105°–123° W' },
  alps: { name: 'The Alps', subtitle: 'ACROSS THE HIGH ALPS', coordinates: '45°–47° N / 6°–12° E' },
  japan: { name: 'Japan', subtitle: 'THE DEEP WINTER', coordinates: '36°–43° N / 137°–141° E' },
};
export const resorts: Resort[] = [
  {id:'whistler',name:'Whistler Blackcomb',country:'Canada',area:'British Columbia',region:'north-america',pass:'epic',lat:50.115,lon:-122.95,elevation:1850,x:-67,z:-30,height:30,radius:27,seed:2,snow:34,temp:-7,wind:18,description:'Two mountains. Endless little reasons to miss your flight home.',url:'https://www.whistlerblackcomb.com/'},
  {id:'revelstoke',name:'Revelstoke',country:'Canada',area:'British Columbia',region:'north-america',pass:'ikon',lat:50.958,lon:-118.163,elevation:1950,x:-15,z:-53,height:37,radius:26,seed:7,snow:48,temp:-9,wind:12,description:'Long fall lines, snow-laden trees, and that just-one-more-run feeling.',url:'https://www.revelstokemountainresort.com/'},
  {id:'jackson',name:'Jackson Hole',country:'United States',area:'Wyoming',region:'north-america',pass:'ikon',lat:43.588,lon:-110.828,elevation:2700,x:48,z:-23,height:40,radius:29,seed:13,snow:28,temp:-12,wind:22,description:'Big terrain beneath the Tetons. A place that stays with you.',url:'https://www.jacksonhole.com/'},
  {id:'palisades',name:'Palisades Tahoe',country:'United States',area:'California',region:'north-america',pass:'ikon',lat:39.197,lon:-120.235,elevation:2400,x:-63,z:34,height:27,radius:29,seed:19,snow:22,temp:-4,wind:14,description:'From KT-22 to Alpine’s wide-open bowls. Two mountains, one ride between them.',url:'https://www.palisadestahoe.com/'},
  {id:'powder',name:'Powder Mountain',country:'United States',area:'Utah',region:'north-america',pass:'independent',lat:41.379,lon:-111.78,elevation:2500,x:-5,z:26,height:28,radius:31,seed:29,snow:38,temp:-8,wind:9,description:'Take the slow lift. Find the quiet trees. Leave a line of your own.',url:'https://powdermountain.com/'},
  {id:'park-city',name:'Park City',country:'United States',area:'Utah',region:'north-america',pass:'epic',lat:40.651,lon:-111.508,elevation:2700,x:56,z:40,height:27,radius:29,seed:41,snow:24,temp:-6,wind:11,description:'A maze of snowy trails with a warm mountain town waiting below.',url:'https://www.parkcitymountain.com/'},
  {id:'northstar',name:'Northstar California',country:'United States',area:'California',region:'north-america',pass:'epic',lat:39.254,lon:-120.124,elevation:2400,x:0,z:0,height:30,radius:30,seed:47,snow:26,temp:-5,wind:10,description:'Long corduroy mornings, quiet pine forests, and one last lap through the trees.',url:'https://www.northstarcalifornia.com/'},
  {id:'alta',name:'Alta',country:'United States',area:'Utah',region:'north-america',pass:'ikon',lat:40.580,lon:-111.638,elevation:3000,x:0,z:0,height:30,radius:30,seed:53,snow:44,temp:-10,wind:13,description:'A slow chair into deep winter. Familiar traverses, soft turns, and a lodge at the end of the day.',url:'https://www.alta.com/'},
  {id:'snowbird',name:'Snowbird',country:'United States',area:'Utah',region:'north-america',pass:'ikon',lat:40.567,lon:-111.657,elevation:3000,x:0,z:0,height:30,radius:30,seed:59,snow:42,temp:-11,wind:17,description:'A tram above the canyon. Big bowls, little powder pockets, and a horizon that keeps unfolding.',url:'https://www.snowbird.com/'},
  {id:'breckenridge',name:'Breckenridge',country:'United States',area:'Colorado',region:'north-america',pass:'epic',lat:39.475,lon:-106.085,elevation:3400,x:0,z:0,height:30,radius:30,seed:61,snow:21,temp:-12,wind:18,description:'Five peaks to wander. High alpine light, snowy spruce, and a warm town waiting below.',url:'https://www.breckenridge.com/'},
  {id:'arapahoe-basin',name:'Arapahoe Basin',country:'United States',area:'Colorado',region:'north-america',pass:'ikon',lat:39.631,lon:-105.872,elevation:3600,x:0,z:0,height:30,radius:30,seed:67,snow:24,temp:-13,wind:20,description:'Above the trees, beneath the East Wall. A few more turns before the long afternoon at the Beach.',url:'https://www.arapahoebasin.com/'},
  ...westernResorts,
  {id:'chamonix',name:'Chamonix',country:'France',area:'Haute-Savoie',region:'alps',pass:'ikon',lat:45.94,lon:6.87,elevation:2500,x:-57,z:20,height:43,radius:33,seed:11,snow:32,temp:-10,wind:19,description:'Sharp granite, deep valleys, and mountains that make you feel small.',url:'https://www.montblancnaturalresort.com/'},
  {id:'verbier',name:'Verbier',country:'Switzerland',area:'Valais',region:'alps',pass:'epic',lat:46.1,lon:7.23,elevation:2700,x:-26,z:-35,height:38,radius:30,seed:17,snow:41,temp:-11,wind:15,description:'High alpine bowls above a village made for lingering.',url:'https://verbier4vallees.ch/'},
  {id:'zermatt',name:'Zermatt',country:'Switzerland',area:'Valais',region:'alps',pass:'ikon',lat:45.99,lon:7.75,elevation:2900,x:26,z:24,height:49,radius:32,seed:23,snow:27,temp:-14,wind:21,description:'A storybook village under a silhouette you would know anywhere.',url:'https://www.matterhornparadise.ch/'},
  {id:'dolomites',name:'Dolomiti Superski',country:'Italy',area:'South Tyrol',region:'alps',pass:'ikon',lat:46.5,lon:11.85,elevation:2300,x:57,z:-32,height:37,radius:30,seed:37,snow:19,temp:-5,wind:8,description:'Pale stone towers, espresso stops, and a whole horizon to explore.',url:'https://www.dolomitisuperski.com/'},
  {id:'niseko',name:'Niseko United',country:'Japan',area:'Hokkaido',region:'japan',pass:'ikon',lat:42.86,lon:140.69,elevation:950,x:-18,z:-31,height:38,radius:42,seed:3,snow:64,temp:-13,wind:12,description:'Quiet birch forests and the kind of snow you dream about all summer.',url:'https://www.niseko.ne.jp/en/'},
  {id:'rusutsu',name:'Rusutsu',country:'Japan',area:'Hokkaido',region:'japan',pass:'epic',lat:42.74,lon:140.91,elevation:800,x:50,z:20,height:27,radius:33,seed:43,snow:56,temp:-11,wind:8,description:'A fresh canvas between the trees, with another storm on the way.',url:'https://rusutsu.com/en/'},
  {id:'hakuba',name:'Hakuba Valley',country:'Japan',area:'Nagano',region:'japan',pass:'epic',lat:36.7,lon:137.8,elevation:1600,x:-57,z:34,height:42,radius:34,seed:31,snow:37,temp:-8,wind:15,description:'Big alpine peaks, little wooden lodges, and an onsen after the last run.',url:'https://www.hakubavalley.com/en/'},
];
export const days = ['Friday', 'Saturday', 'Sunday'];
export const demoHours = Array.from({length:49},(_,i)=>i + 16);
export function demoWeather(resort: Resort, hour: number) {
  const storm = Math.max(0, Math.sin((hour + resort.seed % 9 - 10) / 48 * Math.PI * 2));
  return {snow: resort.snow, temp: Math.round(resort.temp + Math.sin(hour / 24 * Math.PI * 2) * 3), wind: Math.round(resort.wind + storm * 6), cloud: Math.round(15 + storm * 78), snowfall: storm * 1.8};
}
