# Raw map data (downloaded 2026-10-01)

All files here are unmodified copies from repositories released under **The Unlicense** (SPDX `Unlicense`, public-domain dedication). A copy of each repo's `LICENSE` is saved next to its files.

| File(s) | Source | Commit | Licence |
|---|---|---|---|
| `rdomap_singleplayer.json`, `rdomap_discoverables.json`, `rdomap_fasttravels.json` | https://github.com/jeanropke/RDOMap (`data/`) | `922daf072c3ea027c5d5ed097173ce66d70d65b6` | `rdomap_LICENSE` (Unlicense) |
| `rdomap_shops.json`, `rdomap_interiors.json` (added 2026-10-01 for place-name labels) | https://github.com/jeanropke/RDOMap (`data/`) | `922daf072c3ea027c5d5ed097173ce66d70d65b6` | `rdomap_LICENSE` (Unlicense) |
| `collectorsmap_geojson/*.json` (road/trail + railroad LineStrings) | https://github.com/jeanropke/RDR2CollectorsMap (`data/geojson/`) | `bd9e913bc971842b2929b5cbc9c5c809ba717c38` | `collectorsmap_LICENSE` (Unlicense) |

Coordinates are Leaflet map space, not game space. Convert them with the constants from RDOMap `assets/js/map.js` (`gameToMap`):
`gameX = (lng - 111.29) / 0.01552`, `gameY = (lat + 63.6) / 0.01552`.
In `singleplayer.json` and `fasttravels.json`, the field `x` holds lat and `y` holds lng. GeoJSON coordinates are `[lng, lat]`.

No map imagery or tiles are stored here. Rockstar's map art is not covered by these licences.

These files are used by `../maps.json` as follows. Set `labels` comes from the discoverables `text` group, the shops `wardrobe` entries and 9 interiors. Set `graves` comes from the discoverables `grave` group. `../pin-links.json` uses the same label positions.

Not saved here: the0neWhoKnocks/red-dead-redemption-2-map. The repo is MIT, but its markers appear to be copied from IGN's map, so we rejected it.
