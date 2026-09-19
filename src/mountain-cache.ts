import type { MountainData } from './geography';

// Share parsed data between previews and maps; keep phone memory bounded.
export function createMountainLoader(fetcher:typeof fetch=fetch,limit=4){
 const cache=new Map<string,Promise<MountainData>>();
 return (id:string):Promise<MountainData>=>{
  const existing=cache.get(id);
  if(existing){cache.delete(id);cache.set(id,existing);return existing;}
  const pending=(async()=>{
   const response=await fetcher(`/geodata/${id}.json`);
   if(!response.ok)throw new Error('Mountain data unavailable');
   const data=await response.json() as MountainData;
   if(!Number.isInteger(data.gridSize)||data.gridSize<2||data.gridSize**2!==data.heights?.length)throw new Error('Invalid terrain grid');
   return data;
  })();
  cache.set(id,pending);
  while(cache.size>limit)cache.delete(cache.keys().next().value!);
  void pending.catch(()=>{if(cache.get(id)===pending)cache.delete(id);});
  return pending;
 };
}
export const loadMountain=createMountainLoader();
