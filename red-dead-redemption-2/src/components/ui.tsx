import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextProps, View, ViewStyle, StyleProp } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { usePalette } from '../lib/useTheme';
import { fonts, size } from '../lib/theme';
import { useProgress } from '../lib/progress';

type Variant = 'body' | 'bodyBold' | 'italic' | 'small' | 'title' | 'display' | 'label' | 'stamp';

export function T({
  v = 'body',
  color,
  style,
  ...rest
}: TextProps & { v?: Variant; color?: string }) {
  const c = usePalette();
  const base: Record<Variant, object> = {
    body: { fontFamily: fonts.body, fontSize: size.body, lineHeight: size.bodyLine, color: c.ink },
    bodyBold: { fontFamily: fonts.bodyBold, fontSize: size.body, lineHeight: size.bodyLine, color: c.ink },
    italic: { fontFamily: fonts.bodyItalic, fontSize: size.body, lineHeight: size.bodyLine, color: c.inkMuted },
    small: { fontFamily: fonts.body, fontSize: size.small, lineHeight: 20, color: c.inkMuted },
    title: { fontFamily: fonts.bodyBold, fontSize: size.title, lineHeight: 26, color: c.ink },
    display: { fontFamily: fonts.display, fontSize: 26, lineHeight: 34, color: c.ink },
    label: { fontFamily: fonts.type, fontSize: 14, lineHeight: 18, color: c.inkMuted, letterSpacing: 0.5 },
    stamp: { fontFamily: fonts.type, fontSize: 13, lineHeight: 16, color: c.redInk, letterSpacing: 1 },
  };
  return <Text {...rest} style={[base[v], color ? { color } : null, style]} />;
}

export function Tick({ on, size: s = 30, color }: { on: boolean; size?: number; color?: string }) {
  const c = usePalette();
  const col = color ?? (on ? c.green : c.inkMuted);
  return (
    <View
      style={{
        width: s,
        height: s,
        borderWidth: 2.5,
        borderColor: col,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: on ? c.chipBg : 'transparent',
      }}
    >
      {on && (
        <Svg width={s * 0.8} height={s * 0.8} viewBox="0 0 24 24">
          <Path d="M3 13 L9.5 19 L21 5" stroke={col} strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )}
    </View>
  );
}

/** Large square tap target wrapping a tick box. */
export function CheckButton({
  on,
  onPress,
  label,
}: {
  on: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(on ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress();
      }}
      hitSlop={6}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.checkBtn, pressed && { opacity: 0.6 }]}
    >
      <Tick on={on} />
    </Pressable>
  );
}

export function Chip({ text, tone = 'plain' }: { text: string; tone?: 'plain' | 'red' | 'gold' | 'green' }) {
  const c = usePalette();
  const bg = tone === 'red' ? c.red : tone === 'gold' ? c.goldBg : c.chipBg;
  const fg = tone === 'red' ? c.redInk : tone === 'gold' ? c.gold : tone === 'green' ? c.green : c.inkMuted;
  return (
    <View style={[styles.chip, { backgroundColor: bg, borderColor: tone === 'red' ? c.red : c.border }]}>
      <Text style={{ fontFamily: fonts.type, fontSize: 12.5, color: fg, letterSpacing: 0.6 }}>{text.toUpperCase()}</Text>
    </View>
  );
}

export function Bar({ fraction, height = 8, style }: { fraction: number; height?: number; style?: StyleProp<ViewStyle> }) {
  const c = usePalette();
  const f = Math.max(0, Math.min(1, fraction || 0));
  return (
    <View style={[{ height, backgroundColor: c.chipBg, borderRadius: 2, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }, style]}>
      <View style={{ width: `${f * 100}%`, height: '100%', backgroundColor: f >= 1 ? c.green : c.gold }} />
    </View>
  );
}

export function Button({
  title,
  onPress,
  tone = 'plain',
  icon,
  style,
  small,
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  tone?: 'plain' | 'red' | 'gold';
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
  accessibilityLabel?: string;
}) {
  const c = usePalette();
  const bg = tone === 'red' ? c.red : tone === 'gold' ? c.goldBg : c.chipBg;
  const fg = tone === 'red' ? c.redInk : tone === 'gold' ? c.gold : c.ink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: tone === 'red' ? c.red : c.border, minHeight: small ? 44 : size.tap },
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      {icon}
      <Text style={{ fontFamily: fonts.type, fontSize: small ? 14 : 16, color: fg, letterSpacing: 0.6 }}>{title}</Text>
    </Pressable>
  );
}

/** Ornamental printer's rule: line — diamond — line */
export function Rule({ style }: { style?: StyleProp<ViewStyle> }) {
  const c = usePalette();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }, style]}>
      <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
      <View style={{ width: 7, height: 7, transform: [{ rotate: '45deg' }], backgroundColor: c.gold, marginHorizontal: 8 }} />
      <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
    </View>
  );
}

/** Text hidden behind the spoiler shield until tapped (shield can be switched off in Settings). */
export function Spoiler({ lines, title = 'Story spoiler' }: { lines: string[]; title?: string }) {
  const c = usePalette();
  const p = useProgress();
  const [open, setOpen] = useState(false);
  const shown = open || !p.settings.spoilerShield;
  if (!lines.length) return null;
  return (
    <Pressable
      onPress={() => setOpen((o) => !o)}
      accessibilityRole="button"
      accessibilityLabel={shown ? 'Hide spoiler' : 'Reveal spoiler'}
      style={[styles.spoiler, { borderColor: c.border, backgroundColor: c.chipBg }]}
    >
      <T v="label">{shown ? `${title} (tap to hide)` : `${title}: tap to reveal`}</T>
      {shown && lines.map((l, i) => <T key={i} style={{ marginTop: 4 }}>{l}</T>)}
    </Pressable>
  );
}

export function SpoilerText({ safe, real }: { safe: string; real?: string }) {
  const p = useProgress();
  const [open, setOpen] = useState(false);
  if (!real || real === safe || !p.settings.spoilerShield) return <>{real ?? safe}</>;
  return (
    <Text onPress={() => setOpen((o) => !o)} suppressHighlighting>
      {open ? real : safe}
    </Text>
  );
}

const styles = StyleSheet.create({
  checkBtn: { width: size.tap, height: size.tap, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 3, borderWidth: 1, marginRight: 6, marginBottom: 6 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  spoiler: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 4, padding: 10, marginTop: 10 },
});
