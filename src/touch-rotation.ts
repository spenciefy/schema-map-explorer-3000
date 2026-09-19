/** Signed twist between two touches, independent of pinch distance and translation. */
export function twistDelta(before: readonly number[], after: readonly number[]) {
 if (Math.hypot(...before) < 20 || Math.hypot(...after) < 20) return 0;
 return Math.atan2(before[0]*after[1]-before[1]*after[0], before[0]*after[0]+before[1]*after[1]);
}

/** Adds twist without intercepting OrbitControls' simultaneous pinch and pan. */
export function addTouchRotation(element: HTMLElement, rotate: (angle:number)=>void) {
 const points=new Map<number,[number,number]>();
 let previous:[number,number]|undefined;
 const vector=():[number,number]|undefined=>{if(points.size!==2)return;const [a,b]=[...points.values()];return [b[0]-a[0],b[1]-a[1]];};
 const down=(e:PointerEvent)=>{if(e.pointerType!=='touch')return;points.set(e.pointerId,[e.clientX,e.clientY]);previous=vector();};
 const move=(e:PointerEvent)=>{
  if(!points.has(e.pointerId))return;
  points.set(e.pointerId,[e.clientX,e.clientY]);const next=vector();
  if(previous&&next){const delta=twistDelta(previous,next);if(delta)rotate(delta);}
  previous=next;
 };
 const end=(e:PointerEvent)=>{points.delete(e.pointerId);previous=vector();};
 element.addEventListener('pointerdown',down);
 element.addEventListener('pointermove',move);
 element.addEventListener('pointerup',end);
 element.addEventListener('pointercancel',end);
 element.addEventListener('lostpointercapture',end);
 return ()=>{element.removeEventListener('pointerdown',down);element.removeEventListener('pointermove',move);element.removeEventListener('pointerup',end);element.removeEventListener('pointercancel',end);element.removeEventListener('lostpointercapture',end);};
}
