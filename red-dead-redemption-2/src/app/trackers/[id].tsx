import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TrackerItem } from '../../data/types';
import { isItemDone, trackerById, trackerProgress, trophyById } from '../../lib/guide';
import { getState, setChecked, setCounter, useProgress } from '../../lib/progress';
import { usePalette } from '../../lib/useTheme';
import { Bar, Button, CheckButton, Chip, SpoilerText, T } from '../../components/ui';
import { MapIcon, MinusIcon, PlusIcon } from '../../components/icons';
import { offerUndo, UndoBar } from '../../components/UndoBar';

export default function TrackerScreen() {
  const { id, focus } = useLocalSearchParams<{ id: string; focus?: string }>();
  const tracker = trackerById.get(id);
  const c = usePalette();
  const p = useProgress();
  const insets = useSafeAreaInsets();
  const [hideDone, setHideDone] = useState(false);
  const list = useRef<SectionList<TrackerItem>>(null);

  const sections = useMemo(
    () =>
      (tracker?.groups ?? []).map((g) => ({
        key: g.id,
        title: g.title,
        note: g.note,
        data: hideDone ? g.items.filter((i) => !isItemDone(p, i)) : g.items,
      })).filter((s) => s.data.length > 0),
    [tracker, hideDone, p],
  );

  useEffect(() => {
    if (!focus) return;
    const t = setTimeout(() => {
      sections.forEach((s, sectionIndex) => {
        const itemIndex = s.data.findIndex((i) => i.id === focus);
        if (itemIndex >= 0) list.current?.scrollToLocation({ sectionIndex, itemIndex, viewOffset: 60 });
      });
    }, 150);
    return () => clearTimeout(t);
  }, [focus]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback((item: TrackerItem) => {
    const key = item.stepId ?? item.id;
    const was = getState().checks[key] !== undefined;
    setChecked(key, !was);
    offerUndo(`${was ? 'Unticked' : 'Ticked'}: ${item.label}`, () => setChecked(key, was));
  }, []);

  if (!tracker) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, padding: 20 }}>
        <T>Tracker not found.</T>
      </View>
    );
  }
  const pr = trackerProgress(p, tracker);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen options={{ title: tracker.short }} />
      <SectionList
        ref={list}
        sections={sections}
        keyExtractor={(i) => i.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        onScrollToIndexFailed={() => {}}
        ListHeaderComponent={
          <View style={{ padding: 12 }}>
            <T v="display" style={{ fontSize: 24, lineHeight: 30 }}>
              {tracker.title}
            </T>
            <T v="label" style={{ marginTop: 4 }}>
              {`${Math.floor(pr.done)} / ${pr.goal} ${tracker.goalLabel}`.toUpperCase()}
            </T>
            <Bar fraction={pr.fraction} style={{ marginTop: 8 }} />
            {tracker.description.map((d, i) => (
              <T key={i} style={{ marginTop: 8 }}>
                {d}
              </T>
            ))}
            {tracker.trophyIds.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
                {tracker.trophyIds.map((tid) => (
                  <Chip key={tid} text={`🏆 ${trophyById.get(tid)?.name ?? tid}`} tone="gold" />
                ))}
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {tracker.hasMap && (
                <Button
                  title="Open map"
                  tone="gold"
                  icon={<MapIcon color={c.gold} size={20} />}
                  onPress={() => router.push({ pathname: '/map/[tracker]', params: { tracker: tracker.id } })}
                />
              )}
              <Button title={hideDone ? 'Show done' : 'Hide done'} onPress={() => setHideDone((h) => !h)} />
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={[styles.section, { borderColor: c.gold }]}>
            <T v="label" color={c.gold}>
              {section.title.toUpperCase()}
            </T>
            {section.note ? <T v="small">{section.note}</T> : null}
          </View>
        )}
        renderItem={({ item }) => <ItemRow item={item} onToggle={toggle} highlight={item.id === focus} />}
        ListEmptyComponent={
          <T v="italic" style={{ padding: 16 }}>
            Everything here is done.
          </T>
        }
      />
      <UndoBar />
    </View>
  );
}

function ItemRow({ item, onToggle, highlight }: { item: TrackerItem; onToggle: (i: TrackerItem) => void; highlight?: boolean }) {
  const c = usePalette();
  const p = useProgress();
  const done = isItemDone(p, item);
  const [peek, setPeek] = useState(false);
  const open = !done || peek;

  if (item.kind === 'note') {
    return (
      <View style={[styles.note, { borderColor: c.rule }]}>
        <T v="bodyBold" color={c.inkMuted}>
          {item.label}
        </T>
        {(item.available || item.unverified) && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
            {item.available && <Chip text={item.available} tone="gold" />}
            {item.unverified && <Chip text="Single source" />}
          </View>
        )}
        {item.detail && <T style={{ marginTop: 2 }}>{item.detail}</T>}
      </View>
    );
  }

  if (item.kind === 'link') {
    const lt = item.trackerId ? trackerById.get(item.trackerId) : undefined;
    const lp = lt ? trackerProgress(p, lt) : { done: 0, goal: 0, fraction: 0 };
    return (
      <Pressable
        onPress={() => lt && router.push({ pathname: '/trackers/[id]', params: { id: lt.id } })}
        accessibilityRole="link"
        accessibilityLabel={`${item.label}: open tracker`}
        style={({ pressed }) => [styles.row, { backgroundColor: done ? c.cardDone : c.card, borderColor: c.border, padding: 12, flexDirection: 'column', alignItems: 'stretch' }, pressed && { opacity: 0.7 }]}
      >
        <T v="bodyBold" color={done ? c.inkFaint : c.ink}>
          {item.label} {done ? '✓' : ''}
        </T>
        <T v="label">{`${Math.floor(lp.done)} / ${lp.goal} · OPEN TRACKER →`}</T>
        <Bar fraction={lp.fraction} style={{ marginTop: 6 }} />
      </Pressable>
    );
  }

  if (item.kind === 'counter') {
    const v = p.counters[item.id] ?? 0;
    const target = item.target ?? 1;
    const step = target >= 1000 ? 50 : target >= 100 ? 10 : 1;
    return (
      <View style={[styles.row, { backgroundColor: done ? c.cardDone : c.card, borderColor: highlight ? c.gold : c.border }]}>
        <View style={{ flex: 1, paddingLeft: 12, paddingVertical: 8 }}>
          <T v="bodyBold" color={done ? c.inkFaint : c.ink}>
            {item.label}
          </T>
          <T v="label" color={done ? c.green : c.inkMuted}>
            {`${item.unit === '$' ? '$' : ''}${v} / ${item.unit === '$' ? '$' : ''}${target}${done ? ' ✓' : ''}`}
          </T>
          {item.detail && <T v="small">{item.detail}</T>}
        </View>
        <CounterBtn label={`Decrease ${item.label}`} onPress={() => setCounter(item.id, Math.max(0, v - step))}>
          <MinusIcon color={c.ink} />
        </CounterBtn>
        <CounterBtn label={`Increase ${item.label}`} onPress={() => setCounter(item.id, Math.min(target, v + step))}>
          <PlusIcon color={c.ink} />
        </CounterBtn>
      </View>
    );
  }

  return (
    <View style={[styles.row, { backgroundColor: done ? c.cardDone : c.card, borderColor: highlight ? c.gold : c.border }]}>
      <CheckButton on={done} onPress={() => onToggle(item)} label={`${done ? 'Untick' : 'Tick'}: ${item.label}`} />
      <Pressable style={{ flex: 1, paddingVertical: 10, paddingRight: 10 }} onPress={() => done && setPeek((x) => !x)} disabled={!done}>
        <T v="bodyBold" color={done ? c.inkFaint : c.ink} style={done ? { textDecorationLine: 'line-through' } : undefined} numberOfLines={open ? undefined : 1}>
          <SpoilerText safe={item.label} real={item.spoilerLabel} />
        </T>
        {open && (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
              {item.region && <Chip text={item.region} />}
              {item.available && <Chip text={item.available} tone="gold" />}
              {item.optional && <Chip text="Optional" />}
              {item.stepId && <Chip text="Route step" />}
              {item.pinId && <Chip text="On map" tone="green" />}
            </View>
            {item.detail && <T style={{ marginTop: 2 }}>{item.detail}</T>}
            {item.unverified && (
              <T v="small" style={{ marginTop: 4 }}>
                Not fully verified: {item.unverified}
              </T>
            )}
            {item.pinId && (
              <Pressable
                onPress={() => {
                  const tr = [...trackerById.values()].find((t) => t.groups.some((g) => g.items.includes(item)));
                  if (tr) router.push({ pathname: '/map/[tracker]', params: { tracker: tr.id, pin: item.pinId } });
                }}
                style={{ paddingVertical: 10 }}
                accessibilityRole="link"
              >
                <T v="label" color={c.gold}>
                  SHOW ON MAP →
                </T>
              </Pressable>
            )}
          </>
        )}
      </Pressable>
    </View>
  );
}

function CounterBtn({ children, onPress, label }: { children: React.ReactNode; onPress: () => void; label: string }) {
  const c = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.counterBtn, { borderColor: c.border }, pressed && { opacity: 0.6 }]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { marginHorizontal: 10, marginTop: 14, marginBottom: 6, borderBottomWidth: 1.5, paddingBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: 10, marginBottom: 6, borderWidth: 1, borderRadius: 5, minHeight: 56 },
  note: { marginHorizontal: 14, marginBottom: 8, paddingLeft: 10, borderLeftWidth: 3, paddingVertical: 4 },
  counterBtn: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, alignSelf: 'center' },
});
