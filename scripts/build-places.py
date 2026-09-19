import os
"""Bounded OSM roads, building footprints, and mountain hospitality landmarks."""
import json,math,time,urllib.request,urllib.parse,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
for name in sys.argv[1:] or [p.stem for p in (ROOT/'public/geodata').glob('*.json')]:
 p=ROOT/'public/geodata'/f'{name}.json';d=json.loads(p.read_text());cache=ROOT/'research/geodata-cache'/f'{name}-places.json'
 try:
  if cache.exists():raw=json.loads(cache.read_text())
  else:
   b=','.join(map(str,d['bbox']));q=f'[out:json][timeout:35];(way["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|service|track|living_street)$"]({b});way["building"]({b});nwr["amenity"~"^(restaurant|cafe|bar|pub)$"]["name"]({b});nwr["tourism"~"^(alpine_hut|wilderness_hut|hotel|chalet|guest_house)$"]["name"]({b}););out body geom;'
   req=urllib.request.Request(os.environ.get('OVERPASS_URL','https://overpass-api.de/api/interpreter')+'?data='+urllib.parse.quote(q),headers={'User-Agent':'ChasingWinterPrototype/0.3'})
   for attempt in range(4):
    try:
     raw=json.load(urllib.request.urlopen(req,timeout=45));break
    except Exception:
     if attempt==3:raise
     time.sleep(10*(attempt+1))
   if 'remark' in raw:raise RuntimeError(raw['remark'])
   cache.write_text(json.dumps(raw))
  cx,cy=d['center'];cos=math.cos(math.radians(cy))
  def local(g):return [round((g['lon']-cx)*111320*cos,1),round((cy-g['lat'])*111320,1)]
  roads=[];buildings=[];places=[]
  for e in raw['elements']:
   t=e.get('tags',{});geo=e.get('geometry',[]);title=t.get('name:en',t.get('name',''))
   if t.get('highway') in ['motorway','trunk','primary','secondary','tertiary','unclassified','residential','service','track','living_street'] and len(geo)>1:roads.append({'id':e['id'],'name':title,'type':t['highway'],'access':t.get('access',''),'surface':t.get('surface',''),'points':[local(g) for g in geo]});continue
   if t.get('building') and len(geo)>3 and geo[0]==geo[-1]:buildings.append({'id':e['id'],'points':[local(g) for g in geo],'name':title})
   hospitality=t.get('amenity') in ['restaurant','cafe','bar','pub'] or t.get('tourism') in ['alpine_hut','wilderness_hut','hotel','chalet','guest_house'] or any(w in title.lower() for w in ['lodge','hütte','refuge'])
   if not title or not hospitality:continue
   if e['type']=='node':point=local(e)
   elif geo:point=[round(sum(local(g)[i] for g in geo)/len(geo),1) for i in range(2)]
   elif 'bounds' in e:bb=e['bounds'];point=local({'lat':(bb['minlat']+bb['maxlat'])/2,'lon':(bb['minlon']+bb['maxlon'])/2})
   else:continue
   kind='lodge' if any(w in title.lower() for w in ['lodge','hütte','refuge']) or t.get('tourism') in ['alpine_hut','wilderness_hut'] else 'dining' if t.get('amenity') else 'lodging'
   places.append({'id':str(e['type'])+'/'+str(e['id']),'name':title,'kind':kind,'point':point,'access':t.get('access',''),'source':'OpenStreetMap','url':'https://www.openstreetmap.org/'+str(e['type'])+'/'+str(e['id'])})
  seen=set();places=[x for x in places if not (x['name'] in seen or seen.add(x['name']))];places.sort(key=lambda x:(x['kind']!='lodge',x['name']))
  d['roads']=roads;d['buildings']=buildings;d['places']=places;d['source']['placesTimestamp']=raw.get('osm3s',{}).get('timestamp_osm_base');p.write_text(json.dumps(d,separators=(',',':')))
  print(name,len(roads),'roads',len(buildings),'buildings',len(places),'places',flush=True)
 except Exception as e:print(name,'ERROR',str(e),flush=True)
