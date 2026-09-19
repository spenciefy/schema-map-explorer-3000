"""Build the Iwanai GSI pilot. Run: uv run --with pillow --with numpy scripts/build-iwanai-gsi.py
Tiles: https://maps.gsi.go.jp/development/ichiran.html (attribution-only category 2).
Preserves mapped OSM geometry. Grid resolution is deliberately bounded for phones.
"""
import concurrent.futures, io, json, math, urllib.request, urllib.error
from pathlib import Path
from datetime import datetime, timezone
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'research/geodata-cache/gsi'
CACHE.mkdir(parents=True, exist_ok=True)
SOURCE = 'https://maps.gsi.go.jp/development/ichiran.html'

def pixel(lon, lat, zoom):
    size = 256 * 2**zoom
    return (lon + 180) / 360 * size, (1 - np.arcsinh(np.tan(np.radians(lat))) / math.pi) / 2 * size

def decode(rgb):
    v = rgb.astype(np.int32)
    value = v[..., 0] * 65536 + v[..., 1] * 256 + v[..., 2]
    return np.where(value == 8388608, np.nan, np.where(value > 8388608, value - 16777216, value) * .01)

def tile(layer, z, x, y):
    ext = 'jpg' if layer == 'seamlessphoto' else 'png'
    path = CACHE / f'{layer}-{z}-{x}-{y}.{ext}'
    if not path.exists():
        try:
            with urllib.request.urlopen(f'https://cyberjapandata.gsi.go.jp/xyz/{layer}/{z}/{x}/{y}.{ext}', timeout=30) as response:
                path.write_bytes(response.read())
        except urllib.error.HTTPError as error:
            if error.code == 404: return None
            raise
    return np.array(Image.open(path).convert('RGB'))

def mosaic(layer, z, bbox):
    s,w,n,e = bbox
    x0,y0 = pixel(w,n,z); x1,y1 = pixel(e,s,z)
    left,top,right,bottom = int(x0)//256,int(y0)//256,int(x1)//256,int(y1)//256
    jobs = [(x,y) for y in range(top,bottom+1) for x in range(left,right+1)]
    image = np.full(((bottom-top+1)*256,(right-left+1)*256,3), [128,0,0],dtype=np.uint8)
    found = 0
    def fetch(xy): return xy,tile(layer,z,*xy)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for (x,y),data in pool.map(fetch,jobs):
            if data is not None:
                image[(y-top)*256:(y-top+1)*256,(x-left)*256:(x-left+1)*256] = data
                found += 1
    return image,left*256,top*256,{'availableTiles':found,'requestedTiles':len(jobs),'zoom':z}

def build():
    path = ROOT / 'public/geodata/iwanai.json'
    data = json.loads(path.read_text()); bbox = data['bbox']; s,w,n,e = bbox
    coverage = {}
    # Probe every intersecting 5m tile rather than assuming coverage from the catalog.
    for layer in ['dem5a_png','dem5b_png','dem5c_png']:
        _,_,_,coverage[layer] = mosaic(layer,15,bbox)
    dem,left,top,coverage['dem_png'] = mosaic('dem_png',14,bbox)
    grid = data['gridSize']; values = decode(dem)
    xs,_ = pixel(np.linspace(w,e,grid),n,14)
    _,ys = pixel(w,np.linspace(n,s,grid),14)
    # Tile values are pixel samples; bilinear interpolation excludes nodata.
    xs -= left; ys -= top
    xi = np.floor(xs).astype(int); yi = np.floor(ys).astype(int)
    tx = xs-xi; ty = ys-yi
    result = np.zeros((grid,grid)); weight = np.zeros_like(result)
    for dx,dy in [(0,0),(1,0),(0,1),(1,1)]:
        heights = values[(yi+dy)[:,None],(xi+dx)[None,:]]
        weights = (ty if dy else 1-ty)[:,None]*(tx if dx else 1-tx)[None,:]
        valid = np.isfinite(heights)
        result += np.where(valid,heights,0)*weights
        weight += valid*weights
    missing = weight == 0
    assert (~missing).mean() > .85, "GSI coverage decreased; inspect before rebuilding"
    # Ocean has no DEM. Keep explicitly recorded original terrain fallback for nodata.
    backup = CACHE / 'iwanai-original.json'
    if not backup.exists(): backup.write_text(path.read_text())
    original = json.loads(backup.read_text())
    result = np.where(missing,np.array(original['heights']).reshape(grid,grid),result/np.maximum(weight,1e-12))
    data['heights'] = np.round(result,2).ravel().tolist()
    photo,left,top,coverage['seamlessphoto'] = mosaic('seamlessphoto',16,bbox)
    assert coverage['seamlessphoto']['availableTiles'] == coverage['seamlessphoto']['requestedTiles'], 'Incomplete photography'
    # Resample Web Mercator imagery into the mesh's linear longitude/latitude UVs.
    size = 4096
    image = Image.fromarray(photo)
    x0,_ = pixel(w,n,16); x1,_ = pixel(e,n,16)
    output = Image.new('RGB',(size,size))
    for row in range(size):
        lat0=n-(n-s)*row/size; lat1=n-(n-s)*(row+1)/size
        _,y0=pixel(w,lat0,16); _,y1=pixel(w,lat1,16)
        strip=image.transform((size,1),Image.Transform.EXTENT,(x0-left,y0-top,x1-left,y1-top),Image.Resampling.BILINEAR)
        output.paste(strip,(0,row))
    photo_dir=ROOT/'public/imagery'; photo_dir.mkdir(exist_ok=True)
    output.save(photo_dir/'iwanai-gsi.webp',quality=88)
    output.resize((2048,2048),Image.Resampling.LANCZOS).save(photo_dir/'iwanai-gsi-mobile.webp',quality=85)
    data['imagery']={'url':'/imagery/iwanai-gsi.webp','mobileUrl':'/imagery/iwanai-gsi-mobile.webp','attribution':'Created by editing GSI Tiles','sourceUrl':SOURCE,'season':'Aerial photography; not live or winter conditions','projection':'linear longitude/latitude','bbox':bbox}
    data['source'].update({'terrain':'GSI DEM10B (10 m source), resampled; Mapzen fallback at GSI nodata','terrainAttribution':SOURCE,'terrainZoom':14,'terrainDownloadedAt':datetime.now(timezone.utc).isoformat(),'gsiCoverage':coverage,'gsiSamples':int((~missing).sum()),'fallbackSamples':int(missing.sum()),'nativeResolutionMeters':10,'processing':'Created by editing GSI Tiles. Bilinear DEM; original Mapzen used only for nodata. Aerial mosaic reprojected to linear longitude/latitude.'})
    path.write_text(json.dumps(data,separators=(',',':'),ensure_ascii=False))
    print(json.dumps({'coverage':coverage,'gsiSamples':int((~missing).sum()),'fallbackSamples':int(missing.sum()),'heightRange':[float(result.min()),float(result.max())]},indent=2))

if __name__ == '__main__': build()
