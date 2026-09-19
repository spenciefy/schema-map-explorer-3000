# Resort identity

Station roofs, fascias, sign backgrounds, structure and carrier accents now use `src/resort-identity.ts`. Identity colors are separate from trail difficulty colors. A future per-lift observation can override the resort treatment without changing geometry or capacity.

## Evidence and limits

- **Jackson Hole:** black/red treatment supplied by Spencer. The official [Aerial Tram page](https://www.jacksonhole.com/aerial-tram) also identifies the iconic Big Red tram. This is a resort-wide illustrative treatment, not a verified claim that every terminal has identical paint.
- **Whistler PEAK 2 PEAK:** red carrier accent, supported by the resort's [official group booklet](https://www.whistlerblackcomb.com/-/aemasset/image/upload/whistler-blackcomb/Products/about-the-resort/groups-and-weddings/social-and-leisuregroups/WBRRWGroupsBookletSummer.pdf). Other lifts retain the fallback.
- **Other stations:** blue/steel fallback requested by Spencer. These are not surveyed colors. Do not mark these verified or infer actual terminal paint from a logo.
- Snowbird's [official tram page](https://www.snowbird.com/activities-events/summer-activities/tram/) documents separate red and blue cabins. A paired-carrier paint override is still needed before claiming that detail is modeled.

## Logos

Official assets are stored in `public/resort-logos/`, with source URLs and retrieval dates in `sources.json`. Initial coverage: Jackson Hole, Iwanai, Palisades Tahoe. These remain the respective resorts' trademarks and are used to identify destinations; they are not project branding or evidence of affiliation. The Controls panel links the mark to the resort's official site. No third-party logo service or hotlink is required at runtime.

The remaining resorts still need official assets and lift-specific photo references. No substitute logos have been fabricated.
