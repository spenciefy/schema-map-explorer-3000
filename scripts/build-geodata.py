import os
"""Reproducible DEM + OSM extraction. No hand-invented trail coordinates.
Run with Python 3 + Pillow. OSM: ODbL; elevation attribution in manifest.
"""
import json, math, io, time, urllib.request, urllib.parse, concurrent.futures
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'public/geodata'; CACHE=ROOT/'research/geodata-cache';OUT.mkdir(exist_ok=True);CACHE.mkdir(exist_ok=True)
# Geographic coverage, not resort boundaries. South, west, north, east.
SITES={
 'northstar':(39.220,-120.175,39.290,-120.100),
 'alta':(40.550,-111.670,40.607,-111.600),
 'snowbird':(40.540,-111.710,40.610,-111.630),
 'breckenridge':(39.425,-106.140,39.520,-106.035),
 'arapahoe-basin':(39.601,-105.925,39.660,-105.850),
 'powder':(41.330,-111.830,41.423,-111.700),
 'palisades':(39.130,-120.300,39.225,-120.200),
 'jackson':(43.570,-110.905,43.625,-110.815),
 'whistler':(50.025,-123.030,50.150,-122.835),
 'revelstoke':(50.930,-118.190,51.005,-118.070),
 'park-city':(40.595,-111.630,40.715,-111.475),
 'niseko':(42.825,140.615,42.905,140.740),
 'rusutsu':(42.715,140.880,42.765,140.970),
 'hakuba':(36.670,137.725,36.740,137.855),
 'chamonix':(45.925,6.825,46.010,6.930),
 'verbier':(46.045,7.200,46.135,7.365),
 'zermatt':(45.940,7.690,46.045,7.830),
 'dolomites':(46.450,11.760,46.555,11.940),
}
SITES.update({r['id']:tuple(r['bbox']) for r in json.loads((ROOT/'research/western-resorts.json').read_text())})
SITES.update({r['id']:tuple(r['bbox']) for r in json.loads((ROOT/'research/terrain-resorts.json').read_text())})
AT='https://github.com/tilezen/joerd/blob/master/docs/attribution.md'
def download(url,data=None):
 if data is not None and 'overpass' in url:url+='?'+data.decode();data=None
 req=urllib.request.Request(url,data=data,headers={'User-Agent':'ChasingWinterPrototype/0.2 (personal open-data visualization)'})
 for attempt in range(3):
  try:return urllib.request.urlopen(req,timeout=95).read()
  except Exception:
   if attempt==2:raise
   time.sleep(2+attempt*3)
def pixel(lon,lat,z=13):
 n=256*2**z
 return (lon+180)/360*n, (1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n
def osm(site,bbox):
 path=CACHE/f'{site}-osm.json'
 if path.exists():return json.loads(path.read_text())
 s,w,n,e=bbox;b=','.join(map(str,bbox))
 # Include route relations: European pistes commonly store names/difficulties there.
 q=f'[out:json][timeout:80];(way["piste:type"~"downhill"]({b});relation["route"="piste"]["piste:type"~"downhill"]({b});way["aerialway"]["aerialway"!~"station|pylon|goods"]({b});node["natural"="peak"]({b});node["aerialway"~"^(pylon|station)$"]({b});way["landuse"="winter_sports"]({b});way["natural"="wood"]({b});way["landuse"="forest"]({b}););out body geom;'
 if os.environ.get('OVERPASS_CORE_ONLY'):
  q=f'[out:json][timeout:35];(way["piste:type"="downhill"]({b});way["aerialway"]({b}););out body geom;'
 if False:
  # Use the already fetched source; it includes current routes and lifts.
  data=json.loads(Path('/tmp/powder-osm.json').read_text())
 else:data=json.loads(download(os.environ.get('OVERPASS_URL','https://overpass-api.de/api/interpreter'),('data='+urllib.parse.quote(q)).encode()))
 if 'remark' in data:raise RuntimeError(data['remark'])
 if os.environ.get('OVERPASS_CORE_ONLY'):data['extractionNote']='Mapped trails and lifts; forest coverage supplied by ESA WorldCover.'
 path.write_text(json.dumps(data));return data
def build(site,bbox):
 start=time.time();path=OUT/f'{site}.json'
 if path.exists():print(site,'cached',flush=True);return
 data=osm(site,bbox);s,w,n,e=bbox;cx=(w+e)/2;cy=(s+n)/2;cos=math.cos(math.radians(cy));width=(e-w)*111320*cos;depth=(n-s)*111320
 def local(p):return [round((p['lon']-cx)*111320*cos,1),round((cy-p['lat'])*111320,1)]
 features=[];peaks=[];forests=[];ways={el['id']:el for el in data['elements'] if el['type']=='way'}
 for el in data['elements']:
  tags=el.get('tags',{});geo=el.get('geometry',[])
  if el['type']=='node' and tags.get('natural')=='peak':
   peaks.append({'name':tags.get('name:en',tags.get('name','Summit')),'point':local(el),'elevation':tags.get('ele')});continue
  if el['type']=='relation':
   for m in el.get('members',[]):
    if m['type']=='way' and 'geometry' in m:
     if m['ref'] in ways:
      for k,v in tags.items():ways[m['ref']]['tags'].setdefault(k,v)
     else:ways[m['ref']]={'id':m['ref'],'type':'way','tags':tags,'geometry':m['geometry']}
 for el in ways.values():
  tags=el.get('tags',{});geo=el.get('geometry',[])
  if len(geo)<2:continue
  pts=[local(p) for p in geo]
  if tags.get('natural')=='wood' or tags.get('landuse')=='forest':forests.append(pts);continue
  if tags.get('landuse')=='winter_sports' or tags.get('aerialway') in ['station','pylon','goods']:continue
  kind='lift' if 'aerialway' in tags else 'trail'
  if kind=='lift' and (tags.get('disused')=='yes' or tags.get('abandoned')=='yes'):continue
  features.append({'id':el['id'],'kind':kind,'name':tags.get('name:en',tags.get('piste:name',tags.get('name',tags.get('ref','')))),'difficulty':tags.get('piste:difficulty','unknown'),'type':tags.get('aerialway',tags.get('piste:type','downhill')),'area':tags.get('area')=='yes','access':tags.get('access',''),'proposed':any(k.startswith('proposed:') or k.startswith('construction:') for k in tags) or tags.get('construction')=='yes','points':pts})
 # All terrain and trail geometry share the same local metric projection.
 x0,y0=pixel(w,n);x1,y1=pixel(e,s);tiles={}
 coords=[(x,y) for x in range(int(x0)//256,int(x1)//256+1) for y in range(int(y0)//256,int(y1)//256+1)]
 def tile(xy):
  x,y=xy;p=CACHE/f'13-{x}-{y}.png'
  if not p.exists():p.write_bytes(download(f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/13/{x}/{y}.png'))
  return xy,Image.open(p).convert('RGB').load()
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  for xy,img in pool.map(tile,coords):tiles[xy]=img
 N=257;heights=[]
 def elevation(px,py):
  ix=int(px);iy=int(py);tx,ty=ix//256,iy//256;r,g,b=tiles[(tx,ty)][ix%256,iy%256];return r*256+g+b/256-32768
 for j in range(N):
  lat=n-(n-s)*j/(N-1)
  for i in range(N):
   lon=w+(e-w)*i/(N-1);px,py=pixel(lon,lat);ix=int(px);iy=int(py);u=px-ix;v=py-iy
   # Pixel-center interpolation. Extra edge pixels stay within the fetched tiles.
   value=elevation(ix,iy)*(1-u)*(1-v)+elevation(ix+1,iy)*u*(1-v)+elevation(ix,iy+1)*(1-u)*v+elevation(ix+1,iy+1)*u*v
   heights.append(round(value,1))
 output={'id':site,'bbox':list(bbox),'center':[cx,cy],'width':round(width,2),'depth':round(depth,2),'gridSize':N,'heights':heights,'features':features,'peaks':peaks,'forests':forests,'source':{'terrain':'Mapzen Terrain Tiles / AWS Open Data','terrainAttribution':AT,'terrainZoom':13,'osm':'© OpenStreetMap contributors','osmLicense':'https://www.openstreetmap.org/copyright','osmTimestamp':data.get('osm3s',{}).get('timestamp_osm_base'),'osmExtractionNote':data.get('extractionNote','Full bounded OSM extract'),'downloadedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'sampleSpacingMeters':[round(width/(N-1),1),round(depth/(N-1),1)]}}
 path.write_text(json.dumps(output,separators=(',',':')))
 print(site,'trails',sum(f['kind']=='trail' for f in features),'lifts',sum(f['kind']=='lift' for f in features),'peaks',len(peaks),'range',round(min(heights)),round(max(heights)),'time',round(time.time()-start),flush=True)
if __name__=='__main__':
 import sys
 for site in sys.argv[1:] or SITES:
  try:build(site,SITES[site])
  except Exception as ex:print(site,'ERROR',str(ex),flush=True)
