# RDR2 Platinum Ledger

An offline Android app that walks you through the Red Dead Redemption 2 platinum trophy
(PlayStation trophy list, including the Red Dead Online trophies) as one long tick-off route.

- **One route, top to bottom:** 244 steps across 11 parts (Before you start, Chapters 1–6,
  Epilogue 1–2, post-story cleanup, Red Dead Online). Missables sit before their point of no
  return, and a red "Point of no return" card comes right before each cut-off mission.
- **Trackers** for long-running goals, reachable from anywhere: gold medals (70/104), 90 challenges,
  144 cigarette cards, dinosaur bones, dreamcatchers, rock carvings, exotics, legendary animals and fish,
  Zoologist (152), Skin Deep (71), strangers, honor missions, graves, homesteads, table games,
  grind counters and a 100% checklist.
- **Maps** drawn by the app from open coordinate data (no game art). Exact pins and
  approximate areas are drawn differently and labelled.
- **Progress** saves on the phone after every tick, survives restarts and updates, and can be
  exported and imported as a JSON backup. Every step and item has a stable ID.
- **Accuracy:** every step lists its sources. Anything the sources disagreed on, or that rests on a
  single source, is shown in the app (Settings → Unverified & Disputed) and in
  [`docs/UNVERIFIED.md`](docs/UNVERIFIED.md).

## Install (Android)

1. Download `rdr2-platinum-ledger-<version>.apk` from the repository's Releases page on your phone.
2. Open it. Android will ask you to allow installs from your browser or file manager ("Install unknown apps"): allow it for that app only.
3. Tap **Install**. Later versions install over the top and keep your progress. Still, make a backup first (Settings → Save backup).

## Project layout

| Path | What |
|---|---|
| `research/SCHEMA.md` | Shared schema the research agents wrote to |
| `research/raw/*.json` | Research per area (trophies, missions, challenges, collectibles, wildlife, missables, online, maps) with sources and disputes |
| `research/raw/mapdata/` | Open-licence (Unlicense) coordinate data, with its licence files |
| `research/factcheck/` | Independent fact-check verdicts |
| `content/CONTENT_SCHEMA.md` | Route step format and placement plan |
| `content/route/*.json` | The route, one file per part |
| `scripts/build-content.mjs` | Merges research and route into `src/data/guide.json`; removes duplicates and **fails** on any count mismatch, dangling reference, or missable placed after its deadline |
| `src/` | Expo Router app (TypeScript) |
| `plugins/withReleaseSigning.js` | Signs release builds with a private key kept outside the repo |

## Build

Requirements: Node 20+, JDK 17, Android SDK (platform 36).

```bash
npm install
npm run build:content      # regenerate src/data/guide.json (fails loudly on bad data)
npx tsc --noEmit
npx expo prebuild --platform android --clean
cd android && ./gradlew assembleRelease
```

Signing: put `RDR2_LEDGER_STORE_FILE`, `RDR2_LEDGER_STORE_PASSWORD`, `RDR2_LEDGER_KEY_ALIAS` and
`RDR2_LEDGER_KEY_PASSWORD` in `~/.gradle/gradle.properties`. Without them the build falls back
to the debug key. Always sign updates with the **same** key, or Android will refuse to update
and you would have to uninstall, which wipes progress unless you restore a backup.

## Credits and licences

- Coordinates: [jeanropke/RDOMap](https://github.com/jeanropke/RDOMap) and
  [jeanropke/RDR2CollectorsMap](https://github.com/jeanropke/RDR2CollectorsMap), both The Unlicense.
  No map tiles or game imagery are used.
- Fonts: Rye and Libre Caslon Text (SIL OFL 1.1), Special Elite (Apache 2.0), via `@expo-google-fonts`.
- Guide text is original writing based on cross-checked community guides (PowerPyx, rdr2.org,
  Red Dead Wiki, GamerGuides, GamesRadar, GTABase, Steam guides and others). Sources are listed per step.
- Unofficial fan project. Not affiliated with or endorsed by Rockstar Games or Take-Two Interactive.
