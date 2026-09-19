"""Clip new resort networks to mapped ski boundaries and add local tower coordinates.
Run after build-geodata.py. Unbounded terrain/roads retain geographic context.
"""
import json,math,sys
from pathlib import Path
from shapely.geometry import Polygon,LineString
R=Path(__file__).resolve().parents[1]
rows=json.loads((R/'research/western-resorts.json').read_text())
aliases={'snowmass':['Aspen Snowmass'],'sun-valley':['Bald Mountain','Sun Valley'],'red-mountain':['Red Mountain Resort'],'crystal':['Crystal Mountain Resort'],'snoqualmie':['Alpental','Summit West','Summit Central','Summit East','The Summit at Snoqualmie']}
for row in rows:
 if sys.argv[1:] and row['id'] not in sys.argv[1:]:continue
 id=row['id'];p=R/'public/geodata'/f'{id}.json'
 if not p.exists():continue
 d=json.loads(p.read_text());raw=json.loads((R/'research/geodata-cache'/f'{id}-osm.json').read_text());cx,cy=d['center'];cos=math.cos(math.radians(cy))
 def local(pt):return [(pt['lon']-cx)*111320*cos,(cy-pt['lat'])*111320]
 names=[row['name'].lower(),*map(str.lower,aliases.get(id,[]))]
 bounds=[e for e in raw['elements'] if e.get('tags',{}).get('landuse')=='winter_sports' and e.get('geometry') and any(name in e.get('tags',{}).get('name','').lower() for name in names)]
 if bounds:
  from shapely.ops import unary_union
  polygon=unary_union([Polygon([local(pt) for pt in b['geometry']]).buffer(0) for b in bounds]);features=[]
  for f in d['features']:
   geometry=Polygon(f['points']) if f['area'] and len(f['points'])>3 and f['points'][0]==f['points'][-1] else LineString(f['points'])
   if not geometry.is_valid:geometry=geometry.buffer(0)
   clipped=geometry.intersection(polygon)
   for part in getattr(clipped,'geoms',[clipped]):
    if part.is_empty or part.geom_type not in ['LineString','Polygon']:continue
    coords=list(part.exterior.coords) if part.geom_type=='Polygon' else list(part.coords)
    if len(coords)>1:features.append({**f,'points':[[round(x,1),round(z,1)] for x,z in coords]})
  # Avoid erasing a network when an obsolete boundary covers only an old sector.
  lift_ids={f['id'] for f in d['features'] if f['kind']=='lift'};retained={f['id'] for f in features if f['kind']=='lift'}
  adjacent={'aspen-highlands','aspen-mountain','buttermilk','brighton','solitude','deer-valley'}
  if features and len(retained)>=min(2,len(lift_ids)) and (id in adjacent or len(retained)>=len(lift_ids)*.8):
   d['features']=features;d['source']['resortBoundaries']=['https://www.openstreetmap.org/way/'+str(b['id']) for b in bounds]
 ways={e['id']:e for e in raw['elements'] if e['type']=='way'};nodes=[e for e in raw['elements'] if e['type']=='node' and e.get('tags',{}).get('aerialway') in ['pylon','station']]
 for f in d['features']:
  if f['kind']!='lift':continue
  matches=[]
  for node in nodes:
   if node['id'] not in ways.get(f['id'],{}).get('nodes',[]):continue
   x,y=local(node);distance=1e9;along=0;best=0
   for a,b in zip(f['points'],f['points'][1:]):
    dx,dy=b[0]-a[0],b[1]-a[1];length=math.hypot(dx,dy);t=max(0,min(1,((x-a[0])*dx+(y-a[1])*dy)/(length*length))) if length else 0;gap=math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)
    if gap<distance:distance=gap;best=along+t*length
    along+=length
   if distance<8:matches.append(dict(id=node['id'],point=[x,y],kind=node['tags']['aerialway'],along=best))
  f['supports']=sorted(matches,key=lambda n:n['along'])
 d['source']['officialMap']=row['mapUrl'];p.write_text(json.dumps(d,separators=(',',':')))
 print(id,len(d['features']),'features',len(bounds),'boundaries',flush=True)
