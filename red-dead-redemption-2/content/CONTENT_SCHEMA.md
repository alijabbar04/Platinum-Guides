# Route content schema + placement plan (shared by all route writers)

The app shows ONE continuous route, top to bottom, from a fresh save to the platinum.
The player only scrolls down. Every step appears once, where it should be done.
Long-running goals live in TRACKERS (generated separately from research data); the route
only contains steps that *point* to a tracker at the right moment ("Open the Rock Carvings
tracker and collect all 10 now").

Research facts are in `research/raw/*.json` (schema: `research/SCHEMA.md`). Write ONLY from
those facts. You may do a few web look-ups (max 10 searches / 15 fetches) to fill a gap,
but any fact that is not in the research files must go in the step's `unverified` field
with the source URL in `sources`.

## File format
Write `content/route/<NN>-<partId>.json`, UTF-8, valid JSON:

```jsonc
{
  "part": {
    "id": "ch2",                        // fixed ids: start, ch1, ch2, ch3, ch4, ch5, ch6, e1, e2, cleanup, online
    "title": "Chapter 2",               // spoiler-free
    "subtitle": "Horseshoe Overlook",   // spoiler-free place/theme
    "intro": ["2-4 short paragraphs: what this part covers, what's missable in it, rough hours"]
  },
  "steps": [ Step, ... ]                // in the exact order the player should do them
}
```

```ts
type Step = {
  id: string;            // "<partId>-<slug>", lowercase kebab, stable, from the CONTENT not position.
                         // Mission steps: "<partId>-m-<mission slug>" e.g. "ch2-m-who-is-not-without-sin"
  type: "mission" | "task" | "warning" | "session" | "info";
    // mission = a story/stranger/honor mission with a research mission id
    // task    = a concrete optional/missable thing to do now (tithing, companion activity, gunsmith...)
    // warning = POINT OF NO RETURN notice; placed immediately before the mission it warns about
    // session = a free-roam block pointing at a tracker ("collect all 10 rock carvings now")
    // info    = short read-only note (use sparingly, e.g. 'how honor works'); still tickable
  title: string;         // imperative, short (<= 60 chars), NO story spoilers (no deaths/betrayals/twists)
  missionId?: string;    // REQUIRED for type mission when the mission exists in research
                         // missions arrays (missions-ch1-3.json, missions-ch4-e2.json, collectibles.json).
                         // Gold-medal objectives are injected automatically from research - DON'T copy them.
  where?: string;        // where to go (town/region/landmark, map marker letter/icon)
  before?: string[];     // what you need beforehand (money, items, honor, a prior mission)
  how: string[];         // ordered, imperative, concrete instructions (3-10 items typical)
  counts?: string[];     // what this counts towards: trophy ids ("trophy-errand-boy") and/or
                         // tracker ids ("tracker:rock-carvings"). Use ids listed below only.
  tip?: string;          // for fiddly tasks
  missable?: {           // for anything with a cut-off
    deadline: string;              // human text, e.g. "before finishing 'The Sheep and the Goats'"
    deadlineMissionId: string;     // research mission id of the point of no return
  };
  spoiler?: string[];    // text that would spoil the story; shown only when the player taps "reveal"
  unverified?: string;   // what isn't fully confirmed / where sources disagree (from research disputes)
  optional?: boolean;    // true = not needed for the platinum (e.g. Special Edition content)
  sources: string[];     // research refs "file#sourceId" e.g. "missables#ppx", "missions-ch1-3#holdtoreset"
}
```

### Writing rules
- Write for someone who wants to be told exactly what to do. Imperative, concrete, short sentences.
  British spelling, except in-game terms (Honor, Gunsmith...).
- Every `how` item is one action. Name places the player can find on the in-game map.
- Don't invent controller buttons, prices, coordinates, or counts not in research.
- No story spoilers in `title`, `where`, `before`, `how`. If a spoiler is needed to explain a missable
  (e.g. someone won't be around later), put it in `spoiler`, and say "(tap reveal for why)" in how.
- Mission steps: keep `how` short (how to start it + any missable pickup or gold-medal-relevant
  preparation); gold objectives are appended automatically from research.
- Include EVERY mission of your chapters that is in the research missions arrays for that chapter
  (story missions incl. no-medal parts that are listed, honor missions), each exactly once, in play order.
  Stranger missions: include them in the chapter where the plan below says; one step per strand is fine
  (use the strand's `missionId` from collectibles.json).
- `warning` steps: one immediately before every point-of-no-return mission, listing concretely what
  must be finished first (link each item's step title) — "Make a manual save now" included.
- Don't duplicate steps another part owns (see plan). If you need to remind, a warning may *mention* it.

## Tracker ids (for `counts` "tracker:<id>")
gold-medals, challenges, cigarette-cards, dinosaur-bones, dreamcatchers, rock-carvings, exotics,
legendary-animals, legendary-fish, zoologist, skin-deep, strangers, lending-a-hand, completion,
graves, homesteads, hobby-horse, grind, treasure-hunts

## Trophy ids
See `research/raw/trophies.json` `trophies[].id` (52 total, e.g. trophy-errand-boy). Every offline
trophy must be counted by at least one route step across all parts.

## Placement plan (who owns what)
- **start** (writer A): how to use the guide (ticks, trackers, missables filter), game facts (no
  difficulty setting, cheats disable trophies, PS4 list on PS5, manual saves, no chapter select, gold
  medals can be replayed later), honor strategy (stay honourable — needed 4/8 in Ch6), rough time budget.
- **ch1** (A): all Ch1 missions; Back in the Mud; Cornwall documents missable note.
- **ch2** (A): all Ch2 missions; Give to the Poor ($250 tithing, do early); Friends With Benefits Ch2
  activity; Errand Boy (aim to finish all 5 in Ch2-3); Lending a Hand Ch2 set; Locked and Loaded
  (gunsmith, when affordable); Trusty Steed (bond with a horse, ongoing); Hobby Horse (play the table
  games you reach: session pointing to tracker:hobby-horse); Collector's Item via rock carvings
  (session -> tracker:rock-carvings, only if all 10 reachable as Arthur; else place where they are);
  Breaking and Entering (session -> tracker:homesteads, save first); start challenges (session ->
  tracker:challenges); legendary animals available now (session -> tracker:legendary-animals,
  optional-now); Self Sufficient crafting note; stranger strands available in Ch2 (as mission steps);
  Take from the Rich / Pony Up natural-progress notes; warning before The Sheep and the Goats.
- **ch3** (B): all Ch3 missions; FWB Ch3 activity; Errand Boy continue; Lending a Hand Ch3; Rare Rolling
  Block pick-up; Ch3 strangers; warnings before 'Blood Feuds, Ancient and Modern' and the chapter end.
- **ch4** (B): all Ch4 missions; FWB Ch4 activity (trophy pops); Errand Boy finish; Give to the Poor
  final check; Lending a Hand Ch4 (Help a Brother Out, Brothers and Sisters, Fatherhood, ML V);
  A Bright Bouncing Boy (Artificial Intelligence); Duchesses and Other Animals start (exotics tracker);
  Hobby Horse (Saint Denis dominoes/poker); warning before 'Banking, the Old American Art'.
- **ch5** (C): all Ch5 missions; optional Guarma animals note; Bullgator if research says Ch5.
- **ch6** (C): all Ch6 missions; honor check to 4/8 FIRST; every Ch6 Lending a Hand mission; Extreme
  Personality (max honor, Ch6 +50% gain) — only if research supports; strangers to finish as Arthur;
  warnings before 'The Fine Art of Conversation' and before the chapter-ending mission (what Arthur loses).
- **e1, e2** (D): all Epilogue missions; Cowboy Builder, Endless Summer; unlocks after credits.
- **cleanup** (E): post-story free-roam sessions in a sensible order: gold medal replays (tracker),
  New Austin/new-area sweeps (dino bones, herbs, animals), Collector's Item if not yet, Paying Respects
  (graves tracker), It's Art (hunting requests + statue), Zoologist + Skin Deep, legendary fish (It Was
  THIS Big), Grin and Bear It, Bountiful, Western Stranger, Hobby Horse, Breaking and Entering if not
  done, Self Sufficient, Locked and Loaded if not done, all 90 challenges, 100% (Best in the West),
  Extreme Personality if not done, Gold Rush.
- **online** (F): Red Dead Online, its own part after cleanup (players may do it any time; say so).
  Every one of the 17 online trophies counted by a step. Rank 10 and Rank 50 as steps. The LAST step
  of this part (and of the whole route) is the platinum, Legend of the West: a final checklist.
