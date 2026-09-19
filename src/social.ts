import {resorts} from './data.ts';
import {mountainAliases} from './routing.ts';
export const siteOrigin='https://toposki.vercel.app';
export function socialMetadata(pathname:string){
 const slug=pathname.replace(/^\/|\/$/g,'');
 const resort=resorts.find(r=>r.id===(mountainAliases[slug]??slug));
 const about=slug==='about';
 return {
  title:resort?`${resort.name} · topo.ski`:about?'About · topo.ski':'topo.ski · Ski maps in 3D',
  description:resort?`Explore ${resort.name}, ${resort.area}, in 3D. Discover the mountain’s terrain, trails and lifts.`:'A little closer to the mountains. Explore ski terrain, trails and lifts in an interactive 3D atlas.',
  url:`${siteOrigin}/${resort?.id??(about?'about':'')}`,
  image:`${siteOrigin}/social/${resort?.id??'home'}.jpg`,
  imageAlt:resort?`A 3D terrain map of ${resort.name} with ski trails and lifts.`:'A sculptural 3D ski map of Palisades Tahoe, with trails and lifts, on a warm paper background.',
 };
}
export function updateSocialMetadata(pathname:string){
 const m=socialMetadata(pathname);
 const tags:Record<string,string>={'description':m.description,'og:title':m.title,'og:description':m.description,'og:url':m.url,'og:image':m.image,'og:image:alt':m.imageAlt,'twitter:title':m.title,'twitter:description':m.description,'twitter:image':m.image,'twitter:image:alt':m.imageAlt};
 for(const[key,value]of Object.entries(tags))document.querySelector<HTMLMetaElement>(`meta[${key.startsWith('og:')?'property':'name'}="${key}"]`)?.setAttribute('content',value);
 document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href',m.url);
}
