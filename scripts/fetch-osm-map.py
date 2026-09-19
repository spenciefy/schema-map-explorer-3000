"""Bounded OSM Map API fallback for terrain and context extracts.
Splits boxes only when the documented map endpoint reports too many nodes.
Preserves original OSM IDs, tags, complete way nodes, and fetch provenance.
"""
import json,sys,time,urllib.request,urllib.error,xml.etree.ElementTree as ET
from pathlib import Path
R=Path(__file__).resolve().parents[1];C=R/'research/geodata-cache'
rows={r['id']:r for r in json.loads((R/'research/western-resorts.json').read_text())}
rows.update({r['id']:r for r in json.loads((R/'research/terrain-resorts.json').read_text())})
def read_box(bbox,depth=0):
 s,w,n,e=bbox;url=f'https://api.openstreetmap.org/api/0.6/map?bbox={w},{s},{e},{n}'
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'MountainAtlas/0.4 (personal geographic visualization)'})
  with urllib.request.urlopen(req,timeout=45) as resp:body=resp.read()
  return [ET.fromstring(body)]
 except urllib.error.HTTPError as ex:
  message=ex.read().decode(errors='ignore')
  if ex.code==400 and depth<2 and ('node' in message.lower() or 'area' in message.lower() or 'bbox' in message.lower()):
   lat=(s+n)/2;lon=(w+e)/2;parts=[]
   for box in [(s,w,lat,lon),(s,lon,lat,e),(lat,w,n,lon),(lat,lon,n,e)]:parts.extend(read_box(box,depth+1))
   return parts
  raise RuntimeError(f'{ex.code}: {message[:180]}') from ex
for id in sys.argv[1:]:
 try:
  started=time.time();r=rows[id];xml=Path('/tmp/crested-osm.xml')
  roots=[ET.fromstring(xml.read_bytes())] if id=='crested-butte' and xml.exists() else read_box(r['bbox'])
  elements={}
  for root in roots:
   for el in root:
    if el.tag in ['node','way','relation']:elements[(el.tag,int(el.attrib['id']))]=el
  nodes={key[1]:el for key,el in elements.items() if key[0]=='node'};converted=[]
  for (kind,eid),el in elements.items():
   tags={t.attrib['k']:t.attrib['v'] for t in el.findall('tag')};record=dict(type=kind,id=eid,tags=tags)
   if kind=='node':record.update(lat=float(el.attrib['lat']),lon=float(el.attrib['lon']))
   elif kind=='way':
    refs=[int(x.attrib['ref']) for x in el.findall('nd')]
    if not all(ref in nodes for ref in refs):continue
    record.update(nodes=refs,geometry=[dict(lat=float(nodes[ref].attrib['lat']),lon=float(nodes[ref].attrib['lon'])) for ref in refs])
   else:continue
   converted.append(record)
  stamp=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime());base={'version':.6,'generator':'OpenStreetMap Map API','osm3s':{'timestamp_osm_base':stamp},'extractionNote':'Bounded OpenStreetMap Map API snapshot; timestamp is retrieval time.'}
  core=[e for e in converted if (e['type']=='way' and (e['tags'].get('piste:type')=='downhill' or 'aerialway' in e['tags'] or e['tags'].get('natural')=='wood' or e['tags'].get('landuse') in ['forest','winter_sports'])) or (e['type']=='node' and (e['tags'].get('natural')=='peak' or e['tags'].get('aerialway') in ['pylon','station']))]
  context=[e for e in converted if (e['type']=='way' and ('highway' in e['tags'] or 'building' in e['tags'])) or ('name' in e['tags'] and ('amenity' in e['tags'] or 'tourism' in e['tags']))]
  if not (C/f'{id}-osm.json').exists():(C/f'{id}-osm.json').write_text(json.dumps({**base,'elements':core}))
  if not (C/f'{id}-places.json').exists():(C/f'{id}-places.json').write_text(json.dumps({**base,'elements':context}))
  print(id,len(core),'core elements',len(context),'context elements',round(time.time()-started),'seconds',flush=True)
 except Exception as ex:print(id,'ERROR',str(ex),flush=True)
