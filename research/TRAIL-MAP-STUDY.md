# Trail maps as living landscapes

## Direction

Replace the earlier generic miniature mountain atlas with individually explorable geographic mountain maps. Real terrain, geographic runs and lifts, and recognizable landmarks are the foundation. Use an oblique panoramic camera and painted-map visual hierarchy. Tree symbols, snow treatment and moving people remain interpretive.

## Maps visually inspected

Local research copies are in `research/trail-maps/`; they are reference material, not application textures.

- **Powder Mountain, 2025/26:** [official source](https://powdermountain.com/trail-map). The main view unfolds the terrain around Hidden Lake and Paradise, with Sundown to the right, Cobabe Canyon to the left, and Lightning Ridge / James Peak in the foreground. The branching canyon geography and forested ridges are the identity—not a single conical summit. The artwork distinguishes resident-only lifts and the DMI construction area. Implementation preserves private/proposed source flags.
- **Palisades, current downloadable main map:** [official source](https://www.palisadestahoe.com/mountain-information/trail-maps). A blue-sky panorama presents KT-22 left of the main upper-mountain complex; the Funitel and Tram connect the valley with the higher terrain, with Granite Chief to the right. Ski clearings are bright negative space in dark forest. Other faces use inset maps; a single unwarped camera cannot expose all of them simultaneously.
- **Jackson Hole, 2025/26:** [official source](https://www.jacksonhole.com/maps/mountain-winter). Rendezvous Mountain anchors the upper left; the long Tram line gives a sense of vertical; Après Vous stands apart on the right. The valley-to-ridgeline sweep and named bowls are the composition. Blue shadows, dark trees, and red lifts make steep terrain legible.
- **Whistler Blackcomb, 2025/26:** [official source](https://www.whistlerblackcomb.com/the-mountain/about-the-mountain/trail-maps.aspx). Blackcomb and Whistler are separate mountain systems linked by Peak 2 Peak across the valley. Preserve the twin-mountain relationship. The printed panorama deliberately reveals terrain from multiple orientations; our orbiting camera keeps the real geography instead of physically warping it to fit the painting.
- **Revelstoke, 2025/26:** [official source](https://www.revelstokemountainresort.com/discover/about/trail-maps/). A tall, continuous mountainside from the village to Mount Mackenzie. Revelation, Stoke, Ripper, and the winding Last Spike organize a memorable day. North Bowl and Stellar are separately explained by insets. Expanded our initial DEM window to include Mount Mackenzie rather than crop the summit.
- **Park City, 2024/25 reference:** [official source](https://www.parkcitymountain.com/the-mountain/about-the-mountain/trail-map.aspx). A broad sequence of peaks and lift pods, tied together by traverses and the Quicksilver connection. Older map used for visual structure, not to claim current operations. The downloaded geographic window includes neighboring terrain; coverage is explicitly labeled.
- **Niseko United, 2026/27:** [official source](https://www.niseko.ne.jp/en/map/). Four resort bases fan around Annupuri. A broad shared summit, separate lift ladders, forested intermediate slopes, and the four identities matter. The Japanese map uses red intermediate runs; regional color conventions should remain distinguishable.

## Data decisions

- DEM: Mapzen Terrain Tiles from AWS, Terrarium z13. Local metric projection uses the same horizontal scale in x/z and elevation. No vertical exaggeration.
- Trail / lift geometry: bounded OpenStreetMap extracts. Their exact provided coordinates are rendered against the DEM. Long segments are sampled to follow terrain. This is community data, not a digitization certified by the resort.
- Names and permissions: preserve source names, private access, and proposed lift flags. Never turn a proposed/private lift into a suggested public route.
- Trees: use available geographic land cover and illustrate individual tree symbols; individual trees are not surveyed objects.
- Runs can be segmented in OSM. Display segment length / endpoint elevation change, not an invented full-run length. Counts refer to names within the loaded sector.
- Coverage labels disclose selected sectors for large domains (Chamonix, Hakuba, Dolomiti Superski, Zermatt).
- Keep a direct official-map link in every mountain view. The original painted maps remain the authority for the resort's named terrain and access presentation.

## Interaction

Select a mountain → pan the real relief → search a familiar trail/lift → highlight its mapped line → ride/follow that segment. A top-down option makes geographic orientation inspectable; the panorama is the emotional entry point. Layer controls remove labels or colored lines for an uncluttered mountain view.

## Added destinations

- Northstar California: official 2025/26 PDF reference linked from the resort trail-map page. Mt. Pluto, Lookout Mountain, the Backside, and Big Springs inform the selected extent and camera. Local PDF download returned an HTML error; reference content was available through web retrieval.
- Alta: visually inspected the official 2025/26 map. Supreme sits left, Sugarloaf central, and Collins / Wildcat right; Devil’s Castle, Sugarloaf, and Baldy form the skyline. The two base areas follow Little Cottonwood Canyon. Rendered trail/lift data is clipped to the OSM Alta polygon.
- Snowbird: official winter-map page linked; the terrain window includes Gad Valley, Peruvian Gulch and Mineral Basin. Its official page did not expose a usable static map in this retrieval. Trail/lift geometry is clipped to the OSM Snowbird polygon, independently of Alta.
- Breckenridge: official 2025/26 map reference linked from the resort trail-map page. Extent covers Peaks 6–10 and the town, viewed from the east. Source OSM ski-area polygon removes Copper Mountain trails/lifts in the same DEM window. Local PDF download returned an HTML error; web retrieval supplied map content.
- Arapahoe Basin: visually inspected the official 2025 winter map. East Wall anchors the frontside left; Pallavicini and the Beavers lie right; Montezuma Bowl appears in its own reverse-facing inset. All fit the real geographic extent, with orbiting revealing the backside.

Pass partnerships checked against official Ikon compare/access pages and Epic resort directory: Northstar and Breckenridge Epic; Alta, Snowbird, and A-Basin Ikon. These remain partnership filters, not promises of pass-tier access. New snow totals are winter-demo fixtures; live forecast mode fetches modeled data for all eleven North American destinations.

## Alpine Meadows and lift detail, September 2026

Visually reviewed Alpine's official 2025/26 frontside map: https://www.palisadestahoe.com/-/media/palisades-tahoe/pdfs/trail-maps/alpine-front-side-trail.pdf?rev=d16a1e2f47a24af8991e4924d5f4f7d2 . Reference includes Summit, Roundhouse, Treeline Cirque, Scott, Lakeview, Sherwood connection, base lodge and Base to Base. Expanded geographic window to 39.130–39.225 N / 120.300–120.200 W and regenerated every geographic layer.

Palisades capacities: official resort explains 28-person Funitel with two roof arms, 8-person Base to Base, and tram capacity of 85 with ski equipment / 110 without: https://blog.palisadestahoe.com/experiences/tram-funitel-gondola-whats-the-difference/ . Our animation represents a winter scene and uses 85 for the tram. Seat counts elsewhere are linked individually in each lift record; community mapping is not a certification of current operation.

Source-gap audit is reproducible in `scripts/enrich-lifts.py` and `research/lift-capacity-gaps.json`. OSM Noah still uses a Bing 2014 alignment even though the operator documents a parallel 2024 replacement; Cabriolet likewise remains in OSM after its retirement. These are visibly retired and not animated. Do not substitute modern cabins onto obsolete alignments or silently call either replacement mapped.

Actual OSM support coordinates are in each feature's `supports` array with node IDs. Height, sheave details, stations and cable sag are artistic approximations. Conifers are branched symbols distributed by forest classification, not surveyed species or individual tree locations.
