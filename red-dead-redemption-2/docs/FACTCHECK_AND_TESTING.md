# Fact-check and test record: v1.0.0 (2026-10-01)

## How the content was built

1. **Research** (9 parallel agents, one shared schema in `research/SCHEMA.md`, search budgets per agent):
   trophies, story missions Ch1–3, Ch4–Epilogue, challenges, wildlife, collectibles/strangers,
   missables/roadmap, Red Dead Online, open map data and licences. Output: `research/raw/*.json`.
2. **Route writing** (6 agents, one per part, from research facts only): `content/route/*.json`.
3. **Merge and validate**: `scripts/build-content.mjs` dedupes trophies, missions and sources, and
   fails the build on any of these: a count that doesn't match the known totals (52 trophies,
   1/3/4/44 by grade, 17 online, 104 gold-medal missions, 70 for Gold Rush, 90 challenges in 9×10,
   144 cards in 12×12, 30 bones, 20 dreamcatchers, 10 carvings, 5 exotics requests, 16 legendary
   animals, 13 required fish, 152 Zoologist, 71 Skin Deep, 22 Western Stranger strands, 8 grave sites,
   7 homesteads, 12 treasure stages, plus map pin counts per set); a story mission missing from or
   repeated in the route; a missable step placed at or after its deadline mission; a point-of-no-return
   mission without a warning card shortly before it; an uncounted trophy; or a dangling reference.
4. **Independent fact-checks** (2 agents that did not write the content): verdicts in
   `research/factcheck/*.json`.

## Corrections made after the fact-check

| Finding | Fix |
|---|---|
| Pouring Forth Oil II was counted as an honor mission for Lending a Hand | Removed from the trophy and the honor lists; added the reported 4-hour "mission is skipped" warning |
| Mrs. Sadie Adler, Widow I/II: deadline given as "end of Chapter 6" | Deadline is now "before starting 'My Last Boy'". Added a "Stop" card before 'My Last Boy' and "ACCEPT Sadie's request; declining loses the trophy" |
| Chapter 3 Friends With Benefits step pointed at coach robberies that only unlock later | Now points at fishing with Javier/Kieran (or Chapter 2 carry-overs) first |
| Robbing Catfish Jackson's / hurting the Davisons can cancel Money Lending V (needed for Lending a Hand) | Warning added to the homesteads session and to the Money Lending V step |
| Extreme Personality can't unlock before 'Paradise Mercifully Departed' | Added to the trophy and the Chapter 6 step |
| Locked and Loaded: "buy every component option" | Now "change each component slot once" (grip, barrel length, rifling, sights) |
| Trophy name "Grin and Bear It" | Official: "Grin and Bear it" |
| Three grave landmarks used different reference points from the sources | Updated to the sources' landmarks; grave pins are exact dataset positions |

Confirmed by the fact-check: all 28 Lending a Hand parts are in the route before their real cut-off;
the cut-offs of all four missable trophies; every 100% completion category and number; all 35 offline
trophy descriptions; all grind thresholds.

## Device testing (Android 15 emulator, Pixel 7 profile, release-signed APK)

| Test | Result |
|---|---|
| Tick a step: collapses to a grey struck-through row; undo bar appears | Pass |
| UNDO within 6 s restores the step | Pass |
| Untick from the collapsed row | Pass |
| Force-stop and relaunch: progress kept (7/245) and the app opens on the next unticked step | Pass |
| Install an updated APK over the old one (`adb install -r`): progress kept | Pass |
| Export backup to a folder (system picker → Documents): valid JSON with all ticks | Pass |
| Clear all progress → import backup → Replace: all 8 ticks restored | Pass |
| Missables-only filter | Pass (now also jumps to the next unticked step) |
| Search ("tithing") finds steps and trophies; tapping jumps to the step | Pass |
| Trophies screen: expand, cut-off text, manual "unlocked" tick | Pass (fixed Gold Rush progress counting an info step) |
| Trackers: list, counters (+/−), check items, mirrored route items | Pass |
| Map: exact pins, approximate areas labelled, tap pin → card → tick from map, zoom +/−/fit | Pass after fixes (sharp re-render at zoom; zoom kept when the card opens) |
| Small screen 720×1280 @ 320 dpi (360×640 dp) | Pass (header made shrink-to-fit) |
| Offline: airplane mode, Wi-Fi and data off, cold start | Pass: no network needed |
| Light (Daylight) and dark (Lamplight) themes | Pass |

### Not tested

- On a physical phone (only the emulator; the phone APK is the ARM build of the same code and key).
- iOS (not built).
- Pinch-to-zoom with real fingers (adb can't inject a two-finger pinch; the +/−/Fit buttons were tested,
  double-tap zoom was not).
- "Share backup" via the share sheet (the folder save and import paths were tested end to end).
- Accuracy of most gold-medal objective wording beyond the research cross-checks.
