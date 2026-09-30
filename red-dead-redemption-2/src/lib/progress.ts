// Progress store: ticks and counters keyed by stable content IDs.
// Saved to AsyncStorage (survives app restarts and in-place updates) on every change,
// debounced, and flushed immediately when the app goes to the background.
// Unknown IDs are kept, so a content update that renames nothing never loses ticks,
// and ticks for removed content come back if that content returns.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { useSyncExternalStore } from 'react';
import type { ThemeName } from './theme';

const KEY = 'rdr2-ledger/progress/v1';
export const BACKUP_APP_ID = 'rdr2-platinum-ledger';
export const BACKUP_SCHEMA = 1;

export type Settings = {
  theme: ThemeName;
  spoilerShield: boolean;
  missablesOnly: boolean;
};

export type ProgressState = {
  checks: Record<string, number>; // id -> time ticked (ms)
  counters: Record<string, number>;
  settings: Settings;
  loaded: boolean;
};

const defaultSettings: Settings = { theme: 'lamplight', spoilerShield: true, missablesOnly: false };

let state: ProgressState = { checks: {}, counters: {}, settings: defaultSettings, loaded: false };
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  listeners.forEach((l) => l());
}

function set(next: Partial<ProgressState>) {
  state = { ...state, ...next };
  emit();
  scheduleSave();
}

function serialise() {
  return JSON.stringify({ checks: state.checks, counters: state.counters, settings: state.settings });
}

function scheduleSave() {
  if (!state.loaded) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 250);
}

export async function flush() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (!state.loaded) return;
  try {
    await AsyncStorage.setItem(KEY, serialise());
  } catch (e) {
    console.warn('Saving progress failed', e);
  }
}

export async function loadProgress() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = {
        checks: isRecord(parsed.checks) ? parsed.checks : {},
        counters: isRecord(parsed.counters) ? parsed.counters : {},
        settings: { ...defaultSettings, ...(isRecord(parsed.settings) ? parsed.settings : {}) },
        loaded: true,
      };
    } else {
      state = { ...state, loaded: true };
    }
  } catch (e) {
    console.warn('Loading progress failed', e);
    state = { ...state, loaded: true };
  }
  emit();
}

AppState.addEventListener('change', (s) => {
  if (s !== 'active') flush();
});

function isRecord(v: unknown): v is Record<string, any> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getState() {
  return state;
}

export function useProgress() {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function isChecked(id: string) {
  return state.checks[id] !== undefined;
}

export function setChecked(id: string, on: boolean) {
  const checks = { ...state.checks };
  if (on) checks[id] = Date.now();
  else delete checks[id];
  set({ checks });
}

export function toggle(id: string) {
  setChecked(id, !isChecked(id));
}

export function setCounter(id: string, value: number) {
  const counters = { ...state.counters };
  if (value <= 0) delete counters[id];
  else counters[id] = value;
  set({ counters });
}

export function updateSettings(patch: Partial<Settings>) {
  set({ settings: { ...state.settings, ...patch } });
}

export function resetProgress() {
  set({ checks: {}, counters: {} });
}

// ---- Backup -------------------------------------------------------------

export type Backup = {
  app: string;
  schema: number;
  exportedAt: string;
  guideVersion: string;
  checks: Record<string, number>;
  counters: Record<string, number>;
  settings?: Partial<Settings>;
};

export function makeBackup(guideVersion: string): Backup {
  return {
    app: BACKUP_APP_ID,
    schema: BACKUP_SCHEMA,
    exportedAt: new Date().toISOString(),
    guideVersion,
    checks: state.checks,
    counters: state.counters,
    settings: state.settings,
  };
}

export function parseBackup(text: string): Backup {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!isRecord(data) || data.app !== BACKUP_APP_ID) {
    throw new Error('That file is not a backup from this guide.');
  }
  if (typeof data.schema !== 'number' || data.schema > BACKUP_SCHEMA) {
    throw new Error('That backup was made by a newer version of the app. Update the app first.');
  }
  const checks: Record<string, number> = {};
  if (isRecord(data.checks)) {
    for (const [k, v] of Object.entries(data.checks)) {
      if (typeof v === 'number') checks[k] = v;
    }
  }
  const counters: Record<string, number> = {};
  if (isRecord(data.counters)) {
    for (const [k, v] of Object.entries(data.counters)) {
      if (typeof v === 'number' && v > 0) counters[k] = Math.floor(v);
    }
  }
  return {
    app: data.app,
    schema: data.schema,
    exportedAt: String(data.exportedAt ?? ''),
    guideVersion: String(data.guideVersion ?? ''),
    checks,
    counters,
    settings: isRecord(data.settings) ? data.settings : undefined,
  };
}

export function applyBackup(b: Backup, mode: 'replace' | 'merge') {
  if (mode === 'replace') {
    set({ checks: { ...b.checks }, counters: { ...b.counters } });
  } else {
    const counters = { ...state.counters };
    for (const [k, v] of Object.entries(b.counters)) counters[k] = Math.max(counters[k] ?? 0, v);
    set({ checks: { ...b.checks, ...state.checks }, counters });
  }
  flush();
}
