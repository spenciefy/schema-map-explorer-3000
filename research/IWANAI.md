# Iwanai · Hokkaido

The geographic window includes Mount Iwanai (OSM summit: 42.9230963 N, 140.5124010 E, 1,085 m), its north-facing slopes, the base area and neighboring ridges. The default camera frames the terrain, not just the small lift network. Terrain samples are approximately 21 × 19 m; this is not survey-grade or a navigation map.

## References

- [Official chairlift and illustrated map](https://iwanairesort.com/en/lift/iwanai), inspected September 19, 2026: one Center Pair Lift, 700 m, and three courses A/B/C. The illustration labels the summit 1,086 m.
- [Official CAT terrain](https://iwanairesort.com/en/terrain-niseko): guided access through former courses, forests and glades; upper access varies with conditions.
- [OSM chair geometry](https://www.openstreetmap.org/way/1030295081): one active two-seat chair with twelve mapped support nodes. Disused upper lifts are excluded.
- Terrain: Mapzen Terrarium elevation tiles. Forest footprint: ESA WorldCover 2021. Trails, roads, building footprints and hospitality places: bounded OpenStreetMap Map API extract, attribution retained in the asset.

Six mapped downhill segments include A/B/C and unnamed geometry. These are not six verified operating courses. CAT routes and pickup/drop-off points are not invented from the painted reference. The summit and surrounding terrain remain explorable without implying public ski access. Resort instructions prohibit hiking uphill from the chairlift top.

The current map uses the existing Hokkaido birch/fir vegetation palette. Individual trees and wildlife are illustrative.

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
