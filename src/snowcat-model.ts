import { Parts } from './mountain-models.ts';
// A stylized passenger snowcat; origin is the underside of its tracks.
export function snowcatGeometry(){
 const p=new Parts(),orange=0xc65d35,dark=0x314348,glass=0x6e939f;
 for(const x of [-1.55,1.55]){
  p.box(.85,.72,5.6,dark,x,.36,0);
  for(let i=0;i<15;i++)p.box(.94,.10,.13,0x67726d,x,.75,-2.6+i*.37);
 }
 p.box(2.65,.5,4.6,orange,0,.9,0);
 p.box(2.55,1.65,2.55,orange,0,1.8,-.85);
 p.box(2.65,.16,2.65,0xece5d5,0,2.68,-.85);
 for(const x of [-1.3,1.3])for(let i=0;i<3;i++)p.box(.035,.8,.57,glass,x,1.95,-1.65+i*.75);
 p.box(2.5,1.2,1.35,orange,0,1.6,1.45);
 p.box(2.25,.7,.035,glass,0,1.87,2.14);
 p.box(2.65,.12,1.5,0xece5d5,0,2.25,1.45);
 p.box(4.5,.65,.25,0x89908b,0,.5,3);
 for(const x of [-.8,.8])p.box(.28,.2,.1,0xffeab0,x,1.2,2.22);
 p.box(.35,.2,.35,0xffb444,0,2.86,-.8);
 return p.finish();
}
