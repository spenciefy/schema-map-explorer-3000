# Ski Map Explorer 3000

A geographic, animated ski-trail atlas: familiar ridgelines, real mapped runs, moving lifts, and a little anticipation of winter.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:5173. `npm run build` checks TypeScript and builds the site. `npm test` checks coordinate orientation, elevation sampling, clipping, source data, and landmark preservation. Node 22.18+ recommended.

## Explore

The landing page is a grid of all 61 mountains, with terrain previews, names and locations. Select a tile to open the animated map. **Mountains** returns to the grid and restores the scroll position. **Explore**, **Saved**, and **Weather** reveal map details on demand. Mountain routes use shareable URL paths (for example `/palisades`).

- Choose one of 61 destinations (53 in North America) across North America, the Alps, and Japan.
- Drag to pan; right-drag to orbit, or choose the visible **Pan / Rotate** mode. One-finger touch follows the selected mode; pinch to zoom. Focus the canvas and use arrow keys to pan. Scroll to zoom. Switch between the oblique trail-map view and overhead view. The compass follows geographic north.
- Search named trails or lifts, select a mapped segment, then **Follow this line** or **Ride this lift**. Drag to leave the guided camera. Proposed and private lifts have no ride action.
- Toggle trails, lifts, names, roads, and lodge/building landmarks. **Lodges & stops** searches mapped lodges, restaurants, and accommodation; selecting a place flies to it and provides Google Maps and original OSM links. Open the resort's official trail map alongside the model.
- Filter destinations by Ikon/Epic, save mountains locally, and find the snowiest destination within your filters.
- Scrub the weather timeline, pause animation, or enable synthesized wind ambience. Reduced-motion preferences stop ambient animation; a deliberate ride/play action enables motion.

## Geography and visual references

This edition replaces the first prototype's invented mountains with metric geographic data. [Trail-map study](../research/TRAIL-MAP-STUDY.md) records visual inspection of the official Powder Mountain, Palisades Tahoe, Jackson Hole, Whistler Blackcomb, Revelstoke, Park City, and Niseko maps. The original artwork is reference material, not an app texture.

- **Elevation:** Mapzen Terrain Tiles (Terrarium, zoom 13), resampled into a 257 × 257 heightfield for each geographic window. Native source resolution varies. Coordinates use a local equirectangular metric projection; horizontal and vertical units share a 1:1 scale. It is not survey-grade terrain.
- **Trails and lifts:** downloaded OpenStreetMap way geometry, with names, difficulty, access, and proposed/construction tags. Routes are draped over the elevation grid and clipped at the window edge without connecting separated fragments. Counts are distinct names inside the sector, not official resort totals.
- **Forest:** ESA WorldCover 2021 v200 tree cover, supplemented with available OSM forest polygons. Tree symbols and trail clearing widths are illustrative. The classifications are historical land cover, not current snow or vegetation observations.
- **Animation:** skiers, cabins, snow cover, and daylight are interpretive; no live lift operations or skier tracking.

Community mapping can be incomplete or differ from the official map. Some runs consist of several OSM ways; the browser chooses one segment per name/difficulty and reports **segment** length and endpoint elevation difference, not complete run statistics. The current data snapshot primarily uses tagged ways; relation-only metadata may be missing. The extractor now requests relation members for future refreshes. Painted ski maps often rearrange perspectives to reveal hidden slopes; this model retains real geometry and reveals them by orbiting.

Coverage is generally a geographic window. Alta, Snowbird, and Breckenridge additionally clip trail/lift geometry to sourced OSM ski-area polygons to avoid presenting neighboring resort networks as their own. Reapply these after rebuilding their terrain JSON with `uv run --with shapely python scripts/apply-resort-boundaries.py`; the source boundary extracts are retained in the research cache. Roads, buildings, and terrain retain the wider geographic context. Palisades includes Olympic Valley, Alpine Meadows, and the complete mapped Base to Base connection, Chamonix Brévent–Flégère, Hakuba the central/Happo-One area, and the larger European domains selected sectors. Park City’s window includes neighboring terrain and is labeled accordingly. Every destination links to its official source.

## Weather and passes

**Winter demo** is an explicitly labeled imagined snowy weekend. **Live forecast** fetches current Open-Meteo modeled temperature, snowfall, wind, and cloud cover at the listed forecast elevation. Totals sum the first 72 hourly snowfall intervals, including the current hour; these are forecasts, not resort-reported snowfall observations. The slider uses resort-local time. Responses are cached for 15 minutes in memory. Failed/incomplete requests show unavailable values and a retry rather than demo values.

Pass filters indicate destination partnerships, not a guarantee of access for a particular season or pass tier. Dates, reservations, and restrictions are not modeled.

## Roads and lodge landmarks

OSM road centerlines and building footprints are included for all 61 destinations. Roads follow the DEM; tracks use dashed lines. Road width is stylized, buildings use an illustrative 6 m extrusion, and point landmarks use small roof symbols. Road geometry is not a guarantee of winter vehicle access. Hospitality classifications distinguish lodges, dining, and lodging; access tags are preserved where supplied. Names and coverage depend on community mapping.

Powder Mountain's Hidden Lake, Timberline, and Sundown lodge names were checked against its [official lodge page](https://powdermountain.com/lodges-and-dinning); OSM positions agree within 100 m of that page's linked Google Maps locations. Google Maps is an external reference, not the source of the rendered geometry or imagery. Other resort POIs have not been individually verified against official listings.

Regenerate this layer with `python3 scripts/build-places.py` (all destinations), or pass destination IDs. It caches bounded OSM requests and records the snapshot timestamp. Remove the relevant `research/geodata-cache/*-places.json` to intentionally refresh.

## Rebuilding geographic data

Static geographic extracts are served from `public/geodata/`, so no runtime map key or Overpass request is needed. Each JSON includes bounds, timestamps, projection dimensions, and source metadata. The derived OSM geometry is available through the in-app download link.

```sh
# Remove a destination's generated JSON and corresponding research/geodata-cache/*-osm.json
# only when intentionally refreshing it; the builder otherwise reuses cached files.
uv run --with pillow python scripts/build-geodata.py powder
uv run --with rasterio --with pillow python scripts/build-landcover.py powder
```

Use the destination IDs in `scripts/build-geodata.py`. Omit IDs from the terrain builder for all destinations. Refresh conservatively: Overpass is a shared, rate-limited service. `enrich-forests.py` optionally retrieves multipolygon forest geometry; land cover is the main forest source. Rebuilding a DEM JSON replaces its enrichment, so regenerate land cover afterward.

## Sources and licensing

- Trail/lift/forest geometry: [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright), Open Database License (ODbL). Derived JSON is distributed in `public/geodata/` under the applicable source terms.
- Elevation: [Mapzen Terrain Tiles / AWS Open Data](https://registry.opendata.aws/terrain-tiles/), with [underlying DEM attribution and licenses](https://github.com/tilezen/joerd/blob/master/docs/attribution.md).
- Land cover: [ESA WorldCover 2021 v200](https://doi.org/10.5281/zenodo.7254221), CC BY 4.0; classification is cropped/resampled into a local PNG.
- Weather: [Open-Meteo](https://open-meteo.com/en/docs), CC BY 4.0.
- Pass information: [Ikon](https://www.ikonpass.com/en/destinations), [Epic](https://www.epicpass.com/regions.aspx).
- Barlow Condensed and Manrope fonts served by Google Fonts.

## Implementation and checks

Vite, TypeScript, and Three.js. `scene.ts` owns terrain, actors, cameras, and labels; `geography.ts` defines coordinate sampling/clipping; `weather.ts` validates forecasts; `main.ts` owns UI state. Terrain and trees are GPU meshes/instances; paths use source coordinates.

Validated: the original 60 destination models load; Iwanai was subsequently checked with its full terrain view and single double chair; landmark search and route selection; guided lift camera; layer visibility; overhead view; desktop/mobile layout; and geographic unit/data checks. Build passes, with a size advisory for the Three.js vendor chunk. The preceding weather prototype was also checked with a real API response and an intercepted failure/retry. This is an exploratory art prototype, not an official resort trail map.

### Lift and mountain detail pass

`mountain-models.ts` builds instanced seat-count-specific chairs, enclosed gondolas, twin-hanger funitels, reciprocal tram cabins, surface lift symbols, branched conifers, and equipped skiers/snowboarders. Riders advance by integrated distance using slope, personal pace, and turn phase; pause freezes motion. Alta and Deer Valley have skiers only. Small objects are enlarged cartographic symbols, not survey-scale assets.

Run `python3 scripts/enrich-lifts.py` after rebuilding geographic extracts. It preserves OSM `aerialway:occupancy` (people per carrier, never `aerialway:capacity`, which is people/hour), mixed-lift capacities, detachable tags, and linked research overrides. All mapped aerial lifts on Northstar, Alta, Snowbird, Breckenridge, Arapahoe Basin and Palisades/Alpine have sourced capacities. Two other active records remain unresolved: Hakuba Jumping Stadium Chair and an unnamed Verbier cableway. Unresolved records have no invented carriers. Legacy Noah and Cabriolet alignments are marked retired, with replacement notes; replacement geometry is not invented. Source completeness and currency still depend on the underlying mapping.

`python3 scripts/enrich-lift-supports.py` matches OSM pylons/stations by way node membership, with sub-meter geometric matching for older extracts without node IDs. Tower heights, terminal shapes, and sag remain illustrative; gaps use regular spacing. Mapped bend coordinates are retained. Carrier count, travel speed, and spacing are illustrative, not operational telemetry.

Palisades' field guide has direct links to Palisades, Alpine Meadows and Base to Base. Alpine's official 2025/26 frontside map was visually studied. The larger DEM, forest raster, roads, buildings and places all share the expanded extent.

### Minimal collection view

The brand heading, taglines, descriptive introductions, decorative captions and repeated source prose were removed in favor of the mountain grid and essential controls. Source/accuracy details remain under Sources. The full WebGL scene is created only after selecting a mountain, and rendering is suspended while viewing the grid.

Generate all previews from the actual AtlasScene models with `node scripts/render-previews.mjs` while Vite runs on port 5173. The grid uses these static renders to avoid 61 concurrent WebGL scenes; selecting a mountain opens the full interactive version.

### Western expansion

The collection includes 42 additional western US and Canadian destinations across Ikon, Epic, and independent resorts. [Expansion source notes](../research/WESTERN-EXPANSION.md) lists the selection and official references. `research/western-resorts.json` is the source manifest; `scripts/sync-western-catalog.py` generates the typed catalog only after geographic layers exist.

```sh
# Bounded direct OSM Map API fallback when Overpass is unavailable:
python3 scripts/fetch-osm-map.py mammoth
uv run --with pillow python scripts/build-geodata.py mammoth
python3 scripts/build-places.py mammoth
uv run --with rasterio --with pillow python scripts/build-landcover.py mammoth
uv run --with shapely python scripts/enrich-western-resorts.py
python3 scripts/enrich-lifts.py
node scripts/render-previews.mjs --western
python3 scripts/sync-western-catalog.py
```

The western enrichment retains mapped lift supports and applies complete ski-area boundaries where available, separating adjacent Aspen and Cottonwood networks. Incomplete sector boundaries do not trim away the rest of a resort. Wider terrain, roads, and buildings remain visible. Some source extracts lack mapped pylons, so those lifts retain illustrative support spacing. Direct Map API extracts record retrieval time rather than a replication timestamp. Lift-table overrides and their source links are retained in `research/lift-table-overrides.json`; the underlying Vail, Beaver Creek, and Heavenly table extracts are in `research/lift-source-tables/`.

### Interaction checks

Run `node scripts/check-interactions.mjs` with the dev server on port 5173 and Chrome installed. Checks cover panning, URL consistency when filtering, panel focus restoration, pause/resume, live reduced-motion changes, rapid navigation, malformed hashes, and mobile overflow. Camera easing uses elapsed time, skiers ease into route endpoints, and panels use brief motion with reduced-motion alternatives. Saved mountains migrate from the original local storage key.

### Rider settings

Settings beside Weather controls skiers and snowboarders independently. Default rider scale is 0.22 scene units, with small individual variation; size ranges from 0.5× to 2× and speed from still to 3×. These remain cartographic figures rather than survey-scale people. Equipment clearance is recomputed at the selected size. Zero speed freezes turning as well as position. Global pause and reduced motion continue to take precedence. Alta and Deer Valley retain their skiers-only policy. Preferences persist locally; Reset defaults restores both groups. Run `node scripts/check-rider-settings.mjs` with the dev server to verify the panel and rendered state.

### Mobile touch pass

One-finger drag follows Pan / Rotate; two-finger drag and pinch always use combined pan/zoom. Drag and multi-pointer sequences suppress accidental route selection. `node scripts/check-mobile.mjs` checks real dispatched touch events at 320×568, 390×844, 844×390 and 820×1180 in emulated Chrome, including panels and viewport bounds. These checks do not substitute for physical iOS/Android device verification.
