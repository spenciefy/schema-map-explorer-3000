"""Retain per-car occupancy (never passengers/hour) and explicit source provenance."""
import json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OVERRIDES={
 32781149:{'occupancy':15,'capacitySource':'https://sc.mammothmountain.com/-/media/project/mammoth/library/pdfs/maps/241022_mmsa_trailmap_brochure_web.pdf'},
 104087780:{'occupancy':4,'capacitySource':'https://www.deervalley.com/-/media/deer-valley/media/DeerValleyResortPressKit24-25.pdf'},
 40233630:{'occupancy':2,'capacitySource':'https://liftblog.com/panda-peak-buttermilk-co/'},
 53215560:{'occupancy':3,'capacitySource':'https://liftblog.com/2017/03/20/taos-to-build-new-beginner-lift-pulse-gondola-first-detachable/'},
 130102108:{'occupancy':2,'capacitySource':'https://www.skiresort.info/ski-resort/aspen-mountain/test-result/summary/'},
 48031627:{'chairSeats':6,'cabinOccupancy':8,'capacitySource':'https://liftblog.com/american-eagle-copper-mountain-co-2/'},
 257005477:{'occupancy':4,'capacitySource':'https://liftblog.com/2015/04/10/lift-profile-lewis-clark-at-big-sky-mt/'},
 17117689:{'occupancy':6,'capacitySource':'https://www.fs.usda.gov/Internet/FSE_DOCUMENTS/fseprd569244.pdf'},
 309728747:{'retired':True,'capacityNote':'Legacy Noah alignment. Replaced in 2024 by a 10-person gondola on a different alignment; replacement geometry is not yet mapped here.','capacitySource':'https://iwatake-mountain-resort.com/gondola'},
 31560006:{'retired':True,'occupancy':8,'capacityNote':'Legacy open-air Cabriolet. Replaced by the 10-person Canyons Village Skyway for winter 2026/27; replacement geometry is not yet mapped here.','capacitySource':'https://www.snowboarder.com/news/the-canyons-installs-cabriolet-gondola'},
 1183440386:{'occupancy':10,'capacitySource':'https://www.montblancnaturalresort.com/en/news/new-momentum-for-the-montenvers-site'},
 315744004:{'occupancy':2,'capacitySource':'https://www.town.kutchan.hokkaido.jp/culture-sports/sports-shisetsu/asahigaoka-ski/'},
 967692897:{'occupancy':8,'capacitySource':'https://www.nisekotourism.com/wp-content/uploads/Niseko_Resort_Map_2019-20_en.pdf'},
 207179786:{'occupancy':6,'capacitySource':'https://www.skiresort.com/en/ski-resort/rusutsu/ski-lifts/'},
 207464652:{'occupancy':4,'capacitySource':'https://www.skiresort.com/en/ski-resort/rusutsu/ski-lifts/'},
 282842135:{'occupancy':6,'capacitySource':'https://www.skiresort.com/en/ski-resort/rusutsu/ski-lifts/'},
 217807399:{'occupancy':3,'capacitySource':'https://www.skiresort.info/ski-resort/breventflegere-chamonix/ski-lifts/l88550/'},
 258163806:{'occupancy':6,'capacitySource':'https://www.skiresort.com/en/ski-resort/park-city/ski-lifts/l1917/'},
 10125436:{'occupancy':4,'capacitySource':'https://archive.sltrib.com/article.php?id=57695526&itype=CMSID'},
 1284777346:{'chairSeats':6,'cabinOccupancy':10,'capacityNote':'Hybrid system; cabin phase scheduled for winter 2026/27','capacitySource':'https://verbier4vallees.ch/V4V-Website/Espace-presse/Multimedia/Verbier-Addict-Mag/vam-25-26-fr.pdf'},
 10477161:{'occupancy':85,'capacityNote':'85 with ski equipment; 110 without','capacitySource':'https://blog.palisadestahoe.com/experiences/tram-funitel-gondola-whats-the-difference/'},
 30423428:{'occupancy':28,'type':'funitel','capacitySource':'https://blog.palisadestahoe.com/experiences/tram-funitel-gondola-whats-the-difference/'},
 847810336:{'occupancy':8,'capacitySource':'https://www.palisadestahoe.com/gondola/projects/gondola'},
 967692896:{'chairSeats':6,'cabinOccupancy':8,'capacitySource':'https://nipponcable.com/en/transport/combilift.html'},
}
OVERRIDES.update({int(k):v for k,v in json.loads((ROOT/'research/lift-table-overrides.json').read_text()).items()})
missing=[];known=0
for path in (ROOT/'public/geodata').glob('*.json'):
 if sys.argv[1:] and path.stem not in sys.argv[1:]:continue
 raw=json.loads((ROOT/'research/geodata-cache'/f'{path.stem}-osm.json').read_text());tags={e['id']:e.get('tags',{}) for e in raw['elements'] if e['type']=='way'}
 d=json.loads(path.read_text())
 for f in d['features']:
  if f['kind']!='lift':continue
  t=tags.get(f['id'],{});value=t.get('aerialway:occupancy','')
  if re.fullmatch(r'\d+',value):f['occupancy']=int(value);f['capacitySource']=f"https://www.openstreetmap.org/way/{f['id']}"
  if f['type']=='mixed_lift':
   chair=t.get('aerialway:occupancy:chairlift');cab=t.get('aerialway:occupancy:gondola')
   if value in ['6;8','6/8']:chair,cab='6','8'
   if chair and cab:f.update(chairSeats=int(chair),cabinOccupancy=int(cab),capacitySource=f"https://www.openstreetmap.org/way/{f['id']}")
  if f['type'] in ['platter','j-bar','rope_tow','t-bar']:
   f.setdefault('occupancy',2 if f['type']=='t-bar' else 1);f.setdefault('capacitySource','https://wiki.openstreetmap.org/wiki/Aerialway')
  if t.get('aerialway:detachable'):f['detachable']=t['aerialway:detachable']=='yes'
  f.update(OVERRIDES.get(f['id'],{}))
  if f['type'] in ['chair_lift','gondola','cable_car','mixed_lift','funitel'] and not f.get('retired'):
   ok=(f.get('chairSeats') and f.get('cabinOccupancy')) if f['type']=='mixed_lift' else f.get('occupancy')
   if ok:known+=1
   else:missing.append({'resort':path.stem,'id':f['id'],'name':f['name'],'type':f['type']})
 path.write_text(json.dumps(d,separators=(',',':')))
if not sys.argv[1:]:(ROOT/'research/lift-capacity-gaps.json').write_text(json.dumps(missing,indent=2))
print('Sourced aerial lift segments:',known,'Unresolved:',len(missing));print(json.dumps(missing,indent=2))
