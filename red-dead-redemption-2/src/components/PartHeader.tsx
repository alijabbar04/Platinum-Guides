import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { Part } from '../data/types';
import { usePalette } from '../lib/useTheme';
import { Bar, Rule, T } from './ui';

export const PART_DONE_HEIGHT = 86;

function PartHeaderInner({ part, done, total, index }: { part: Part; done: number; total: number; index: number }) {
  const c = usePalette();
  const complete = total > 0 && done === total;
  return (
    <View style={[styles.wrap, complete && { height: PART_DONE_HEIGHT, paddingBottom: 0 }]} accessibilityRole="header">
      <View style={[styles.plate, { borderColor: complete ? c.rule : c.gold, backgroundColor: complete ? c.cardDone : c.card }]}>
        <T v="label" color={c.inkFaint} style={{ textAlign: 'center' }}>
          {`PART ${toRoman(index + 1)} · ${done} OF ${total} DONE`}
        </T>
        <T v="display" style={{ textAlign: 'center', fontSize: complete ? 20 : 28, lineHeight: complete ? 26 : 36 }} color={complete ? c.inkFaint : c.ink}>
          {part.title}
        </T>
        {!complete && (
          <>
            <T v="italic" style={{ textAlign: 'center' }}>
              {part.subtitle}
            </T>
            <Bar fraction={total ? done / total : 0} style={{ marginTop: 10 }} />
            <Rule style={{ marginTop: 12 }} />
            {part.intro.map((p, i) => (
              <T key={i} style={{ marginTop: i ? 8 : 0 }}>
                {p}
              </T>
            ))}
          </>
        )}
      </View>
    </View>
  );
}

function toRoman(n: number) {
  const map: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let out = '';
  for (const [v, s] of map) while (n >= v) (out += s), (n -= v);
  return out;
}

export const PartHeader = memo(PartHeaderInner);

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 10, paddingTop: 14, paddingBottom: 12 },
  plate: { borderWidth: 2, borderRadius: 3, padding: 14, paddingVertical: 10 },
});
