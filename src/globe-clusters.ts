export interface MapPoint { id:string;x:number;y:number; }
/** Screen-space grouping keeps markers readable at any viewport or zoom level. */
export function clusterPoints<T extends MapPoint>(points:T[],width=142,height=48){
 const groups=points.map(p=>({x:p.x,y:p.y,points:[p]}));
 let changed=true;
 while(changed){changed=false;outer:for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++){
  const a=groups[i],b=groups[j];if(Math.abs(a.x-b.x)>=width||Math.abs(a.y-b.y)>=height)continue;
  a.points.push(...b.points);a.x=a.points.reduce((sum,p)=>sum+p.x,0)/a.points.length;a.y=a.points.reduce((sum,p)=>sum+p.y,0)/a.points.length;groups.splice(j,1);changed=true;break outer;
 }}return groups;
}
