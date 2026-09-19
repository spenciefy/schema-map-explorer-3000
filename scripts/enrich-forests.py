"""Add OSM multipolygon forest rings; these often contain the main forest canopy."""
import json,urllib.request,urllib.parse,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def join_rings(parts):
 parts=[p[:] for p in parts if len(p)>1];rings=[]
 while parts:
  ring=parts.pop(0)
  for _ in range(len(parts)+1):
   if ring[0]==ring[-1]:break
   match=False
   for i,p in enumerate(parts):
    if p[0]==ring[-1]:ring.extend(p[1:]);parts.pop(i);match=True;break
    if p[-1]==ring[-1]:ring.extend(p[-2::-1]);parts.pop(i);match=True;break
    if p[-1]==ring[0]:ring=p[:-1]+ring;parts.pop(i);match=True;break
    if p[0]==ring[0]:ring=p[:0:-1]+ring;parts.pop(i);match=True;break
   if not match:break
  if len(ring)>3 and ring[0]==ring[-1]:rings.append(ring)
 return rings
import math,sys
for name in sys.argv[1:]:
 p=ROOT/'public/geodata'/f'{name}.json';d=json.loads(p.read_text());cache=ROOT/'research/geodata-cache'/f'{name}-forest-relations.json'
 try:
  if cache.exists():raw=json.loads(cache.read_text())
  else:
   b=','.join(map(str,d['bbox']));q=f'[out:json][timeout:70];(rel["natural"="wood"]({b});rel["landuse"="forest"]({b}););out body geom;'
   req=urllib.request.Request('https://overpass-api.de/api/interpreter',data=('data='+urllib.parse.quote(q)).encode(),headers={'User-Agent':'ChasingWinterPrototype/0.2'})
   raw=json.load(urllib.request.urlopen(req,timeout=85));cache.write_text(json.dumps(raw))
  if 'remark' in raw:raise RuntimeError(raw['remark'])
  cx,cy=d['center'];cos=math.cos(math.radians(cy));outer=[];inner=[]
  for r in raw.get('elements',[]):
   for role,dst in [('outer',outer),('inner',inner)]:
    parts=[[(g['lon'],g['lat']) for g in m['geometry']] for m in r.get('members',[]) if m.get('role', 'outer')==role and 'geometry' in m]
    for ring in join_rings(parts):dst.append([[round((lon-cx)*111320*cos,1),round((cy-lat)*111320,1)] for lon,lat in ring])
  if not d.get('forestEnriched'):d['forests'].extend(outer)
  d['forestHoles']=inner;d['forestEnriched']=True
  p.write_text(json.dumps(d,separators=(',',':')));print(name,len(outer),'outer',len(inner),'holes',flush=True)
 except Exception as e:print(name,'ERROR',str(e),flush=True)
