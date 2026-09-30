import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { guide, partById } from '../lib/guide';
import { useProgress } from '../lib/progress';
import { usePalette } from '../lib/useTheme';
import { fonts } from '../lib/theme';
import { Chip, T } from '../components/ui';

type Hit = { key: string; kind: 'Step' | 'Tracker' | 'Trophy'; title: string; sub: string; done: boolean; go: () => void; score: number };

// Pre-built lowercase haystacks
const stepHay = guide.steps.map((s) => ({
  s,
  title: s.title.toLowerCase(),
  body: [s.where, s.missionName, ...(s.before ?? []), ...s.how, s.tip, ...(s.gold ?? [])].filter(Boolean).join(' ').toLowerCase(),
}));
const itemHay = guide.trackers.flatMap((t) =>
  t.groups.flatMap((g) => g.items.map((i) => ({ t, g, i, title: i.label.toLowerCase(), body: `${i.detail ?? ''} ${i.region ?? ''} ${g.title}`.toLowerCase() }))),
);
const trophyHay = guide.trophies.map((t) => ({ t, title: t.name.toLowerCase(), body: `${t.description} ${t.howTo.join(' ')}`.toLowerCase() }));

export default function SearchScreen() {
  const c = usePalette();
  const p = useProgress();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');

  const hits = useMemo(() => {
    const words = q.toLowerCase().trim().split(/\s+/).filter((w) => w.length > 1);
    if (!words.length) return [] as Hit[];
    const score = (title: string, body: string) => {
      let sc = 0;
      for (const w of words) {
        if (title.includes(w)) sc += 3;
        else if (body.includes(w)) sc += 1;
        else return 0;
      }
      return sc;
    };
    const out: Hit[] = [];
    for (const h of trophyHay) {
      const sc = score(h.title, h.body);
      if (sc) out.push({ key: h.t.id, kind: 'Trophy', title: h.t.name, sub: h.t.description, done: p.checks[h.t.id] !== undefined, score: sc + 1, go: () => router.push({ pathname: '/trophies', params: { focus: h.t.id } }) });
    }
    for (const h of stepHay) {
      const sc = score(h.title, h.body);
      if (sc) out.push({ key: h.s.id, kind: 'Step', title: h.s.title, sub: partById.get(h.s.partId)?.title ?? '', done: p.checks[h.s.id] !== undefined, score: sc, go: () => router.navigate({ pathname: '/', params: { focus: h.s.id, t: String(Date.now()) } }) });
    }
    for (const h of itemHay) {
      if (h.i.kind === 'note') continue;
      const sc = score(h.title, h.body);
      if (sc)
        out.push({
          key: h.i.id,
          kind: 'Tracker',
          title: h.i.label,
          sub: `${h.t.short} · ${h.g.title}`,
          done: p.checks[h.i.stepId ?? h.i.id] !== undefined,
          score: sc,
          go: () => router.push({ pathname: '/trackers/[id]', params: { id: h.t.id, focus: h.i.id } }),
        });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 80);
  }, [q, p.checks]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ padding: 10 }}>
        <TextInput
          autoFocus
          value={q}
          onChangeText={setQ}
          placeholder="Search steps, trackers, trophies…"
          placeholderTextColor={c.inkFaint}
          style={[styles.input, { color: c.ink, borderColor: c.gold, backgroundColor: c.card, fontFamily: fonts.body }]}
          returnKeyType="search"
          accessibilityLabel="Search"
        />
      </View>
      <FlatList
        data={hits}
        keyExtractor={(h) => `${h.kind}-${h.key}`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        ListEmptyComponent={
          <T v="italic" style={{ padding: 16 }}>
            {q.trim().length > 1 ? 'Nothing found.' : 'Try a place ("Valentine"), a trophy ("Zoologist"), or a thing ("tithing").'}
          </T>
        }
        renderItem={({ item: h }) => (
          <Pressable onPress={h.go} style={({ pressed }) => [styles.row, { backgroundColor: h.done ? c.cardDone : c.card, borderColor: c.border }, pressed && { opacity: 0.7 }]} accessibilityRole="button">
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Chip text={h.kind} tone={h.kind === 'Trophy' ? 'gold' : 'plain'} />
              {h.done && <Chip text="Done" tone="green" />}
            </View>
            <T v="bodyBold" color={h.done ? c.inkFaint : c.ink}>
              {h.title}
            </T>
            <T v="small" numberOfLines={1}>
              {h.sub}
            </T>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 2, borderRadius: 6, paddingHorizontal: 14, height: 54, fontSize: 18 },
  row: { marginHorizontal: 10, marginBottom: 8, borderWidth: 1, borderRadius: 5, padding: 10, minHeight: 56 },
});
