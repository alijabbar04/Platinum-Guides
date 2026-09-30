# Map data and imagery: licence review (2026-10-01)

Licences were checked with `gh api repos/OWNER/REPO/license` and by reading the raw LICENSE files.

## Candidates

| Repo | LICENSE file / SPDX | What it has | Bundle data? | Bundle imagery? |
|---|---|---|---|---|
| jeanropke/RDOMap | `LICENSE`, **Unlicense** | `data/singleplayer.json`: story-mode dino bones (30), dreamcatchers (20), rock carvings (10), graves, orchids, alligator eggs, chests, crayfish holes. `data/discoverables.json`: story overlays (legendary animal and fish icons, text labels for camps and landmarks). `data/fasttravels.json`: 15 settlement fast-travel points. The conversion formula is in `assets/js/map.js`. | **Yes**. Public-domain dedication. Crediting the source is good practice but not required. | **No.** Tiles are not in git. The README links a CDN zip ("rdr3 tiles") that has no licence statement. The tiles are Rockstar's map art. |
| jeanropke/RDR2CollectorsMap | `LICENSE`, **Unlicense** | Red Dead Online collector items, which are not story mode. `data/geojson/*.json` holds the road, trail and railroad LineStrings used by its route pathfinder. | **Yes**. Useful for drawing roads and railways on our own map. | **No.** `assets/maps/read me.txt` only points to the same tile download. |
| jeanropke/RDR2CollectorsMapBeta | MIT | Beta fork of the above | Yes (MIT, keep notice) but redundant | No |
| femga/rdr3_discoveries | **No LICENSE file** (the licence API returns 404) | Game-file research: zones, imaps, interiors and more | **No.** All rights reserved by default, so nothing was extracted. | No |
| belcaik/rdr2-map | NOASSERTION ("Other") | Pipeline that extracts data from a live third-party map site | **No.** The licence is unclear and the data is scraped from another site. | No |
| mpalmr/rdr2-collector-map, sprialmint9/rdr2-map, jebstern/rdr2-map-* (GPL-3.0), others | MIT / GPL / none | Online collector maps or small projects with no story-mode data | Not needed. GPL would also force copyleft on the app. | No |
| the0neWhoKnocks/red-dead-redemption-2-map | `LICENSE`, MIT | 705 hand-placed markers, including 150 cigarette cards, 31 dino bones, 20 dreamcatchers and 10 rock carvings | **No.** `bin/scrape-tiles.sh` scrapes IGN's tile server, and the marker names match IGN's interactive map. The data is almost certainly copied from IGN, which is proprietary, and the MIT notice cannot relicense it. Its coordinates are also in IGN tile space. | **No.** These are scraped IGN tiles. |
| VORPCORE/vorp_character, RetryR1v2/mms-treasure | GPL-2.0 / GPL-3.0 | RedM server configs with some place coordinates | Not used. Copyleft would apply to the app, and the coverage is thin. | No |
| Lambdarevolution/rdr2-mapeditor-public | Unlicense | Not inspected in depth | n/a | n/a |

No repo on GitHub publishes Rockstar map imagery under a licence that allows redistribution. The Unlicense on the jeanropke repos covers only their authors' code and data. It cannot relicense Rockstar's artwork.

## Coverage from licence-clean data (see `maps.json`)

| Set | Known size | Pins | Precision |
|---|---|---|---|
| Dinosaur bones | 30 | 30 | Exact points (`singleplayer.json`) |
| Dreamcatchers | 20 | 20 | Exact points. The overlay file has 21 icons, so a dispute is recorded. |
| Rock carvings | 10 | 10 | Exact points |
| Legendary animals | 16 | 16 | Approximate (overlay icon placement) |
| Legendary fish | 13 (+2 extras) | 15 | Approximate (overlay icon). Includes the Channel Catfish and Northern Pike extras. |
| Cigarette cards | 144 (12x12, not re-verified) | **0** | No open dataset found. Do not pin. |
| Towns | n/a | 15 | RDO fast-travel signposts, approximate as town centres |
| Camps / landmarks | n/a | 10 | Text-label anchors. Use for labels only. |

## Land, coast and river outlines

No open-licensed dataset of coastline, water or region polygons was found. The only usable geometry is RDR2CollectorsMap's road, trail and railroad network (Unlicense). Tracing coastlines from Rockstar's map would make a derived work of their art, so it is not recommended.

## Recommendation

1. **Do not bundle any real map imagery.** Draw our own stylised map.
2. Use RDOMap (Unlicense) for dino bones, dreamcatchers and rock carvings as exact pins. Use it for legendary animals and fish as "area" markers. Use its fast-travel points and text labels to place settlement and camp names.
3. Draw the base map from RDR2CollectorsMap's road and railroad GeoJSON (Unlicense). Add a plain background and state-name labels. We have no coastline data, so do not draw one, or keep it schematic and clearly non-geographic.
4. Add a credit line anyway ("Location data: jeanropke/RDOMap & RDR2CollectorsMap, public domain (Unlicense)").
5. Cigarette cards: text directions only, until an open dataset turns up.

## Update 2026-10-01: place-name labels

- Place-name labels come only from RDOMap (Unlicense). The sources are `discoverables.json` text-label anchors, `shops.json` wardrobe points and `interiors.json` building points.
- `maps.json` now has 107 pins in set `labels`, plus 8 `graves` pins with neutral labels.
- No open data exists for state, region, mountain, lake or river names, or for most town-name map text. Those names are baked into Rockstar's tile art.
- `pin-links.json` links 12 of the 60 bone, dreamcatcher and carving text items to pins. We only linked a pin where an open label position made the match unambiguous.
