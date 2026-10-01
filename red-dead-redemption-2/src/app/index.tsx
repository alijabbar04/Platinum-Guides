import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Part, Step } from '../data/types';
import { guide, routeProgress, stepById, trophiesUnlocked } from '../lib/guide';
import { getState, setChecked, updateSettings, useProgress } from '../lib/progress';
import { usePalette } from '../lib/useTheme';
import { StepCard } from '../components/StepCard';
import { PartHeader } from '../components/PartHeader';
import { offerUndo, UndoBar } from '../components/UndoBar';
import { Bar, T } from '../components/ui';
import { DownIcon, FilterIcon, GearIcon, LedgerIcon, SearchIcon, TrophyIcon } from '../components/icons';
import { fonts } from '../lib/theme';

type Row = { kind: 'part'; part: Part; index: number; key: string } | { kind: 'step'; step: Step; key: string };

export default function RouteScreen() {
  const c = usePalette();
  const p = useProgress();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ focus?: string; t?: string }>();
  const list = useRef<FlatList<Row>>(null);
  const landed = useRef(false);
  const missablesOnly = p.settings.missablesOnly;

  const rows = useMemo(() => {
    const out: Row[] = [];
    guide.parts.forEach((part, index) => {
      const steps = part.stepIds
        .map((id) => stepById.get(id)!)
        .filter((s) => !missablesOnly || s.missable || s.type === 'warning');
      if (!steps.length) return;
      out.push({ kind: 'part', part, index, key: `part-${part.id}` });
      for (const step of steps) out.push({ kind: 'step', step, key: step.id });
    });
    return out;
  }, [missablesOnly]);

  const partCounts = useMemo(() => {
    const m = new Map<string, { done: number; total: number }>();
    for (const part of guide.parts) {
      const done = part.stepIds.filter((id) => p.checks[id] !== undefined).length;
      m.set(part.id, { done, total: part.stepIds.length });
    }
    return m;
  }, [p.checks]);

  const scrollToRow = useCallback((index: number, animated = true) => {
    if (index < 0) return;
    list.current?.scrollToIndex({ index, animated, viewOffset: 8 });
  }, []);

  const indexOfStep = useCallback((id: string) => rows.findIndex((r) => r.kind === 'step' && r.step.id === id), [rows]);

  const nextIndex = useCallback(() => rows.findIndex((r) => r.kind === 'step' && p.checks[r.step.id] === undefined), [rows, p.checks]);

  // Land on the next unticked step when the app opens.
  useEffect(() => {
    if (!p.loaded || landed.current) return;
    landed.current = true;
    const i = nextIndex();
    if (i > 0) {
      // the row before is the part header when i is the first step of a part
      const target = rows[i - 1]?.kind === 'part' ? i - 1 : i;
      setTimeout(() => scrollToRow(target, false), 50);
    }
  }, [p.loaded, nextIndex, rows, scrollToRow]);

  // After switching the missables filter, jump to the next unticked step in the new list.
  const firstFilterRun = useRef(true);
  useEffect(() => {
    if (firstFilterRun.current) {
      firstFilterRun.current = false;
      return;
    }
    const i = nextIndex();
    const t = setTimeout(() => (i >= 0 ? scrollToRow(rows[i - 1]?.kind === 'part' ? i - 1 : i, false) : list.current?.scrollToOffset({ offset: 0 })), 60);
    return () => clearTimeout(t);
  }, [missablesOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  // Jump to a specific step (from search / trophies).
  useEffect(() => {
    if (!params.focus) return;
    if (missablesOnly && !rows.some((r) => r.key === params.focus)) updateSettings({ missablesOnly: false });
    const t = setTimeout(() => scrollToRow(indexOfStep(params.focus!)), 120);
    return () => clearTimeout(t);
  }, [params.focus, params.t]); // eslint-disable-line react-hooks/exhaustive-deps

  const onToggle = useCallback((step: Step) => {
    const wasDone = getState().checks[step.id] !== undefined;
    setChecked(step.id, !wasDone);
    if (!wasDone) offerUndo(`Ticked: ${step.title}`, () => setChecked(step.id, false));
    else offerUndo(`Unticked: ${step.title}`, () => setChecked(step.id, true));
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Row }) => {
      if (item.kind === 'part') {
        const pc = partCounts.get(item.part.id)!;
        return <PartHeader part={item.part} index={item.index} done={pc.done} total={pc.total} />;
      }
      return <StepCard step={item.step} done={p.checks[item.step.id] !== undefined} onToggle={onToggle} />;
    },
    [p.checks, partCounts, onToggle],
  );

  const rp = routeProgress(p);
  const tu = trophiesUnlocked(p);

  return (
    <View style={[styles.flex, { backgroundColor: c.bg }]}>
      <View style={[styles.top, { paddingTop: insets.top + 4, backgroundColor: c.bg, borderColor: c.border }]}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <T v="display" style={{ fontSize: 21, lineHeight: 26 }} numberOfLines={1} adjustsFontSizeToFit>
              Platinum Ledger
            </T>
            <T v="label" color={c.inkFaint} numberOfLines={1} adjustsFontSizeToFit>
              {`${rp.done}/${rp.total} STEPS · ${tu}/${guide.trophies.length} TROPHIES`}
            </T>
          </View>
          <IconBtn label="Search" onPress={() => router.push('/search')}>
            <SearchIcon color={c.ink} />
          </IconBtn>
          <IconBtn
            label={missablesOnly ? 'Show all steps' : 'Show missables only'}
            onPress={() => updateSettings({ missablesOnly: !missablesOnly })}
            active={missablesOnly}
          >
            <FilterIcon color={missablesOnly ? c.redInk : c.ink} />
          </IconBtn>
          <IconBtn label="Trophies" onPress={() => router.push('/trophies')}>
            <TrophyIcon color={c.ink} />
          </IconBtn>
          <IconBtn label="Settings and backup" onPress={() => router.push('/settings')}>
            <GearIcon color={c.ink} />
          </IconBtn>
        </View>
        <Bar fraction={rp.total ? rp.done / rp.total : 0} height={6} style={{ marginTop: 6 }} />
        {missablesOnly && (
          <T v="label" color={c.red} style={{ marginTop: 6 }}>
            FILTER: MISSABLES & POINTS OF NO RETURN ONLY
          </T>
        )}
      </View>

      <FlatList
        ref={list}
        data={rows}
        extraData={p.checks}
        keyExtractor={(r) => r.key}
        renderItem={renderItem}
        initialNumToRender={12}
        windowSize={11}
        removeClippedSubviews
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        onScrollToIndexFailed={(info) => {
          list.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
          setTimeout(() => list.current?.scrollToIndex({ index: info.index, animated: false, viewOffset: 8 }), 120);
        }}
        ListFooterComponent={
          <View style={{ padding: 24, alignItems: 'center' }}>
            <T v="italic">End of the route.</T>
          </View>
        }
      />

      <View style={[styles.dock, { paddingBottom: insets.bottom + 10 }]} pointerEvents="box-none">
        <DockBtn
          label="Next unticked step"
          text="NEXT"
          onPress={() => {
            const i = nextIndex();
            if (i >= 0) scrollToRow(rows[i - 1]?.kind === 'part' ? i - 1 : i);
          }}
        >
          <DownIcon color={c.ink} />
        </DockBtn>
        <DockBtn label="Open trackers" text="TRACKERS" onPress={() => router.push('/trackers')} primary>
          <LedgerIcon color={c.redInk} />
        </DockBtn>
      </View>
      <UndoBar bottom={78} />
    </View>
  );
}

function IconBtn({ children, onPress, label, active }: { children: React.ReactNode; onPress: () => void; label: string; active?: boolean }) {
  const c = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.iconBtn, active && { backgroundColor: c.red }, pressed && { opacity: 0.6 }]}
    >
      {children}
    </Pressable>
  );
}

function DockBtn({
  children,
  text,
  onPress,
  label,
  primary,
}: {
  children: React.ReactNode;
  text: string;
  onPress: () => void;
  label: string;
  primary?: boolean;
}) {
  const c = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.dockBtn,
        { backgroundColor: primary ? c.red : c.card, borderColor: primary ? c.red : c.gold },
        pressed && { opacity: 0.75 },
      ]}
    >
      {children}
      <T style={{ fontFamily: fonts.type, fontSize: 15, letterSpacing: 1 }} color={primary ? c.redInk : c.ink}>
        {text}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { paddingHorizontal: 12, paddingBottom: 8, borderBottomWidth: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 12,
  },
  dockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 58,
    paddingHorizontal: 18,
    borderRadius: 29,
    borderWidth: 2,
    elevation: 5,
  },
});
