"""Read bounded windows of ESA WorldCover 2021 COGs; preserve classified tree cover."""
import math,json,sys,time
from pathlib import Path
import numpy as np
from PIL import Image
import rasterio
from rasterio.windows import from_bounds
from rasterio.enums import Resampling
ROOT=Path(__file__).resolve().parents[1]
for site in sys.argv[1:]:
 p=ROOT/'public/geodata'/f'{site}.json';out=p.with_name(site+'-cover.png')
 try:
  d=json.loads(p.read_text());south,west,north,east=d['bbox'];lat=math.floor(south/3)*3;lon=math.floor(west/3)*3
  # COG windows are mosaicked where a resort crosses a 3-degree tile edge.
  tile=f'{"N" if lat>=0 else "S"}{abs(lat):02d}{"E" if lon>=0 else "W"}{abs(lon):03d}'
  url=f'https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_{tile}_Map.tif'
  if not out.exists():
   ar=np.zeros((768,768),dtype=np.uint8)
   for tilelat in range(math.floor(south/3)*3, math.floor(north/3)*3+1,3):
    for tilelon in range(math.floor(west/3)*3, math.floor(east/3)*3+1,3):
     tile=f'{"N" if tilelat>=0 else "S"}{abs(tilelat):02d}{"E" if tilelon>=0 else "W"}{abs(tilelon):03d}'
     url=f'https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_{tile}_Map.tif'
     sw=max(west,tilelon);se=min(east,tilelon+3);ss=max(south,tilelat);sn=min(north,tilelat+3)
     x0=round((sw-west)/(east-west)*768);x1=round((se-west)/(east-west)*768);y0=round((north-sn)/(north-south)*768);y1=round((north-ss)/(north-south)*768)
     if x1<=x0 or y1<=y0:continue
     with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN='EMPTY_DIR',CPL_VSIL_CURL_ALLOWED_EXTENSIONS='.tif',GDAL_HTTP_TIMEOUT='45',GDAL_HTTP_MAX_RETRY='2'):
      with rasterio.open(url) as src:
       ar[y0:y1,x0:x1]=src.read(1,window=from_bounds(sw,ss,se,sn,src.transform),out_shape=(y1-y0,x1-x0),resampling=Resampling.nearest)
   Image.fromarray(ar).save(out)
   print(site,'tree cover',round(float(np.mean(ar==10))*100,1),'%',flush=True)
  else:print(site,'cached',flush=True)
  d['landcover']=f'/geodata/{site}-cover.png';d['source']['landcover']='ESA WorldCover 2021 v200 · CC BY 4.0';d['source']['landcoverUrl']='https://doi.org/10.5281/zenodo.7254221';p.write_text(json.dumps(d,separators=(',',':')))
 except Exception as e:print(site,'ERROR',str(e),flush=True)
