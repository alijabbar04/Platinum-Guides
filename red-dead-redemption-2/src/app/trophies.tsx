import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Trophy } from '../data/types';
import { guide, stepById, trackerById, trophiesUnlocked, trophyProgress } from '../lib/guide';
import { getState, setChecked, useProgress } from '../lib/progress';
import { usePalette } from '../lib/useTheme';
import { Bar, Button, CheckButton, Chip, T } from '../components/ui';
import { offerUndo, UndoBar } from '../components/UndoBar';

const gradeColour: Record<Trophy['grade'], string> = { platinum: '#9fb8c8', gold: '#d9a84e', silver: '#b9b9b0', bronze: '#b0703d' };

export default function TrophiesScreen() {
  const c = usePalette();
  const p = useProgress();
  const insets = useSafeAreaInsets();
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const [open, setOpen] = useState<string | undefined>(focus);
  const list = useRef<SectionList<Trophy>>(null);

  const sections = useMemo(
    () => [
      { key: 'story', title: 'Story mode', data: guide.trophies.filter((t) => !t.online) },
      { key: 'online', title: 'Red Dead Online', data: guide.trophies.filter((t) => t.online) },
    ],
    [],
  );

  useEffect(() => {
    if (!focus) return;
    setOpen(focus);
    const t = setTimeout(() => {
      sections.forEach((s, sectionIndex) => {
        const itemIndex = s.data.findIndex((x) => x.id === focus);
        if (itemIndex >= 0) list.current?.scrollToLocation({ sectionIndex, itemIndex, viewOffset: 10 });
      });
    }, 150);
    return () => clearTimeout(t);
  }, [focus, sections]);

  const unlocked = trophiesUnlocked(p);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <SectionList
        ref={list}
        sections={sections}
        keyExtractor={(t) => t.id}
        stickySectionHeadersEnabled={false}
        onScrollToIndexFailed={() => {}}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        ListHeaderComponent={
          <View style={{ padding: 12 }}>
            <T v="display">{`${unlocked} of ${guide.trophies.length}`}</T>
            <T v="label">TROPHIES MARKED UNLOCKED</T>
            <Bar fraction={unlocked / guide.trophies.length} style={{ marginTop: 8 }} />
            <T v="italic" style={{ marginTop: 8 }}>
              Tick a trophy when it pops on your console. The bar under each one shows how far the guide steps and trackers that feed it have got.
            </T>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={[styles.section, { borderColor: c.gold }]}>
            <T v="label" color={c.gold}>
              {section.title.toUpperCase()}
            </T>
          </View>
        )}
        renderItem={({ item: t }) => {
          const done = p.checks[t.id] !== undefined;
          const frac = trophyProgress(p, t);
          const isOpen = open === t.id;
          const nextStep = t.stepIds.find((id) => p.checks[id] === undefined);
          return (
            <View style={[styles.card, { backgroundColor: done ? c.cardDone : c.card, borderColor: isOpen ? c.gold : c.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <CheckButton
                  on={done}
                  label={`${done ? 'Untick' : 'Mark unlocked'}: ${t.name}`}
                  onPress={() => {
                    const was = getState().checks[t.id] !== undefined;
                    setChecked(t.id, !was);
                    offerUndo(`${was ? 'Unmarked' : 'Unlocked'}: ${t.name}`, () => setChecked(t.id, was));
                  }}
                />
                <Pressable style={{ flex: 1, paddingTop: 8, paddingRight: 10 }} onPress={() => setOpen(isOpen ? undefined : t.id)} accessibilityRole="button" accessibilityLabel={`${t.name}. ${isOpen ? 'Collapse' : 'Show how to'}`}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.medal, { backgroundColor: gradeColour[t.grade] }]} />
                    <T v="title" style={{ flex: 1 }} color={done ? c.inkFaint : c.ink}>
                      {t.name}
                    </T>
                  </View>
                  <T v="small">{t.description}</T>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                    <Chip text={t.grade} />
                    {t.missable && <Chip text="Missable" tone="red" />}
                    {t.hidden && <Chip text="Hidden" />}
                  </View>
                  <Bar fraction={frac} height={6} style={{ marginTop: 2 }} />
                </Pressable>
              </View>
              {isOpen && (
                <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                  {t.missableDeadline && (
                    <T v="bodyBold" color={c.red} style={{ marginTop: 6 }}>
                      Cut-off: {t.missableDeadline}
                    </T>
                  )}
                  {t.howTo.map((h, i) => (
                    <View key={i} style={{ flexDirection: 'row', marginTop: 4 }}>
                      <T style={{ width: 24 }} color={c.inkMuted}>{`${i + 1}.`}</T>
                      <T style={{ flex: 1 }}>{h}</T>
                    </View>
                  ))}
                  {t.tips.map((h, i) => (
                    <T key={`tip${i}`} v="italic" style={{ marginTop: 4 }}>
                      Tip: {h}
                    </T>
                  ))}
                  {t.stepIds.length > 0 && (
                    <T v="label" style={{ marginTop: 10 }}>
                      {`ROUTE STEPS: ${t.stepIds.filter((s) => p.checks[s] !== undefined).length} / ${t.stepIds.length} DONE`}
                    </T>
                  )}
                  {nextStep && (
                    <Button
                      small
                      title={`Go to: ${stepById.get(nextStep)?.title ?? 'step'}`}
                      onPress={() => router.navigate({ pathname: '/', params: { focus: nextStep, t: String(Date.now()) } })}
                      style={{ marginTop: 6, justifyContent: 'flex-start' }}
                    />
                  )}
                  {t.trackerIds.map((id) => (
                    <Button key={id} small title={`Open tracker: ${trackerById.get(id)?.short}`} onPress={() => router.push({ pathname: '/trackers/[id]', params: { id } })} style={{ marginTop: 6, justifyContent: 'flex-start' }} />
                  ))}
                </View>
              )}
            </View>
          );
        }}
      />
      <UndoBar />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginHorizontal: 10, marginTop: 12, marginBottom: 6, borderBottomWidth: 1.5, paddingBottom: 4 },
  card: { marginHorizontal: 10, marginBottom: 8, borderWidth: 1.5, borderRadius: 6 },
  medal: { width: 14, height: 14, borderRadius: 7 },
});
