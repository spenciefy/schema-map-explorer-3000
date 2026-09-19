"""Clip Alta, Snowbird, and Breckenridge pistes and lifts to their sourced OSM ski-area polygons.
Run after rebuilding terrain extracts. Requires shapely.
"""
import json,math
from pathlib import Path
from shapely.geometry import Polygon,LineString
ROOT=Path(__file__).resolve().parents[1]
raw=json.loads((ROOT/'research/geodata-cache/alta-snowbird-boundaries.json').read_text())
raw['elements'].extend(json.loads((ROOT/'research/geodata-cache/breckenridge-boundaries.json').read_text())['elements'])
for site,name in [('alta','Alta Ski Area'),('snowbird','Snowbird'),('breckenridge','Breckenridge')]:
 path=ROOT/'public/geodata'/f'{site}.json';d=json.loads(path.read_text());boundary=next(e for e in raw['elements'] if e.get('tags',{}).get('name')==name);cx,cy=d['center'];cos=math.cos(math.radians(cy))
 points=[[(p['lon']-cx)*111320*cos,(cy-p['lat'])*111320] for p in boundary['geometry']];polygon=Polygon(points);features=[]
 for f in d['features']:
  geometry=Polygon(f['points']) if f['area'] and len(f['points'])>3 and f['points'][0]==f['points'][-1] else LineString(f['points'])
  if not geometry.is_valid:geometry=geometry.buffer(0)
  clipped=geometry.intersection(polygon)
  for part in getattr(clipped,'geoms',[clipped]):
   if part.is_empty or part.geom_type not in ['LineString','Polygon']:continue
   coords=list(part.exterior.coords) if part.geom_type=='Polygon' else list(part.coords)
   if len(coords)<2:continue
   features.append({**f,'points':[[round(x,1),round(z,1)] for x,z in coords]})
 d['features']=features;d['boundary']=points;d['source']['resortBoundary']='https://www.openstreetmap.org/way/'+str(boundary['id']);path.write_text(json.dumps(d,separators=(',',':')));print(site,len(features),'features',[(f['name']) for f in features if f['kind']=='lift'])
