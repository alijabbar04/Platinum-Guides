import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { guide, trackerProgress } from '../../lib/guide';
import { useProgress } from '../../lib/progress';
import { usePalette } from '../../lib/useTheme';
import { Bar, T } from '../../components/ui';
import { MapIcon } from '../../components/icons';

export default function TrackersScreen() {
  const c = usePalette();
  const p = useProgress();
  const insets = useSafeAreaInsets();
  return (
    <FlatList
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: 10, paddingBottom: insets.bottom + 24 }}
      data={guide.trackers}
      keyExtractor={(t) => t.id}
      ListHeaderComponent={
        <T v="italic" style={{ marginBottom: 10, marginHorizontal: 4 }}>
          Long-running goals live here. Open one any time; ticks here and in the route stay in step.
        </T>
      }
      renderItem={({ item: t }) => {
        const pr = trackerProgress(p, t);
        return (
          <Pressable
            onPress={() => router.push({ pathname: '/trackers/[id]', params: { id: t.id } })}
            accessibilityRole="button"
            accessibilityLabel={`${t.title}, ${Math.floor(pr.done)} of ${pr.goal}`}
            style={({ pressed }) => [styles.row, { backgroundColor: c.card, borderColor: c.border }, pressed && { opacity: 0.7 }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <T v="title" style={{ flex: 1 }}>
                {t.title}
              </T>
              {t.hasMap && <MapIcon color={c.inkMuted} size={22} />}
            </View>
            <T v="label" style={{ marginTop: 2 }}>
              {`${Math.floor(pr.done)} / ${pr.goal} ${t.goalLabel}`.toUpperCase()}
            </T>
            <Bar fraction={pr.fraction} style={{ marginTop: 8 }} />
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: { borderWidth: 1.5, borderRadius: 6, padding: 14, marginBottom: 10, minHeight: 64 },
});
