# Regional winter ecology

Eight regional palettes add local character without changing the mapped terrain, trails, lifts, roads, or buildings. Forest positions are still constrained by the ESA/OSM forest mask, with trails, roads and buildings cleared. Species mixes, relative density, individual positions and regional elevation thresholds are illustrative—not botanical inventories or surveyed treelines. The regional mapping is intentionally broad; local microclimates and slope aspects are not modeled.

| Palette | Winter silhouettes | Wildlife motif |
| --- | --- | --- |
| Sierra | Pine, fir | Mule deer |
| Coastal ranges | Hemlock, fir | Black-tailed deer |
| Interior western ranges | Spruce, pine, fir | Mule deer |
| Rockies / Intermountain West | Spruce, fir, bare aspen, pine | Elk |
| Alps | Bare larch, stone-pine silhouette, spruce | Chamois |
| Hokkaido | Bare birch, fir | Sika deer |
| Japanese Alps | Bare birch, pine, fir | Japanese serow |
| Alaska | Spruce, hemlock, bare birch | Winter-white snowshoe hare |

Trees shorten and thin through a broad elevation transition; snow-covered woody shrubs occupy scattered forest locations. There are no summer flowers or winter-active marmots. Animals are sparse, stationary miniatures with subtle breathing that respects global pause and reduced motion. Their positions are chosen in mapped forest away from cleared routes, rejecting steep ground. These are artistic encounters, not recorded sightings or wildlife-location guidance. Settings → Local nature shows the palette and toggles wildlife; the preference is saved locally.

## Regional references

Consulted September 19, 2026. Regional references support the motifs, not exact resort-level species coverage or the numerical rendering parameters.

- [NPS Yosemite vegetation and forest communities](https://www.nps.gov/yose/learn/nature/biomass.htm): fir and pine communities; [Yosemite wildlife/species checklist](https://irma.nps.gov/NPSpecies/Reports/SpeciesList/Species%20Checklist/YOSE/5%2C2%2C3%2C1%2C4%2C11/true?action=Index&controller=Home).
- [NPS Mount Rainier plants](https://www.nps.gov/mora/learn/nature/plants.htm): mountain hemlock and subalpine fir; [subalpine meadows and black-tailed deer](https://www.nps.gov/mora/learn/nature/wildflowers.htm).
- [NPS Rocky Mountain subalpine ecosystem](https://www.nps.gov/romo/learn/nature/subalpine_ecosystem.htm), [conifers and wind-sculpted tree islands](https://www.nps.gov/romo/learn/nature/conifers.htm), [montane ecosystem and winter elk](https://www.nps.gov/romo/learn/nature/montane_ecosystem.htm).
- [NPS Yellowstone forests](https://www.nps.gov/yell/learn/nature/forests.htm): interior lodgepole, spruce and fir context.
- [Swiss National Park larch](https://nationalpark.ch/en/flora-and-fauna/larch/), [flora and fauna](https://nationalpark.ch/en/flora-and-fauna/), [chamois in winter and mountain forests](https://nationalpark.ch/en/flora-and-fauna/chamois/).
- [Japan National Tourism Organization: Shikotsu-Toya plants and animals](https://www.japan.travel/national-parks/parks/shikotsu-toya/plants-and-animals/): Hokkaido birch, fir and deer context.
- [Japan National Tourism Organization: Chubusangaku plants and animals](https://www.japan.travel/national-parks/parks/chubusangaku/plants-and-animals/): elevation-dependent birch/conifer communities and Japanese serow.
- [NPS snowshoe hare](https://www.nps.gov/articles/snowshoe-hare.htm): winter coat and boreal forest habitat; [Alaskan distribution](https://www.nps.gov/kova/learn/nature/snowshoe-hare.htm).

## Implementation

`src/ecology.ts` assigns regional profiles using resort metadata. `src/ecology-models.ts` builds instanced tree, shrub and wildlife geometry. Wildlife and shrub counts are bounded; there are no new texture downloads. `tests/ecology.test.mjs` covers all resort assignments, elevation transitions and finite geometry. `node scripts/check-ecology.mjs` exercises representative scenes and the saved wildlife preference with Vite running on port 5173.
