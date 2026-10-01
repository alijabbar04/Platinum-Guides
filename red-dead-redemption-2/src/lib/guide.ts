import raw from '../data/guide.json';
import type { Guide, Step, Tracker, TrackerItem, Trophy } from '../data/types';
import type { ProgressState } from './progress';

export const guide = raw as unknown as Guide;

export const stepById = new Map<string, Step>(guide.steps.map((s) => [s.id, s]));
export const trophyById = new Map<string, Trophy>(guide.trophies.map((t) => [t.id, t]));
export const trackerById = new Map<string, Tracker>(guide.trackers.map((t) => [t.id, t]));
export const partById = new Map(guide.parts.map((p) => [p.id, p]));

export const itemIndex = new Map<string, { tracker: Tracker; item: TrackerItem; groupTitle: string }>();
for (const t of guide.trackers) {
  for (const g of t.groups) for (const item of g.items) itemIndex.set(item.id, { tracker: t, item, groupTitle: g.title });
}

// Which tracker item is pinned to a map pin (for ticking from the map)
export const itemByPin = new Map<string, TrackerItem>();
for (const t of guide.trackers) for (const g of t.groups) for (const i of g.items) if (i.pinId) itemByPin.set(i.pinId, i);

export function isStepDone(p: ProgressState, id: string) {
  return p.checks[id] !== undefined;
}

export function isItemDone(p: ProgressState, item: TrackerItem): boolean {
  if (item.kind === 'note') return false;
  if (item.kind === 'link') {
    const t = item.trackerId ? trackerById.get(item.trackerId) : undefined;
    return !!t && trackerProgress(p, t).fraction >= 1;
  }
  if (item.stepId) return p.checks[item.stepId] !== undefined;
  if (item.kind === 'counter') return (p.counters[item.id] ?? 0) >= (item.target ?? 1);
  return p.checks[item.id] !== undefined;
}

/** Progress units for a tracker: counters contribute their value (capped), checks 1 each. */
export function trackerProgress(p: ProgressState, t: Tracker): { done: number; goal: number; fraction: number } {
  let done = 0;
  let total = 0;
  for (const g of t.groups) {
    for (const i of g.items) {
      if (i.optional || i.kind === 'note') continue;
      if (i.kind === 'link') {
        const lt = i.trackerId ? trackerById.get(i.trackerId) : undefined;
        total += 1;
        if (lt) done += trackerProgress(p, lt).fraction;
      } else if (i.kind === 'counter') {
        const target = i.target ?? 1;
        total += 1;
        done += Math.min(p.counters[i.id] ?? 0, target) / target;
      } else {
        total += 1;
        if (isItemDone(p, i)) done += 1;
      }
    }
  }
  const goal = Math.min(t.goal, total) || total;
  return { done: Math.min(done, goal), goal, fraction: goal ? Math.min(done / goal, 1) : 0 };
}

export function trophyProgress(p: ProgressState, t: Trophy) {
  if (p.checks[t.id] !== undefined) return 1;
  const parts: number[] = [];
  // Trophies with a dedicated tracker are measured by it; otherwise by the route steps that count.
  if (!t.trackerIds.length) {
    const steps = t.stepIds;
    if (steps.length) parts.push(steps.filter((s) => p.checks[s] !== undefined).length / steps.length);
  }
  for (const tid of t.trackerIds) {
    const tr = trackerById.get(tid);
    if (tr) parts.push(trackerProgress(p, tr).fraction);
  }
  if (!parts.length) return 0;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

export function routeProgress(p: ProgressState) {
  const total = guide.steps.length;
  const done = guide.steps.filter((s) => p.checks[s.id] !== undefined).length;
  return { done, total };
}

export function trophiesUnlocked(p: ProgressState) {
  return guide.trophies.filter((t) => p.checks[t.id] !== undefined).length;
}

export function firstUnticked(p: ProgressState, ids: string[]) {
  return ids.find((id) => p.checks[id] === undefined);
}
