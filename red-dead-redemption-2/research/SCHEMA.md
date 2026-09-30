# Research data schema (shared by all research agents)

Every research agent writes ONE JSON file: `research/raw/<area>.json`, UTF-8, valid JSON
(no comments, no trailing commas). Top-level shape:

```jsonc
{
  "area": "trophies",                 // your area key
  "generatedAt": "2026-09-30",
  "sources": [                         // every page you actually read
    { "id": "ppx", "title": "PowerPyx - RDR2 Trophy Guide", "url": "https://..." }
  ],
  "knownTotals": [                     // totals the merge script must enforce
    { "key": "trophies", "value": 52, "sources": ["ppx", "pst"], "note": "incl. platinum" }
  ],
  "trophies":    [ /* Trophy */ ],     // only the arrays relevant to your area
  "missions":    [ /* Mission */ ],
  "challenges":  [ /* Challenge */ ],
  "collectibles":[ /* Collectible */ ],
  "missables":   [ /* Missable */ ],
  "pins":        [ /* MapPin */ ],
  "notes":       [ "free-text facts that don't fit elsewhere, each with (sources: id,id)" ],
  "disputes":    [ /* Dispute */ ]     // REQUIRED, may be empty
}
```

## Common rules
- `id` values: lowercase kebab-case, stable, derived from the name, never from list position
  (e.g. `trophy-zoologist`, `mission-outlaws-from-the-west`, `chal-herbalist-4`, `card-amazons-3`).
- Every object has `"sources": ["srcId", ...]` referencing top-level `sources[].id`.
  Aim for **2+ independent sources** per fact. If only one source exists, set
  `"confidence": "single-source"`. Otherwise `"confidence": "confirmed"`.
- Paraphrase in your own words. Never paste paragraphs from a site.
- If sources disagree, record a `Dispute` and do NOT silently pick one.
- Never guess a location, requirement or count. Unknown = omit + note in `disputes`.
- Keep story spoilers out of `spoilerFreeTitle` fields.

## Types

```ts
type Trophy = {
  id: string; name: string; officialDescription: string;   // paraphrase if needed
  grade: "platinum" | "gold" | "silver" | "bronze";
  hidden: boolean;
  online: boolean;                        // true = Red Dead Online trophy
  missable: boolean;
  missableDeadline?: string;              // e.g. "before finishing Chapter 6 mission 'X'"
  earnedWhen: string;                     // story-related? grind? when naturally unlocked
  howTo: string[];                        // ordered, imperative instructions
  prerequisites?: string[];
  relatedTrackers?: string[];             // e.g. "challenges", "cigarette-cards", "gold-medals"
  tips?: string[];
  sources: string[]; confidence: "confirmed" | "single-source";
};

type Mission = {
  id: string; name: string; spoilerFreeTitle: string;
  chapter: "1" | "2" | "3" | "4" | "5" | "6" | "E1" | "E2";
  orderInChapter: number;                 // typical story order (best effort, note in disputes)
  type: "story" | "stranger" | "camp" | "side";
  giver?: string;                         // mission icon letter/character
  startLocation?: string;
  goldRequirements: string[];             // every gold medal objective
  goldTips?: string[];
  missableNotes?: string[];               // anything lost after this mission
  pointOfNoReturn?: boolean;              // finishing this locks content
  sources: string[]; confidence: "confirmed" | "single-source";
};

type Challenge = {
  id: string; category: string; number: number;          // 1..10
  requirement: string; tips: string[]; prerequisites?: string[];
  sources: string[]; confidence: "confirmed" | "single-source";
};

type Collectible = {
  id: string; set: string;                // e.g. "dinosaur-bones", "cigarette-cards:amazons"
  name: string; region?: string;
  location: string;                       // precise, human directions
  availableFrom?: string;                 // chapter when accessible
  missableNote?: string;
  pinId?: string;                         // MapPin id if coordinates are known
  sources: string[]; confidence: "confirmed" | "single-source";
};

type Missable = {
  id: string; what: string; trophy?: string;              // trophy id
  deadline: string;                       // exact mission/chapter point of no return
  recommendedTiming: string;              // when in the route to do it
  why: string; howTo: string[];
  sources: string[]; confidence: "confirmed" | "single-source";
};

type MapPin = {
  id: string; label: string; set: string;
  x: number; y: number;                   // IN-GAME world coordinates (x east, y north)
  datasetRef: string;                     // source dataset + file + licence
  approximate: boolean;                   // true unless taken from a coordinate dataset
};

type Dispute = {
  topic: string; details: string;
  positions: { claim: string; sources: string[] }[];
  suggestedHandling: string;              // what the guide should tell the player
};
```
