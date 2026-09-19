"""Attach OSM tower/station coordinates to lifts, leaving height illustrative."""
import json,math,urllib.request,urllib.parse
from pathlib import Path
R=Path(__file__).resolve().parents[1];files=list((R/'public/geodata').glob('*.json'));cache=R/'research/geodata-cache/lift-supports.json'
if not cache.exists():
 queries=[]
 for p in files:
  b=','.join(map(str,json.loads(p.read_text())['bbox']));queries.append(f'node["aerialway"~"^(pylon|station)$"]({b});')
 q='[out:json][timeout:80];('+''.join(queries)+');out body;'
 req=urllib.request.Request('https://overpass-api.de/api/interpreter',data=('data='+urllib.parse.quote(q)).encode(),headers={'User-Agent':'ChasingWinterPrototype/0.4'})
 raw=json.load(urllib.request.urlopen(req,timeout=95))
 if 'remark' in raw:raise RuntimeError(raw['remark'])
 cache.write_text(json.dumps(raw))
raw=json.loads(cache.read_text());total=0
for path in files:
 d=json.loads(path.read_text());rawWays={f['id']:f for f in json.loads((R/'research/geodata-cache'/f'{path.stem}-osm.json').read_text())['elements'] if f['type']=='way'};cx,cy=d['center'];cos=math.cos(math.radians(cy));s,w,n,e=d['bbox']
 nodes=[{'id':p['id'],'point':[(p['lon']-cx)*111320*cos,(cy-p['lat'])*111320],'kind':p['tags']['aerialway']} for p in raw['elements'] if s<=p['lat']<=n and w<=p['lon']<=e]
 for f in d['features']:
  if f['kind']!='lift':continue
  matches=[]
  for node in nodes:
   x,y=node['point'];nearest=1e9;along=0;bestalong=0
   for a,b in zip(f['points'],f['points'][1:]):
    dx,dy=b[0]-a[0],b[1]-a[1];l=math.hypot(dx,dy)
    t=max(0,min(1,((x-a[0])*dx+(y-a[1])*dy)/(l*l))) if l else 0
    distance=math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)
    if distance<nearest:nearest=distance;bestalong=along+t*l
    along+=l
   if nearest<8 and (node['id'] in rawWays.get(f['id'],{}).get('nodes',[]) if rawWays.get(f['id'],{}).get('nodes') else nearest<.3):matches.append(dict(node,along=bestalong))
  f['supports']=sorted(matches,key=lambda p:p['along']);total+=len(matches)
 path.write_text(json.dumps(d,separators=(',',':')))
print('Mapped supports / stations attached:',total)
