import React, { useMemo } from 'react';
import { Linking, SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { guide } from '../lib/guide';
import { usePalette } from '../lib/useTheme';
import { T } from '../components/ui';

const areaTitle = (a: string) =>
  a.startsWith('route:') ? `Route · ${guide.parts.find((p) => p.id === a.slice(6))?.title ?? a}` : `Research · ${a}`;

export default function IssuesScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const sections = useMemo(() => {
    const m = new Map<string, typeof guide.issues>();
    for (const i of guide.issues) m.set(i.area, [...(m.get(i.area) ?? []), i]);
    return [...m.entries()].map(([area, data]) => ({ key: area, title: areaTitle(area), data }));
  }, []);
  return (
    <SectionList
      style={{ backgroundColor: c.bg }}
      sections={sections}
      keyExtractor={(i) => i.id}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
      ListHeaderComponent={
        <T v="italic" style={{ padding: 12 }}>
          Where the sources disagreed or a detail rests on a single source, it is listed here rather than quietly picked. Route steps affected show a "Not fully verified" note.
        </T>
      }
      renderSectionHeader={({ section }) => (
        <View style={[styles.section, { borderColor: c.gold }]}>
          <T v="label" color={c.gold}>
            {section.title.toUpperCase()}
          </T>
        </View>
      )}
      renderItem={({ item: i }) => (
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <T v="bodyBold">{i.topic}</T>
          <T v="small" color={c.ink} style={{ marginTop: 2 }}>
            {i.details}
          </T>
          {i.positions.map((p, n) => (
            <T key={n} v="small" style={{ marginTop: 4 }}>
              {`• ${p.claim} `}
              {p.sources.map((s, k) => {
                const src = guide.sources[s];
                return src ? (
                  <T key={k} v="small" color={c.gold} onPress={() => Linking.openURL(src.url)}>
                    {`[${src.title}] `}
                  </T>
                ) : null;
              })}
            </T>
          ))}
          {i.handling ? (
            <T v="small" color={c.green} style={{ marginTop: 4 }}>
              Guide: {i.handling}
            </T>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  section: { marginHorizontal: 10, marginTop: 12, marginBottom: 6, borderBottomWidth: 1.5, paddingBottom: 4 },
  card: { marginHorizontal: 10, marginBottom: 8, borderWidth: 1, borderRadius: 5, padding: 10 },
});
