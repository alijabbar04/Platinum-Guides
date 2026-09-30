// Shape of src/data/guide.json, produced by scripts/build-content.mjs.
// IDs are stable: progress is stored by ID, so content fixes never wipe ticks.

export type StepType = 'mission' | 'task' | 'warning' | 'session' | 'info';

export type Step = {
  id: string;
  partId: string;
  type: StepType;
  title: string;
  missionName?: string; // real mission name (may be a spoiler, shown behind the spoiler shield)
  where?: string;
  before?: string[];
  how: string[];
  gold?: string[]; // gold medal objectives (from research)
  goldTips?: string[];
  counts: string[]; // trophy ids
  trackers: string[]; // tracker ids this step points at
  tip?: string;
  missable?: { deadline: string };
  spoiler?: string[];
  unverified?: string;
  optional?: boolean;
  sources: string[]; // keys into Guide.sources
};

export type Part = {
  id: string;
  title: string;
  subtitle: string;
  intro: string[];
  stepIds: string[];
};

export type Grade = 'platinum' | 'gold' | 'silver' | 'bronze';

export type Trophy = {
  id: string;
  name: string;
  description: string;
  grade: Grade;
  hidden: boolean;
  online: boolean;
  missable: boolean;
  missableDeadline?: string;
  howTo: string[];
  tips: string[];
  stepIds: string[]; // route steps that count towards it
  trackerIds: string[]; // trackers that count towards it
};

export type TrackerItem = {
  id: string;
  label: string;
  spoilerLabel?: string; // real label when `label` is a spoiler-safe stand-in
  detail?: string;
  region?: string;
  kind: 'check' | 'counter' | 'note' | 'link'; // note = reference text only; link = shows another tracker's progress
  trackerId?: string; // link only
  target?: number; // counters only
  unit?: string; // counters only, e.g. "$"
  pinId?: string;
  stepId?: string; // mirrors a route step's tick instead of having its own
  optional?: boolean;
  unverified?: string;
  available?: string; // e.g. "Epilogue"
};

export type TrackerGroup = { id: string; title: string; note?: string; items: TrackerItem[] };

export type Tracker = {
  id: string;
  title: string;
  short: string;
  description: string[];
  goal: number; // number of items (or counter units) needed; progress bar target
  goalLabel: string;
  trophyIds: string[];
  groups: TrackerGroup[];
  hasMap: boolean;
  mapNote?: string;
};

export type Pin = {
  id: string;
  label: string;
  set: string;
  x: number;
  y: number;
  approximate: boolean;
};

export type MapLabel = { text: string; x: number; y: number; kind: 'town' | 'place' };

export type Issue = {
  id: string;
  area: string;
  topic: string;
  details: string;
  positions: { claim: string; sources: string[] }[];
  handling: string;
};

export type Guide = {
  version: string;
  builtAt: string;
  parts: Part[];
  steps: Step[];
  trophies: Trophy[];
  trackers: Tracker[];
  pins: Record<string, Pin>;
  map: {
    bounds: { minX: number; maxX: number; minY: number; maxY: number };
    roads: string; // SVG path data in game units (y flipped: svgY = -gameY)
    rail: string;
    labels: MapLabel[];
    credit: string;
  };
  sources: Record<string, { title: string; url: string }>;
  issues: Issue[];
};
