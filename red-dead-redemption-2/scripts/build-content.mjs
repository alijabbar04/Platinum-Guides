#!/usr/bin/env node
// Merges research/raw/*.json (research agents) + content/route/*.json (route writers)
// into src/data/guide.json. Removes duplicates, cross-checks every reference, and FAILS
// LOUDLY (exit 1) when counts don't match the known totals or a missable is placed after
// its point of no return. Also writes docs/UNVERIFIED.md.
//
//   node scripts/build-content.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(ROOT, 'research', 'raw');
const ROUTE = path.join(ROOT, 'content', 'route');
const OUT = path.join(ROOT, 'src', 'data', 'guide.json');
const DOC = path.join(ROOT, 'docs', 'UNVERIFIED.md');

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

// ---------------------------------------------------------------- known totals
// Each is cross-checked against the research files' own knownTotals where present.
const EXPECT = {
  trophies: 52,
  'trophies-platinum': 1,
  'trophies-gold': 3,
  'trophies-silver': 4,
  'trophies-bronze': 44,
  'trophies-online': 17,
  'gold-medal-missions': 104,
  'gold-medals-needed': 70,
  challenges: 90,
  'challenge-categories': 9,
  'cigarette-cards': 144,
  'cigarette-card-sets': 12,
  'dinosaur-bones': 30,
  dreamcatchers: 20,
  'rock-carvings': 10,
  'exotics-requests': 5,
  'legendary-animals': 16,
  'legendary-fish-required': 13,
  'zoologist-required-species': 152,
  'skin-deep-required-species': 71,
  'stranger-strands-eligible-western-stranger': 22,
  'grave-sites': 8,
  homesteads: 7,
  'treasure-hunt-steps': 12,
};
const researchTotalKeys = {
  trophies: ['trophies', 'trophies-total'],
  'trophies-platinum': ['trophies-platinum'],
  'trophies-gold': ['trophies-gold'],
  'trophies-silver': ['trophies-silver'],
  'trophies-bronze': ['trophies-bronze'],
  'trophies-online': ['trophies-online', 'online-trophies'],
  'gold-medal-missions': ['gold-medal-missions-game', 'gold-medal-missions-total', 'gold-medals-available'],
  'gold-medals-needed': ['gold-medals-needed-gold-rush'],
  challenges: ['challenges-total'],
  'challenge-categories': ['challenge-categories'],
  'cigarette-cards': ['cigarette-cards'],
  'cigarette-card-sets': ['cigarette-card-sets'],
  'dinosaur-bones': ['dinosaur-bones', 'pins:dinosaur-bones'],
  dreamcatchers: ['dreamcatchers', 'pins:dreamcatchers'],
  'rock-carvings': ['rock-carvings', 'pins:rock-carvings'],
  'exotics-requests': ['exotics-requests'],
  'legendary-animals': ['legendary-animals', 'pins:legendary-animals'],
  'legendary-fish-required': ['legendary-fish', 'legendary-fish-for-a-fisher-of-fish'],
  'zoologist-required-species': ['zoologist-required-species'],
  'skin-deep-required-species': ['skin-deep-required-species'],
  'stranger-strands-eligible-western-stranger': ['stranger-strands-eligible-western-stranger'],
};

function expectCount(key, actual, what) {
  if (actual !== EXPECT[key]) err(`COUNT MISMATCH ${key}: expected ${EXPECT[key]}, got ${actual} (${what})`);
}

// ---------------------------------------------------------------- load research
const files = fs.readdirSync(RAW).filter((f) => f.endsWith('.json') && f !== 'pin-links.json');
const research = {};
for (const f of files) research[f.replace(/\.json$/, '')] = readJson(path.join(RAW, f));
const pinLinks = fs.existsSync(path.join(RAW, 'pin-links.json')) ? readJson(path.join(RAW, 'pin-links.json')) : { links: [] };

// Sources: "file#id" -> {title,url}
const sources = {};
for (const [area, d] of Object.entries(research)) {
  const seen = new Set();
  for (const s of d.sources ?? []) {
    if (seen.has(s.id)) err(`duplicate source id ${area}#${s.id}`);
    seen.add(s.id);
    sources[`${area}#${s.id}`] = { title: s.title, url: s.url };
  }
}

// Research knownTotals cross-check
for (const [key, rkeys] of Object.entries(researchTotalKeys)) {
  for (const [area, d] of Object.entries(research)) {
    for (const t of d.knownTotals ?? []) {
      if (rkeys.includes(t.key) && typeof t.value === 'number' && t.value !== EXPECT[key]) {
        // 'legendary-fish' may be quoted as 15 incl. optional; only the explicit keys are enforced
        if (key === 'legendary-fish-required' && t.value !== 13 && /incl|optional|15/i.test(t.note ?? '')) continue;
        err(`research ${area} knownTotal ${t.key}=${t.value} disagrees with expected ${key}=${EXPECT[key]}`);
      }
    }
  }
}

// ---------------------------------------------------------------- trophies (merge + dedupe)
const base = research.trophies.trophies;
const trophyMap = new Map();
for (const t of base) {
  if (trophyMap.has(t.id)) err(`duplicate trophy id ${t.id} in trophies.json`);
  trophyMap.set(t.id, { ...t, _areas: ['trophies'] });
}
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
for (const [area, d] of Object.entries(research)) {
  if (area === 'trophies') continue;
  for (const t of d.trophies ?? []) {
    const b = trophyMap.get(t.id);
    if (!b) {
      err(`trophy ${t.id} from ${area} not in the master trophy list`);
      continue;
    }
    if (norm(b.name) !== norm(t.name)) err(`trophy name conflict ${t.id}: "${b.name}" vs "${t.name}" (${area})`);
    if (b.grade !== t.grade) err(`trophy grade conflict ${t.id}: ${b.grade} vs ${t.grade} (${area})`);
    if (!!b.online !== !!t.online) err(`trophy online-flag conflict ${t.id} (${area})`);
    if (!!b.missable !== !!t.missable) warn(`trophy missable-flag differs for ${t.id} (${area}); master: ${b.missable}`);
    // online.json has the current (2025-26) methods: prefer it for online trophies
    if (area === 'online') {
      b.howTo = t.howTo;
      b.tips = [...(t.tips ?? [])];
    } else {
      b.tips = [...new Set([...(b.tips ?? []), ...(t.tips ?? [])])];
    }
    b._areas.push(area);
  }
}
const trophies = [...trophyMap.values()];
expectCount('trophies', trophies.length, 'merged trophy list');
for (const g of ['platinum', 'gold', 'silver', 'bronze'])
  expectCount(`trophies-${g}`, trophies.filter((t) => t.grade === g).length, `${g} trophies`);
expectCount('trophies-online', trophies.filter((t) => t.online).length, 'online trophies');

// ---------------------------------------------------------------- missions (merge + dedupe)
const missions = new Map();
for (const area of ['missions-ch1-3', 'missions-ch4-e2', 'collectibles']) {
  for (const m of research[area].missions ?? []) {
    const prev = missions.get(m.id);
    if (prev) {
      if (prev.chapter !== m.chapter || prev.name !== m.name) err(`conflicting duplicate mission ${m.id} (${prev._area} vs ${area})`);
      else warn(`duplicate mission ${m.id} in ${prev._area} and ${area}; kept first`);
      continue;
    }
    missions.set(m.id, { ...m, _area: area });
  }
}
const goldMissions = [...missions.values()].filter((m) => m.type !== 'side' && (m.goldRequirements ?? []).length > 0);
expectCount('gold-medal-missions', goldMissions.length, 'missions with gold objectives (excl. Special Edition side mission)');

// ---------------------------------------------------------------- route
const PART_ORDER = ['start', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'e1', 'e2', 'cleanup', 'online'];
const routeFiles = fs.readdirSync(ROUTE).filter((f) => f.endsWith('.json')).sort();
const parts = [];
const steps = [];
const stepIds = new Set();
for (const f of routeFiles) {
  let d;
  try {
    d = readJson(path.join(ROUTE, f));
  } catch (e) {
    err(`route file ${f} is not valid JSON: ${e.message}`);
    continue;
  }
  const part = d.part;
  if (!PART_ORDER.includes(part.id)) err(`${f}: unknown part id ${part.id}`);
  const ids = [];
  for (const s of d.steps) {
    if (stepIds.has(s.id)) err(`duplicate step id ${s.id}`);
    stepIds.add(s.id);
    if (!s.id.startsWith(part.id + '-')) err(`step ${s.id} does not start with part prefix ${part.id}-`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id)) err(`step id not kebab-case: ${s.id}`);
    if (!['mission', 'task', 'warning', 'session', 'info'].includes(s.type)) err(`step ${s.id}: bad type ${s.type}`);
    if (!s.title || s.title.length > 60) err(`step ${s.id}: title missing or > 60 chars`);
    if (!Array.isArray(s.how) || s.how.length === 0) err(`step ${s.id}: empty how`);
    if (!Array.isArray(s.sources) || s.sources.length === 0) err(`step ${s.id}: no sources`);
    ids.push(s.id);
    steps.push({ ...s, partId: part.id });
  }
  parts.push({ id: part.id, title: part.title, subtitle: part.subtitle ?? '', intro: part.intro ?? [], stepIds: ids });
}
if (parts.map((p) => p.id).join() !== PART_ORDER.join()) err(`parts out of order or missing: ${parts.map((p) => p.id).join(',')}`);
const stepIndex = new Map(steps.map((s, i) => [s.id, i]));

// Source refs
for (const s of steps) {
  for (const r of s.sources ?? []) {
    if (/^https?:\/\//.test(r)) {
      if (!sources[r]) sources[r] = { title: new URL(r).hostname.replace(/^www\./, ''), url: r };
    } else if (!sources[r]) err(`step ${s.id}: unknown source ref ${r}`);
  }
}

// Missions in route: each research story mission exactly once
const routeMission = new Map();
for (const s of steps) {
  if (!s.missionId) {
    if (s.type === 'mission') warn(`mission step without missionId: ${s.id}`);
    continue;
  }
  if (!missions.has(s.missionId)) {
    err(`step ${s.id}: unknown missionId ${s.missionId}`);
    continue;
  }
  if (routeMission.has(s.missionId)) err(`mission ${s.missionId} appears twice (${routeMission.get(s.missionId)} and ${s.id})`);
  routeMission.set(s.missionId, s.id);
}
for (const m of missions.values()) {
  if (m.type === 'story' && !routeMission.has(m.id)) err(`story mission missing from route: ${m.id} (${m.name})`);
  if (m.type === 'stranger' && !routeMission.has(m.id)) warn(`stranger strand not a route mission step: ${m.id}`);
}
for (const m of goldMissions) if (!routeMission.has(m.id)) err(`gold-medal mission missing from route: ${m.id}`);

// Missables must sit before their point of no return
for (const s of steps) {
  if (!s.missable) continue;
  const dl = s.missable.deadlineMissionId;
  if (!dl) {
    err(`missable step ${s.id} has no deadlineMissionId`);
    continue;
  }
  if (!missions.has(dl)) {
    err(`missable step ${s.id}: deadline mission ${dl} unknown`);
    continue;
  }
  const dlStep = routeMission.get(dl);
  if (!dlStep) {
    err(`missable step ${s.id}: deadline mission ${dl} not in route`);
    continue;
  }
  // a pick-up inside the deadline mission itself is fine (the step IS that mission)
  if (dlStep !== s.id && stepIndex.get(dlStep) <= stepIndex.get(s.id))
    err(`MISSABLE AFTER DEADLINE: ${s.id} is placed at/after its point of no return ${dl} (${dlStep})`);
}

// Every point-of-no-return mission has a warning shortly before it
for (const m of missions.values()) {
  if (!m.pointOfNoReturn) continue;
  const sid = routeMission.get(m.id);
  if (!sid) continue;
  const i = stepIndex.get(sid);
  const prev = steps.slice(Math.max(0, i - 4), i);
  if (!prev.some((p) => p.type === 'warning')) err(`no warning step within 4 steps before point of no return ${m.id} (${sid})`);
}

// ---------------------------------------------------------------- trackers
const TR = []; // tracker definitions
const R = research;
const byMissionStep = (mid) => routeMission.get(mid);

// gold medals
{
  const chapterTitle = { 1: 'Chapter 1', 2: 'Chapter 2', 3: 'Chapter 3', 4: 'Chapter 4', 5: 'Chapter 5', 6: 'Chapter 6', E1: 'Epilogue Part 1', E2: 'Epilogue Part 2' };
  const groups = Object.entries(chapterTitle).map(([ch, title]) => ({
    id: `gold-ch-${ch.toLowerCase()}`,
    title,
    items: goldMissions
      .filter((m) => String(m.chapter) === ch)
      .sort((a, b) => stepIndex.get(routeMission.get(a.id)) - stepIndex.get(routeMission.get(b.id)))
      .map((m) => ({
        id: `gold-${m.id.replace(/^mission-/, '')}`,
        label: m.spoilerFreeTitle || m.name,
        spoilerLabel: m.name,
        detail: m.goldRequirements.map((g) => `• ${g}`).join('\n'),
        kind: 'check',
      })),
  }));
  TR.push({
    id: 'gold-medals',
    title: 'Gold Medals',
    short: 'Gold Medals',
    description: [
      'Tick a mission here when you earn its gold medal. 70 of the 104 are needed for Gold Rush; all objectives of a mission must be met in one run.',
      'You can replay any finished mission from Pause > Progress > Story after the story. Mission names are hidden behind the spoiler shield; tap a name to show it.',
    ],
    goal: EXPECT['gold-medals-needed'],
    goalLabel: 'gold medals (70 needed)',
    trophyIds: ['trophy-gold-rush'],
    groups,
  });
  expectCount('gold-medal-missions', groups.reduce((a, g) => a + g.items.length, 0), 'gold tracker items');
}

// challenges
{
  const ch = R.challenges.challenges;
  const cats = [...new Set(ch.map((c) => c.category))];
  expectCount('challenges', ch.length, 'challenges');
  expectCount('challenge-categories', cats.length, 'challenge categories');
  for (const cat of cats) if (ch.filter((c) => c.category === cat).length !== 10) err(`challenge category ${cat} does not have 10`);
  TR.push({
    id: 'challenges',
    title: 'Challenges',
    short: 'Challenges',
    description: [
      'All 90 challenges count toward 100% completion (Best in the West). Within a category they unlock in order, and progress made before a challenge unlocks does not count.',
      'Check Pause > Progress > Challenges in game for live counts.',
    ],
    goal: 90,
    goalLabel: 'challenges',
    trophyIds: ['trophy-best-in-the-west'],
    groups: cats.map((cat) => ({
      id: `chal-${norm(cat)}`,
      title: cat,
      items: ch
        .filter((c) => c.category === cat)
        .sort((a, b) => a.number - b.number)
        .map((c) => ({
          id: c.id,
          label: `${cat} ${c.number}: ${c.requirement}`,
          detail: [...(c.prerequisites ?? []).map((p) => `Needs: ${p}`), ...(c.tips ?? []).map((t) => `Tip: ${t}`)].join('\n') || undefined,
          kind: 'check',
          unverified: c.confidence === 'single-source' ? 'Single source.' : undefined,
        })),
    })),
  });
}

// cigarette cards
{
  const cards = R.collectibles.collectibles.filter((c) => c.set.startsWith('cigarette-cards:'));
  expectCount('cigarette-cards', cards.length, 'cigarette cards');
  const sets = [...new Set(cards.map((c) => c.set))];
  expectCount('cigarette-card-sets', sets.length, 'cigarette card sets');
  for (const s of sets) if (cards.filter((c) => c.set === s).length !== 12) err(`card set ${s} does not have 12`);
  const title = (s) => s.split(':')[1].split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  TR.push({
    id: 'cigarette-cards',
    title: 'Cigarette Cards',
    short: 'Cigarette Cards',
    description: [
      '144 cards in 12 sets of 12. One full set is enough for 100% completion; all 144 (the "Smoking and Other Hobbies" strand) is one of four ways to earn Collector\'s Item.',
      'Any card can also come from Premium Cigarette packs sold at general stores. No open-licence position data exists for cards, so they have written directions only (no map).',
    ],
    goal: 144,
    goalLabel: 'cards',
    trophyIds: ['trophy-collectors-item', 'trophy-best-in-the-west'],
    groups: sets.map((s) => ({
      id: `cards-${s.split(':')[1]}`,
      title: title(s),
      items: cards
        .filter((c) => c.set === s)
        .map((c) => ({
          id: c.id,
          label: c.name.replace(/\s*\(.*\)\s*$/, ''),
          detail: c.location,
          region: c.region,
          kind: 'check',
          available: c.availableFrom ? chapterLabel(c.availableFrom) : undefined,
          unverified: c.confidence === 'single-source' ? 'Only one source gives this location.' : undefined,
        })),
    })),
  });
}

function chapterLabel(a) {
  const s = String(a);
  if (/^[1-6]$/.test(s)) return `From Chapter ${s}`;
  if (/^E1$/i.test(s)) return 'Epilogue 1+';
  if (/^E2$/i.test(s)) return 'Epilogue 2+';
  if (/^epilogue$/i.test(s)) return 'Epilogue';
  return s.length <= 24 ? s : undefined;
}

// ------------- map geometry helpers
const toGame = (lat, lng) => ({ x: (lng - 111.29) / 0.01552, y: (lat + 63.6) / 0.01552 });
const allPins = new Map();
for (const p of R.maps.pins) {
  if (allPins.has(p.id)) err(`duplicate pin id ${p.id}`);
  allPins.set(p.id, p);
}
const labelPins = [...allPins.values()].filter((p) => ['towns', 'labels', 'camps', 'landmarks'].includes(p.set));
const compass = (dx, dy) => {
  const a = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
  return ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'][Math.round(a / 45) % 8];
};
function nearestPlace(pin) {
  let best = null;
  for (const l of labelPins) {
    const d = Math.hypot(l.x - pin.x, l.y - pin.y);
    if (!best || d < best.d) best = { l, d };
  }
  if (!best) return undefined;
  const cleanName = best.l.label.replace(/\s*\(.*\)\s*$/, '');
  if (best.d < 60) return `At ${cleanName}.`;
  return `Nearest named place on this map: ${cleanName}, about ${Math.round(best.d / 10) * 10} m to the ${compass(pin.x - best.l.x, pin.y - best.l.y)} of it.`;
}

// pinned collectible sets: pins are the checklist; guide directions attached where linked
function pinnedSet(set, pinSet, key, title, trophyIds, description) {
  const items = R.collectibles.collectibles.filter((c) => c.set === set);
  const pins = [...allPins.values()].filter((p) => p.set === pinSet).sort((a, b) => a.id.localeCompare(b.id));
  expectCount(key, items.length, `${set} written entries`);
  expectCount(key, pins.length, `${set} map pins`);
  const links = new Map();
  for (const l of pinLinks.links ?? []) {
    if (!items.some((i) => i.id === l.itemId)) continue;
    if (!allPins.has(l.pinId)) err(`pin-link to unknown pin ${l.pinId}`);
    if ([...links.values()].includes(l.itemId)) err(`item ${l.itemId} linked twice`);
    if (links.has(l.pinId)) err(`pin ${l.pinId} linked twice`);
    links.set(l.pinId, l.itemId);
  }
  const linkedItem = (pinId) => items.find((i) => i.id === links.get(pinId));
  const pinItems = pins.map((p, n) => {
    const it = linkedItem(p.id);
    const num = String(n + 1).padStart(2, '0');
    return {
      id: `${pinSet}-pin-${num}`,
      label: `${title.replace(/s$/, '')} ${num}${it ? ` · ${it.region ?? ''}` : ''}`.trim(),
      detail: [nearestPlace(p), it ? `Guide directions: ${it.location}` : undefined].filter(Boolean).join('\n'),
      kind: 'check',
      pinId: p.id,
      region: it?.region,
      available: it?.availableFrom ? chapterLabel(it.availableFrom) : undefined,
      _num: num,
    };
  });
  const pinNumByItem = new Map([...links.entries()].map(([pinId, itemId]) => [itemId, pinItems.find((pi) => pi.pinId === pinId)._num]));
  const regions = [...new Set(items.map((i) => i.region ?? 'Other'))];
  TR.push({
    id: key,
    title,
    short: title,
    description,
    goal: EXPECT[key],
    goalLabel: 'found',
    trophyIds,
    hasMap: true,
    mapNote: 'Pins are exact positions from an open (Unlicense) dataset.',
    groups: [
      {
        id: `${key}-pins`,
        title: 'Checklist: exact map positions',
        note: 'Numbers follow the map dataset, not the guides. Where the match is certain, the guide directions are shown too.',
        items: pinItems.map(({ _num, ...i }) => i),
      },
      ...regions.map((r) => ({
        id: `${key}-directions-${norm(r)}`,
        title: `Written directions: ${r}`,
        note: 'From the guides (for reading on arrival). Tick the matching pin above.',
        items: items
          .filter((i) => (i.region ?? 'Other') === r)
          .map((i) => ({
            id: `${i.id}-note`,
            label: i.name,
            detail: `${i.location}${pinNumByItem.has(i.id) ? `\nMatched to map pin ${pinNumByItem.get(i.id)}.` : ''}`,
            kind: 'note',
            available: i.availableFrom ? chapterLabel(i.availableFrom) : undefined,
            unverified: i.confidence === 'single-source' ? 'Only one source gives this location.' : undefined,
          })),
      })),
    ],
  });
}
pinnedSet('dinosaur-bones', 'dinosaur-bones', 'dinosaur-bones', 'Dinosaur Bones', ['trophy-collectors-item', 'trophy-best-in-the-west'], [
  'All 30 for "A Test of Faith" (a way to earn Collector\'s Item) and 100% completion. The 30th only registers after meeting Deborah MacGuiness. The 8 in New Austin are for the Epilogue.',
]);
pinnedSet('dreamcatchers', 'dreamcatchers', 'dreamcatchers', 'Dreamcatchers', ['trophy-best-in-the-west'], [
  'All 20 are needed for 100% completion. Dreamcatchers do not count for Collector\'s Item.',
]);
pinnedSet('rock-carvings', 'rock-carvings', 'rock-carvings', 'Rock Carvings', ['trophy-collectors-item', 'trophy-best-in-the-west'], [
  'All 10 for "Geology for Beginners": the quickest way to Collector\'s Item. Only 9 register before you meet Francis Sinclair.',
]);

// exotics
{
  const ex = R.collectibles.collectibles.filter((c) => c.set === 'exotics');
  expectCount('exotics-requests', ex.length, 'exotics requests');
  TR.push({
    id: 'exotics',
    title: 'Exotics (Duchesses and Other Animals)',
    short: 'Exotics',
    description: ['Five delivery lists for the collector in north Saint Denis, opening in Chapter 4. Each list opens after the previous one is handed in. Counts for Collector\'s Item and 100%.'],
    goal: 5,
    goalLabel: 'requests delivered',
    trophyIds: ['trophy-collectors-item', 'trophy-best-in-the-west'],
    groups: [{ id: 'exotics-requests', title: 'Requests', items: ex.map((e) => ({ id: e.id, label: e.name, detail: e.location, kind: 'check', available: chapterLabel(e.availableFrom ?? '') })) }],
  });
}

// legendary animals + fish (approximate pins, linked by name)
function linkByName(item, pinSet) {
  const want = norm(item.name.replace(/^legendary\s+/i, ''));
  const cands = [...allPins.values()].filter((p) => p.set === pinSet && norm(p.label.replace(/^legendary\s+/i, '')) === want);
  if (cands.length === 1) return cands[0].id;
  // tolerate "Big Horn" vs "Bighorn", "Bharati Grizzly Bear" vs "Bharati Grizzly"
  const loose = [...allPins.values()].filter((p) => p.set === pinSet && (norm(p.label).includes(want) || want.includes(norm(p.label.replace(/^legendary\s+/i, '')))));
  return loose.length === 1 ? loose[0].id : undefined;
}
{
  const la = R.wildlife.collectibles.filter((c) => c.set === 'legendary-animals');
  expectCount('legendary-animals', la.length, 'legendary animals');
  const items = la.map((a) => {
    const pinId = linkByName(a, 'legendary-animals');
    if (!pinId) warn(`legendary animal without pin: ${a.name}`);
    return { id: a.id, label: a.name.replace(/^Legendary /, ''), detail: `${a.location}${a.missableNote ? `\n${a.missableNote}` : ''}`, region: a.region, kind: 'check', pinId, available: a.availableFrom?.length < 28 ? a.availableFrom : undefined };
  });
  TR.push({
    id: 'legendary-animals',
    title: 'Legendary Animals',
    short: 'Legendary Animals',
    description: [
      'Any 5 kills count toward 100% completion (Best in the West). No trophy needs all 16. Map pins mark the hunting AREA only (approximate): study the clues on arrival.',
    ],
    goal: 5,
    goalLabel: 'killed (5 needed)',
    trophyIds: ['trophy-best-in-the-west'],
    hasMap: true,
    mapNote: 'Legendary pins are APPROXIMATE hunting areas, not spawn points.',
    groups: [{ id: 'legendary-animals-all', title: 'All 16', items }],
  });
}
{
  const lf = R.wildlife.collectibles.filter((c) => c.set === 'legendary-fish');
  const optional = (f) => /channel catfish|northern pike/i.test(f.name);
  expectCount('legendary-fish-required', lf.filter((f) => !optional(f)).length, 'required legendary fish');
  const items = lf.map((f) => {
    const pinId = linkByName(f, 'legendary-fish');
    if (!pinId) warn(`legendary fish without pin: ${f.name}`);
    return { id: f.id, label: f.name.replace(/^Legendary /, ''), detail: `${f.location}${f.availableFrom ? `\nAvailable: ${f.availableFrom}` : ''}`, region: f.region, kind: 'check', pinId, optional: optional(f) || undefined };
  });
  TR.push({
    id: 'legendary-fish',
    title: 'Legendary Fish',
    short: 'Legendary Fish',
    description: [
      'Catch and mail all 13 for Jeremy Gill ("A Fisher of Fish"), needed for 100% completion. A catch of 16 lb or more pops It Was THIS Big! along the way. Channel Catfish and Northern Pike are extras.',
      'Buy the special lures in Lagras first. Map pins mark the fishing AREA only (approximate).',
    ],
    goal: 13,
    goalLabel: 'caught (13 needed)',
    trophyIds: ['trophy-it-was-this-big', 'trophy-best-in-the-west'],
    hasMap: true,
    mapNote: 'Legendary pins are APPROXIMATE fishing areas.',
    groups: [{ id: 'legendary-fish-all', title: 'All legendary fish', items }],
  });
}

// zoologist + skin deep
{
  const sas = R.wildlife.collectibles.filter((c) => c.set === 'compendium-animals:study-and-skin');
  const so = R.wildlife.collectibles.filter((c) => c.set === 'compendium-animals:study');
  const nr = R.wildlife.collectibles.filter((c) => c.set === 'compendium-animals:not-required');
  expectCount('zoologist-required-species', sas.length + so.length, 'zoologist species');
  expectCount('skin-deep-required-species', sas.length, 'skin deep species');
  const it = (prefix) => (a) => ({
    id: `${prefix}-${a.id.replace(/^animal-/, '')}`,
    label: a.name.replace(/\s*\(compendium #\d+\)/, ''),
    detail: a.location.replace(/^Habitat per in-game compendium:\s*/, ''),
    kind: 'check',
    available: /epilogue/i.test(a.availableFrom ?? '') ? 'Epilogue' : undefined,
    unverified: a.confidence === 'single-source' ? 'Habitat text is the in-game compendium as quoted by one guide.' : undefined,
  });
  const alpha = (a, b) => a.name.localeCompare(b.name);
  TR.push({
    id: 'zoologist',
    title: 'Zoologist: study every animal',
    short: 'Zoologist',
    description: [
      'Study each species with binoculars. 152 species are required (legendary animals, the 8 Guarma-only birds/reptiles, the Carolina Parakeet and Rufus are reported as not required: see "Not required").',
      'If the trophy does not pop at 152, study the "not required" ones too.',
    ],
    goal: 152,
    goalLabel: 'species studied',
    trophyIds: ['trophy-zoologist'],
    groups: [
      { id: 'zoo-a', title: 'Required (A–Z)', items: [...sas, ...so].sort(alpha).map(it('study')) },
      { id: 'zoo-optional', title: 'Reported as not required', items: nr.sort(alpha).map((a) => ({ ...it('study')(a), optional: true })) },
    ],
  });
  TR.push({
    id: 'skin-deep',
    title: 'Skin Deep: skin every species',
    short: 'Skin Deep',
    description: [
      'Skin one of every wild skinnable species: 71 (livestock, pets, horses, legendary and Guarma animals excluded). A perfect pelt is not needed.',
      'The community list behind 71 is not official; if the trophy does not pop, skin one of each farm animal too.',
    ],
    goal: 71,
    goalLabel: 'species skinned',
    trophyIds: ['trophy-skin-deep'],
    groups: [{ id: 'skin-a', title: 'Required (A–Z)', items: sas.sort(alpha).map(it('skin')) }],
  });
}

// strangers (mirror route steps)
{
  const strands = [...missions.values()].filter((m) => m.type === 'stranger');
  const eligible = strands.filter((m) => (m.missableNotes ?? []).some((n) => /^Counts toward Western Stranger/.test(n)));
  expectCount('stranger-strands-eligible-western-stranger', eligible.length, 'Western Stranger eligible strands');
  const item = (m) => ({
    id: `stranger-${m.id.replace(/^mission-/, '')}`,
    label: m.name,
    detail: (m.missableNotes ?? []).join(' '),
    kind: 'check',
    stepId: byMissionStep(m.id),
    available: chapterLabel(m.chapter),
  });
  TR.push({
    id: 'strangers',
    title: 'Stranger Missions',
    short: 'Strangers',
    description: [
      '10 of the 22 eligible strands are needed for Western Stranger and 100% completion. The in-game counter can lag: some players needed 12 or more, so do a few extra.',
      'Items here mirror the route steps, so ticking either place ticks both.',
    ],
    goal: 10,
    goalLabel: 'eligible strands done (10 needed)',
    trophyIds: ['trophy-western-stranger', 'trophy-best-in-the-west'],
    groups: [
      { id: 'strangers-eligible', title: 'Count toward Western Stranger', items: eligible.map(item) },
      { id: 'strangers-other', title: 'Do not count', items: strands.filter((m) => !eligible.includes(m)).map((m) => ({ ...item(m), optional: true })) },
    ],
  });
  for (const i of TR.at(-1).groups.flatMap((g) => g.items)) if (!i.stepId) warn(`stranger tracker item not linked to a route step: ${i.id}`);
}

// lending a hand (mirror route steps)
{
  const las = steps.filter((s) => (s.counts ?? []).includes('trophy-lending-a-hand') && s.type !== 'warning' && s.type !== 'info');
  TR.push({
    id: 'lending-a-hand',
    title: 'Lending a Hand (honor missions)',
    short: 'Lending a Hand',
    description: ['Every optional Honor mission in Chapters 2, 3, 4 and 6. MISSABLE: each chapter\'s set is lost when the chapter ends. These mirror the route steps.'],
    goal: las.length,
    goalLabel: 'honor missions',
    trophyIds: ['trophy-lending-a-hand'],
    groups: PART_ORDER.filter((p) => las.some((s) => s.partId === p)).map((p) => ({
      id: `lah-${p}`,
      title: parts.find((x) => x.id === p).title,
      items: las.filter((s) => s.partId === p).map((s) => ({ id: `lah-${s.id}`, label: s.title, kind: 'check', stepId: s.id, detail: s.missable ? `Cut-off: ${s.missable.deadline}` : undefined })),
    })),
  });
}

// graves (pins linked by the raw names in datasetRef; labels spoiler-safe)
{
  const graveTrophy = trophyMap.get('trophy-paying-respects');
  const gravePins = [...allPins.values()].filter((p) => p.set === 'graves');
  expectCount('grave-sites', gravePins.length, 'grave pins');
  const text = graveTrophy.howTo.join(' ');
  // "Hosea and Lenny (together, Bluewater Marsh area north of Saint Denis" etc.
  const graveItems = [];
  for (const e of text.replace(/^.*?graves:\s*/i, '').split(/,\s*(?=[A-Z][a-z]+(?: (?:and )?[A-Z][a-z]+)* \()/)) {
    const mm = e.match(/^([A-Z][a-z]+(?: (?:and )?[A-Z][a-z]+)*) \((.*?)\)?\.?$/);
    if (!mm) continue;
    graveItems.push({ names: mm[1], where: mm[2] });
  }
  if (graveItems.length !== 8) err(`graves: parsed ${graveItems.length} grave sites from research text, expected 8`);
  const items = graveItems.map((g, n) => {
    const firstName = g.names.split(' and ')[0].toLowerCase();
    const pin = gravePins.find((p) => norm(p.datasetRef).includes(norm(firstName)));
    if (!pin) warn(`grave without pin: ${g.names}`);
    return {
      id: `grave-${norm(g.names.split(' and ')[0])}`,
      label: `Grave site ${n + 1}: ${g.where.replace(/^together,\s*/i, '')}`,
      spoilerLabel: `Grave site ${n + 1}: ${g.names} (${g.where})`,
      kind: 'check',
      pinId: pin?.id,
      available: 'After the story',
    };
  });
  TR.push({
    id: 'graves',
    title: 'Paying Respects (graves)',
    short: 'Graves',
    description: ['After the story, visit and pay respects at 9 graves in 8 places. Names are story spoilers and stay hidden behind the spoiler shield.'],
    goal: 8,
    goalLabel: 'grave sites',
    trophyIds: ['trophy-paying-respects', 'trophy-best-in-the-west'],
    hasMap: true,
    mapNote: 'Grave pins are exact positions from an open (Unlicense) dataset.',
    groups: [{ id: 'graves-all', title: 'Grave sites', items }],
  });
}

// homesteads
{
  const t = trophyMap.get('trophy-breaking-and-entering');
  const line = t.howTo.find((h) => /Loot 4 of these 7/.test(h)) ?? '';
  const list = line.replace(/^.*?:\s*/, '').replace(/\.$/, '');
  const hs = list.split(/,\s*(?=[A-Z])/).map((s) => {
    const mm = s.match(/^(.*?) \((.*)\)$/);
    return mm ? { name: mm[1], how: mm[2] } : { name: s, how: '' };
  });
  expectCount('homesteads', hs.length, 'homesteads parsed from research');
  TR.push({
    id: 'homesteads',
    title: 'Breaking and Entering',
    short: 'Homesteads',
    description: ['Recover the stash from any 4 of these 7 homesteads. Save before each one; loot everything in the house or the counter may not register.'],
    goal: 4,
    goalLabel: 'stashes (4 needed)',
    trophyIds: ['trophy-breaking-and-entering'],
    groups: [{ id: 'homesteads-all', title: 'Homesteads', items: hs.map((h) => ({ id: `homestead-${norm(h.name)}`, label: h.name, detail: h.how, kind: 'check' })) }],
  });
}

// treasure hunts
{
  const th = R.collectibles.collectibles.filter((c) => c.set.startsWith('treasure-hunts:'));
  expectCount('treasure-hunt-steps', th.length, 'treasure hunt steps');
  const chains = [...new Set(th.map((c) => c.set))];
  TR.push({
    id: 'treasure-hunts',
    title: 'Treasure Hunts',
    short: 'Treasure',
    description: ['One full chain is needed for 100%; the Explorer challenges need three chains (Jack Hall Gang, Poisonous Trail, High Stakes).'],
    goal: th.length,
    goalLabel: 'stages',
    trophyIds: ['trophy-best-in-the-west'],
    groups: chains.map((ch) => ({
      id: `th-${ch.split(':')[1]}`,
      title: ch.split(':')[1].split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '),
      items: th.filter((c) => c.set === ch).map((c) => ({ id: c.id, label: c.name, detail: c.location, kind: 'check', region: c.region, available: chapterLabel(c.availableFrom ?? '') })),
    })),
  });
}

// hobby horse
TR.push({
  id: 'hobby-horse',
  title: 'Hobby Horse (table games)',
  short: 'Table Games',
  description: ['Join one game of each; you do not need to win. Check Pause > Progress > Total Completion > Table Games.'],
  goal: 4,
  goalLabel: 'games played',
  trophyIds: ['trophy-hobby-horse', 'trophy-best-in-the-west'],
  groups: [
    {
      id: 'hobby-all',
      title: 'Games',
      items: [
        { id: 'hobby-poker', label: 'Poker', detail: 'For example a Saint Denis saloon (Chapter 4+), or other saloon tables.', kind: 'check' },
        { id: 'hobby-blackjack', label: 'Blackjack', detail: 'For example the Rhodes saloon.', kind: 'check' },
        { id: 'hobby-dominoes', label: 'Dominoes', detail: 'For example the park table in Saint Denis.', kind: 'check' },
        { id: 'hobby-five-finger-fillet', label: 'Five Finger Fillet', detail: 'For example in Strawberry.', kind: 'check' },
      ],
    },
  ],
});

// grind counters
TR.push({
  id: 'grind',
  title: 'Grind Counters',
  short: 'Grind',
  description: ['Running totals for the trophies that build up over time. Use + and − to keep count; the game only shows some of these.'],
  goal: 7,
  goalLabel: 'goals met',
  trophyIds: ['trophy-take-from-the-rich', 'trophy-pony-up', 'trophy-grin-and-bear-it', 'trophy-self-sufficient', 'trophy-bountiful', 'trophy-extreme-personality', 'trophy-trusty-steed'],
  groups: [
    {
      id: 'grind-counters',
      title: 'Counters',
      items: [
        { id: 'grind-take-from-the-rich', label: 'Take from the Rich: rob or loot', kind: 'counter', target: 250, unit: '$' },
        { id: 'grind-pony-up', label: 'Pony Up: spend across shops', kind: 'counter', target: 5000, unit: '$' },
        { id: 'grind-grin-and-bear-it', label: 'Grin and Bear it: bear attacks survived (bear killed)', kind: 'counter', target: 18 },
        { id: 'grind-self-sufficient', label: 'Self Sufficient: different items crafted', kind: 'counter', target: 30, detail: '30 different recipes, not 30 crafts.' },
      ],
    },
    {
      id: 'grind-bountiful',
      title: 'Bountiful: $250 bounty in every state, held 3 days',
      items: ['Lemoyne', 'New Hanover', 'West Elizabeth', 'Ambarino', 'New Austin'].map((s) => ({ id: `bounty-${norm(s)}`, label: `$250+ bounty in ${s}`, kind: 'check' })),
    },
    {
      id: 'grind-other',
      title: 'Milestones',
      items: [
        { id: 'grind-extreme-personality', label: 'Extreme Personality: maximum (or minimum) Honor reached', kind: 'check' },
        { id: 'grind-trusty-steed', label: 'Trusty Steed: bonding level 4 with a horse', kind: 'check' },
      ],
    },
  ],
});

// 100% completion (links to other trackers + counters)
{
  const link = (id, label) => ({ id: `pct-${id}`, label, kind: 'link', trackerId: id });
  const cnt = (id, label, target) => ({ id: `pct-${id}`, label, kind: 'counter', target });
  const chk = (id, label) => ({ id: `pct-${id}`, label, kind: 'check' });
  TR.push({
    id: 'completion',
    title: 'Best in the West (100%)',
    short: '100% Completion',
    description: [
      'Everything Pause > Progress > Total Completion asks for. Rows that point at another tracker fill in from it. Nothing here is missable; most people finish it after the story.',
    ],
    goal: 0,
    goalLabel: 'categories',
    trophyIds: ['trophy-best-in-the-west'],
    groups: [
      { id: 'pct-story', title: 'Story & side', items: [chk('story', 'All story missions'), link('strangers', '10 Stranger strands'), cnt('bounties', 'Bounties', 5), cnt('random-encounters', 'Random encounters', 25), cnt('gang-ambush', 'Gang ambush', 1), cnt('gang-hideouts', 'Gang hideouts (Thieves Landing and Fort Mercer are Epilogue)', 6)] },
      {
        id: 'pct-collect',
        title: 'Collectibles',
        items: [
          cnt('points-of-interest', 'Point of interest', 1),
          link('graves', 'Graves'),
          cnt('card-set', 'One complete cigarette card set', 1),
          link('dinosaur-bones', 'Dinosaur bones'),
          link('legendary-fish', 'Legendary fish'),
          link('exotics', 'Exotics requests'),
          link('rock-carvings', 'Rock carvings'),
          cnt('hunting-requests', 'Hunting requests (Ms. Hobbs)', 5),
          cnt('treasure-chain', 'One full treasure map chain', 1),
          link('dreamcatchers', 'Dreamcatchers'),
        ],
      },
      {
        id: 'pct-compendium',
        title: 'Compendium',
        items: [cnt('animals', 'Animals', 50), cnt('equipment', 'Equipment', 10), cnt('fish', 'Fish', 10), cnt('gangs', 'Gangs', 6), cnt('horse-breeds', 'Horse breeds', 10), cnt('plants', 'Plants', 20), cnt('weapons', 'Weapons', 48)],
      },
      {
        id: 'pct-misc',
        title: 'Skills & misc',
        items: [
          chk('cores', 'Health, Stamina and Dead Eye at level 10'),
          chk('bonding', 'Horse bonding level 4'),
          link('challenges', 'All 90 challenges'),
          cnt('shacks', 'Shacks', 5),
          link('legendary-animals', '5 legendary animals'),
          link('hobby-horse', 'Each table game once'),
          cnt('ranters', 'Ranters and ravers', 5),
          chk('bath', 'Take a bath'),
          chk('show', 'Watch a show'),
          chk('theatre', 'Watch a Théâtre Râleur show'),
          cnt('recipes', 'Craft one of each of 6 recipe types', 6),
          chk('rob-coach', 'Rob a coach'),
          chk('rob-home', 'Rob a home'),
          chk('rob-shop', 'Rob a shop'),
          chk('rob-train', 'Rob a train'),
        ],
      },
    ],
  });
  const c = TR.at(-1);
  c.goal = c.groups.reduce((a, g) => a + g.items.length, 0);
}

// ---------------------------------------------------------------- tracker validation
const trackerIds = new Set();
const itemIds = new Set();
for (const t of TR) {
  if (trackerIds.has(t.id)) err(`duplicate tracker ${t.id}`);
  trackerIds.add(t.id);
  t.hasMap = t.groups.some((g) => g.items.some((i) => i.pinId));
  for (const tid of t.trophyIds) if (!trophyMap.has(tid)) err(`tracker ${t.id}: unknown trophy ${tid}`);
  for (const g of t.groups) {
    for (const i of g.items) {
      if (itemIds.has(i.id)) err(`duplicate tracker item id ${i.id}`);
      if (stepIds.has(i.id)) err(`tracker item id collides with a step id: ${i.id}`);
      itemIds.add(i.id);
      if (i.pinId && !allPins.has(i.pinId)) err(`item ${i.id}: unknown pin ${i.pinId}`);
      if (i.stepId && !stepIds.has(i.stepId)) err(`item ${i.id}: unknown step ${i.stepId}`);
    }
  }
}
for (const t of TR) for (const g of t.groups) for (const i of g.items) if (i.kind === 'link' && !trackerIds.has(i.trackerId)) err(`link to unknown tracker ${i.trackerId}`);

// Step counts -> trophies / trackers
for (const s of steps) {
  s.trackers = [];
  const trophyCounts = [];
  for (const c of s.counts ?? []) {
    if (c.startsWith('tracker:')) {
      const id = c.slice(8);
      if (!trackerIds.has(id)) err(`step ${s.id}: unknown tracker ${id}`);
      else if (!s.trackers.includes(id)) s.trackers.push(id);
    } else if (c.startsWith('trophy-')) {
      if (!trophyMap.has(c)) err(`step ${s.id}: unknown trophy ${c}`);
      else if (!trophyCounts.includes(c)) trophyCounts.push(c);
    } else err(`step ${s.id}: bad counts entry ${c}`);
  }
  s.counts = trophyCounts;
}

// Coverage: every trophy is counted by a route step; online ones exactly once in the online part
for (const t of trophies) {
  const by = steps.filter((s) => s.counts.includes(t.id));
  if (!by.length) err(`trophy not counted by any route step: ${t.id}`);
  if (t.online && by.filter((s) => s.partId === 'online').length !== 1) err(`online trophy ${t.id} not counted exactly once in the online part`);
}
const last = steps.at(-1);
if (!last.counts.includes('trophy-legend-of-the-west')) err('the last route step must be the platinum');

// ---------------------------------------------------------------- final step objects
const outSteps = steps.map((s) => {
  const m = s.missionId ? missions.get(s.missionId) : undefined;
  const o = {
    id: s.id,
    partId: s.partId,
    type: s.type,
    title: s.title,
    missionName: m && norm(m.name) !== norm(s.title) ? m.name : undefined,
    where: s.where,
    before: s.before?.length ? s.before : undefined,
    how: s.how,
    gold: m?.goldRequirements?.length ? m.goldRequirements : undefined,
    goldTips: m?.goldTips?.length ? m.goldTips : undefined,
    counts: s.counts,
    trackers: s.trackers,
    tip: s.tip,
    missable: s.missable ? { deadline: s.missable.deadline } : undefined,
    spoiler: s.spoiler?.length ? s.spoiler : undefined,
    unverified: s.unverified,
    optional: s.optional || undefined,
    sources: s.sources,
  };
  return JSON.parse(JSON.stringify(o));
});

const outTrophies = trophies.map((t) => ({
  id: t.id,
  name: t.name,
  description: t.officialDescription,
  grade: t.grade,
  hidden: !!t.hidden,
  online: !!t.online,
  missable: !!t.missable,
  missableDeadline: t.missableDeadline,
  howTo: t.howTo ?? [],
  tips: t.tips ?? [],
  stepIds: steps.filter((s) => s.counts.includes(t.id)).map((s) => s.id),
  trackerIds: TR.filter((tr) => tr.trophyIds.includes(t.id)).map((tr) => tr.id),
}));
const gradeOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
outTrophies.sort((a, b) => Number(a.online) - Number(b.online) || gradeOrder[a.grade] - gradeOrder[b.grade] || a.name.localeCompare(b.name));

// ---------------------------------------------------------------- map
const usedPinIds = new Set(TR.flatMap((t) => t.groups.flatMap((g) => g.items.map((i) => i.pinId).filter(Boolean))));
// show every exact pin of the pinned sets even if unticked-unlinked (they are all items anyway)
const pinsOut = {};
for (const id of usedPinIds) {
  const p = allPins.get(id);
  pinsOut[id] = { id, label: p.label, set: p.set, x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10, approximate: !!p.approximate };
}
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts.at(-1)];
  let idx = -1;
  let dmax = 0;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dy * pts[i].x - dx * pts[i].y + b.x * a.y - b.y * a.x) / len;
    if (d > dmax) (dmax = d), (idx = i);
  }
  if (dmax <= eps) return [a, b];
  return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)];
}
const bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
const grow = (p) => {
  bounds.minX = Math.min(bounds.minX, p.x);
  bounds.maxX = Math.max(bounds.maxX, p.x);
  bounds.minY = Math.min(bounds.minY, p.y);
  bounds.maxY = Math.max(bounds.maxY, p.y);
};
function linesToPath(file) {
  const gj = readJson(path.join(RAW, 'mapdata', 'collectorsmap_geojson', file));
  let d = '';
  for (const f of gj.features) {
    const g = f.geometry;
    const lines = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
    for (const line of lines) {
      const pts = rdp(line.map(([lng, lat]) => toGame(lat, lng)), 12);
      pts.forEach(grow);
      d += pts.map((p, i) => `${i ? 'L' : 'M'}${Math.round(p.x)} ${Math.round(-p.y)}`).join('');
    }
  }
  return d;
}
const roads = ['ambarino', 'new-hanover', 'lemoyne', 'west-elizabeth', 'new-austin'].map((r) => linesToPath(`${r}.json`)).join('');
const rail = linesToPath('railroads.json');
Object.values(pinsOut).forEach(grow);
const labels = labelPins.map((l) => ({ text: l.label.replace(/\s*\(.*\)\s*$/, ''), x: Math.round(l.x), y: Math.round(l.y), kind: l.set === 'towns' ? 'town' : 'place' }));
labels.forEach(grow);
const pad = 250;
for (const k of ['minX', 'minY']) bounds[k] = Math.floor(bounds[k] - pad);
for (const k of ['maxX', 'maxY']) bounds[k] = Math.ceil(bounds[k] + pad);

// ---------------------------------------------------------------- issues (disputes + unverified)
const issues = [];
for (const [area, d] of Object.entries(research)) {
  (d.disputes ?? []).forEach((x, i) =>
    issues.push({
      id: `${area}-${i + 1}`,
      area,
      topic: x.topic,
      details: x.details,
      positions: (x.positions ?? []).map((p) => ({ claim: p.claim, sources: (p.sources ?? []).map((s) => (sources[`${area}#${s}`] ? `${area}#${s}` : s)) })),
      handling: x.suggestedHandling ?? '',
    }),
  );
}
for (const s of steps.filter((s) => s.unverified)) {
  issues.push({ id: `step-${s.id}`, area: `route:${s.partId}`, topic: s.title, details: s.unverified, positions: [], handling: 'Shown on the step as "Not fully verified".' });
}
for (const l of pinLinks.unlinked ?? []) {
  /* recorded in docs only */
}

// ---------------------------------------------------------------- output
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log('  ⚠ ' + w);
}
if (errors.length) {
  console.error(`\n✖ BUILD FAILED: ${errors.length} error(s):`);
  for (const e of errors) console.error('  ✖ ' + e);
  process.exit(1);
}

const pkg = readJson(path.join(ROOT, 'package.json'));
const guide = {
  version: pkg.version,
  builtAt: new Date().toISOString().slice(0, 10),
  parts,
  steps: outSteps,
  trophies: outTrophies,
  trackers: TR.map((t) => JSON.parse(JSON.stringify(t))),
  pins: pinsOut,
  map: {
    bounds,
    roads,
    rail,
    labels,
    credit: 'Positions: jeanropke/RDOMap and roads/rail: jeanropke/RDR2CollectorsMap (both released under The Unlicense). Map drawn by this app; no game artwork.',
  },
  sources,
  issues,
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(guide));

// docs/UNVERIFIED.md
const lines = ['# Unverified and disputed items', '', `Generated by \`scripts/build-content.mjs\` on ${guide.builtAt}. The app shows the same list under Settings → Unverified & Disputed.`, ''];
const byArea = {};
for (const i of issues) (byArea[i.area] ??= []).push(i);
for (const [area, list] of Object.entries(byArea)) {
  lines.push(`## ${area}`, '');
  for (const i of list) {
    lines.push(`- **${i.topic}**: ${i.details}`);
    for (const p of i.positions) lines.push(`  - ${p.claim} _(${p.sources.join(', ')})_`);
    if (i.handling) lines.push(`  - Handling: ${i.handling}`);
  }
  lines.push('');
}
lines.push('## Map pins not matched to written directions', '');
lines.push('These collectibles have exact map pins but the pin-to-directions match could not be proven, so the app lists pins and written directions separately:', '');
for (const u of pinLinks.unlinked ?? []) lines.push(`- ${u.itemId}: ${u.reason}`);
fs.mkdirSync(path.dirname(DOC), { recursive: true });
fs.writeFileSync(DOC, lines.join('\n') + '\n');

const tItems = TR.reduce((a, t) => a + t.groups.reduce((b, g) => b + g.items.length, 0), 0);
console.log(`\n✔ guide.json: ${parts.length} parts, ${outSteps.length} steps, ${outTrophies.length} trophies, ${TR.length} trackers (${tItems} items), ${Object.keys(pinsOut).length} pins, ${labels.length} labels, ${issues.length} issues`);
console.log(`  size ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
