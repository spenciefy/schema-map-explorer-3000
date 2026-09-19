# Iwanai · Hokkaido

The geographic window includes Mount Iwanai (OSM summit: 42.9230963 N, 140.5124010 E, 1,085 m), its north-facing slopes, the base area and neighboring ridges. The default camera frames the terrain, not just the small lift network. Terrain samples are approximately 13 × 18 m; this is not survey-grade or a navigation map.

## References

- [Official chairlift and illustrated map](https://iwanairesort.com/en/lift/iwanai), inspected September 19, 2026: one Center Pair Lift, 700 m, and three courses A/B/C. The illustration labels the summit 1,086 m.
- [Official CAT terrain](https://iwanairesort.com/en/terrain-niseko): guided access through former courses, forests and glades; upper access varies with conditions.
- [OSM chair geometry](https://www.openstreetmap.org/way/1030295081): one active two-seat chair with twelve mapped support nodes. Disused upper lifts are excluded.
- Terrain: Mapzen Terrarium elevation tiles. Forest footprint: ESA WorldCover 2021. Trails, roads, building footprints and hospitality places: bounded OpenStreetMap Map API extract, attribution retained in the asset.

Six mapped downhill segments include A/B/C and unnamed geometry. These are not six verified operating courses. CAT routes and pickup/drop-off points are not invented from the painted reference. The summit and surrounding terrain remain explorable without implying public ski access. Resort instructions prohibit hiking uphill from the chairlift top.

The current map uses a denser Iwanai-specific winter birch/fir vegetation profile. Individual trees and wildlife are illustrative.

## Rebuild

Coverage is defined in `terrain-resorts.json`. From the repository root, with Node 22 and uv available:

```sh
python3 scripts/fetch-osm-map.py iwanai
uv run --with pillow python scripts/build-geodata.py iwanai
python3 scripts/build-places.py iwanai
python3 scripts/enrich-lifts.py iwanai
python3 scripts/enrich-lift-supports.py iwanai
uv run --with rasterio --with pillow python scripts/build-landcover.py iwanai
node scripts/render-previews.mjs iwanai
```

The preview step requires the local Vite server. Extraction scripts reuse cached downloads; remove the target generated JSON before intentionally rebuilding its terrain.

## Coastal extent and snowcats

The extraction now extends to 42.995 N, including Iwanai town and the Sea of Japan. A 513 × 513 DEM preserves roughly 13 × 18 m sample spacing over the wider window. Water is rendered at sea level from ESA WorldCover class 80; it is a satellite-classified shoreline, not a surveyed tidal boundary. Source elevation values remain unchanged.

Two stationary passenger snowcats are illustrative models placed in mapped downhill clearings (OSM 1468762438 and course C). They do not represent live vehicle locations or a verified CAT itinerary. [The resort's CAT description](https://iwanairesort.com/en/cat-ski-niseko-japan) confirms passenger CAT access and coastal views.

Lower-slope woodland is denser; upper tree cover still tapers to an open summit, with the illustrative transition ending at 1,020 m. Tree height stays consistent in geographic scale despite the expanded window.


## Usability audit — September 19, 2026

The earlier assertion that no useful access data was online was too broad. The official [Mountain Safety page](https://iwanairesort.com/en/-catski-safety-niseko) contains an [illustrated access map](https://images.squarespace-cdn.com/content/v1/59eac661fe54efb793a14c87/fb0949e1-77b3-4511-a6e6-c35bd787e592/Hikers%2BMap-01.png). It distinguishes terrain restricted to authorized resort/CAT skiing from the public touring side. The page prohibits touring in the CAT zone; the chairlift page prohibits hiking from the top of the chair.

The access illustration is now linked and displayed in an in-app dialog. It is not georeferenced and has not been traced into an asserted 3D boundary. Exact CAT travel paths, pickup points, and condition-dependent operating limits remain unverified. Generic OSM forestry/service tracks must not be relabeled as CAT routes.

Iwanai now opens on the chairlift and named A/B/C courses, with stronger course strokes and course names visible by default. A Mountain button returns to the full coastal extent. Unnamed OSM downhill segments are omitted from the Iwanai scene and rider paths, because they are not among the three officially described lift-served courses. The underlying extract remains unchanged. This is a readability and coverage-disclosure fix, not proof that the map is ready for navigation.
