# Geographic source attribution

Trail, lift, peak, forest, road, building footprint, and hospitality landmark vector data: © OpenStreetMap contributors, https://www.openstreetmap.org/copyright — Open Database License (ODbL). The derived vectors are distributed in the destination JSON files in this directory. Each contains source timestamps and geographic bounds.

Terrain: Mapzen Terrain Tiles / AWS Open Data, https://registry.opendata.aws/terrain-tiles/ . Underlying elevation sources, licenses, and required attribution: https://github.com/tilezen/joerd/blob/master/docs/attribution.md . Terrarium elevation was decoded and resampled to a 257 × 257 geographic grid per destination.

Land cover: ESA WorldCover 2021 v200, https://doi.org/10.5281/zenodo.7254221 — CC BY 4.0. Native 10 m classification tiles were cropped/mosaicked and resampled to the supplied PNGs. Tree cover is class 10. Not a snow-cover dataset.

Official resort trail-map artwork is not included in these served files. Consult the resort for official maps and operational information.

Lift occupancy is retained from OSM per-car tags, with individually linked researched overrides in `capacitySource`. Support nodes are derived from OSM under ODbL. Lift tower heights and animation are illustrative. Palisades now includes Alpine Meadows. Retired alignments are flagged; see `research/lift-capacity-gaps.json` for unresolved active records.
