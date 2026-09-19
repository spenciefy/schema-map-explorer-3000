import * as THREE from 'three';
import { Parts } from './mountain-models.ts';
import type { TreeForm, AnimalForm } from './ecology';
const v=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
export function localeTreeGeometry(form:TreeForm,snow=false){
 const p=new Parts(),bare=['birch','aspen','larch'].includes(form),height=form==='hemlock'?2.3:form==='pine'?1.9:form==='spruce'?2.05:1.8;
 const bark=form==='birch'||form==='aspen'?0xe2ded0:0x756954;
 if(!snow)p.add(new THREE.CylinderGeometry(.023,.065,height,5),bark,0,height/2,0);
 // Birch crowns fork upward irregularly; they are not tiered evergreen silhouettes.
 if(form==='birch'){
  for(let branch=0;branch<9;branch++){
   const angle=branch*2.399,y=.45+branch*.12,start=v(0,y,0);
   const elbow=v(Math.cos(angle)*(.20+branch%3*.045),y+.22,Math.sin(angle)*(.20+branch%3*.045));
   const end=elbow.clone().add(v(Math.cos(angle+.3)*.17,.25,Math.sin(angle+.3)*.17));
   p.rod(start,elbow,snow?.008:.018,snow?0xeeeede:bark);
   p.rod(elbow,end,snow?.006:.011,snow?0xeeeede:bark);
   if(!snow){const fork=elbow.clone().add(v(Math.cos(angle+1)*.2,.18,Math.sin(angle+1)*.2));p.rod(elbow,fork,.008,bark);}
  }
  if(!snow)for(let i=0;i<6;i++)p.box(.055,.025,.06,0x776f62,.012,.2+i*.23,0);
  return p.finish();
 }
 const tiers=bare?4:5;
 for(let tier=0;tier<tiers;tier++)for(let branch=0;branch<4;branch++){
  const angle=branch*Math.PI/2+tier*1.7,y=.38+tier*height/6;
  const radius=(1-tier*.16)*(form==='pine'?.52:form==='hemlock'?.36:form==='fir'?.38:.28);
  const end=v(Math.cos(angle)*radius,y+(bare?.24:-.08),Math.sin(angle)*radius);
  if(bare){
   const start=v(0,y,0);p.rod(start,end,snow?.013:.022,snow?0xeeeede:bark);
   if(!snow){const fork=end.clone().multiplyScalar(.78);fork.y+=.28;p.rod(end.clone().lerp(start,.4),fork,.012,bark);}
  }else{
   const g=new THREE.TetrahedronGeometry(1);g.scale(radius,snow?.055:.16,radius*.52);g.rotateY(-angle);p.add(g,snow?0xececdf:0xffffff,end.x*.5,y+(snow?.1:0),end.z*.5);
  }
 }
 if(!snow&&form==='aspen')for(let i=0;i<6;i++)p.box(.055,.025,.06,0x776f62,.012,.2+i*.23,0);
 return p.finish();
}
export function shrubGeometry(evergreen:boolean){
 const p=new Parts();for(let i=0;i<5;i++){const angle=i*2.4,end=v(Math.cos(angle)*.22,.18+(i%2)*.08,Math.sin(angle)*.22);p.rod(v(0,0,0),end,.016,0x887e68);if(evergreen)p.add(new THREE.IcosahedronGeometry(.12,0),0x6e7960,end.x,end.y,end.z);p.add(new THREE.IcosahedronGeometry(.07,0),0xe7e8dc,end.x,end.y+.04,end.z);}return p.finish();
}
export function wildlifeGeometry(kind:AnimalForm){
 const p=new Parts(),hare=kind==='hare',stocky=kind==='serow',elk=kind==='elk';
 const color=hare?0xe9e7dd:stocky?0x77796a:kind==='chamois'?0x72634d:elk?0x92775a:0x9e8a70;
 const body=new THREE.IcosahedronGeometry(1,1);body.scale(hare?.14:stocky?.22:.17,hare?.13:.21,hare?.23:elk?.43:.32);p.add(body,color,0,hare?.16:.45,0);
 if(!hare)for(const x of [-.11,.11])for(const z of [-.22,.22])p.rod(v(x,.04,z),v(x,.4,z),.035,color);
 const head=new THREE.IcosahedronGeometry(hare?.10:.12,1);head.scale(1,1,1.3);p.add(head,elk?0x695c4c:color,0,hare?.27:.68,hare?.17:.30);
 for(const x of [-.065,.065]){const ear=new THREE.ConeGeometry(.037,hare?.22:.12,4);p.add(ear,color,x,hare?.40:.81,hare?.16:.28,0,0,x*3);}
 if(kind==='chamois'||stocky)for(const x of [-.07,.07])p.rod(v(x,.77,.3),v(x,.94,.25),.015,0x443f34);
 // Antlerless winter silhouettes avoid assuming sex or antler season.
 return p.finish();
}
