// A short-lived "Ticked X — UNDO" bar so a mis-tap is one tap to fix.
import React, { useEffect, useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePalette } from '../lib/useTheme';
import { T } from './ui';

type Pending = { key: number; message: string; undo: () => void } | null;
let pending: Pending = null;
let counter = 0;
const ls = new Set<() => void>();
const emit = () => ls.forEach((l) => l());

export function offerUndo(message: string, undo: () => void) {
  pending = { key: ++counter, message, undo };
  emit();
}

function clear(key?: number) {
  if (!pending || (key !== undefined && pending.key !== key)) return;
  pending = null;
  emit();
}

export function UndoBar({ bottom = 0 }: { bottom?: number }) {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const p = useSyncExternalStore(
    (l) => {
      ls.add(l);
      return () => ls.delete(l);
    },
    () => pending,
  );
  useEffect(() => {
    if (!p) return;
    const t = setTimeout(() => clear(p.key), 6000);
    return () => clearTimeout(t);
  }, [p]);
  if (!p) return null;
  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: bottom + insets.bottom + 12 }]}
      accessibilityLiveRegion="polite"
    >
      <View style={[styles.bar, { backgroundColor: c.card, borderColor: c.gold }]}>
        <T v="small" color={c.ink} style={{ flex: 1 }} numberOfLines={2}>
          {p.message}
        </T>
        <Pressable
          onPress={() => {
            p.undo();
            clear();
          }}
          accessibilityRole="button"
          accessibilityLabel="Undo"
          style={({ pressed }) => [styles.undo, { borderColor: c.gold }, pressed && { opacity: 0.6 }]}
        >
          <T v="label" color={c.gold}>
            UNDO
          </T>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 6,
    paddingLeft: 14,
    paddingVertical: 6,
    paddingRight: 6,
    maxWidth: 520,
    width: '100%',
    elevation: 6,
  },
  undo: { minHeight: 48, minWidth: 76, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderRadius: 4 },
});
