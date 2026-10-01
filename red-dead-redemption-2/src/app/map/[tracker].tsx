// Self-drawn map: roads/rail/labels/pins from open (Unlicense) coordinate data.
// No game map imagery is used. Approximate pins are drawn and labelled as such.
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Pin, TrackerItem } from '../../data/types';
import { guide, isItemDone, trackerById } from '../../lib/guide';
import { getState, setChecked, useProgress } from '../../lib/progress';
import { usePalette } from '../../lib/useTheme';
import { fonts } from '../../lib/theme';
import { Button, Chip, SpoilerText, T } from '../../components/ui';
import { MinusIcon, PlusIcon } from '../../components/icons';
import { offerUndo, UndoBar } from '../../components/UndoBar';

const B = guide.map.bounds;
const W = B.maxX - B.minX;
const H = B.maxY - B.minY;
const MIN_Z = 1;
const MAX_Z = 14;
const MAX_RENDER_Z = 8; // the SVG is re-drawn at up to 8x so it stays sharp; beyond that it is scaled

type Entry = { item: TrackerItem; pin: Pin };

export default function MapScreen() {
  const { tracker: trackerId, pin: focusPin } = useLocalSearchParams<{ tracker: string; pin?: string }>();
  const tracker = trackerById.get(trackerId);
  const c = usePalette();
  const p = useProgress();
  const insets = useSafeAreaInsets();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [base0, setBase0] = useState(0); // fixed at first layout so later resizes don't rescale the map
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<string | undefined>(focusPin);
  const initialised = useRef(false);

  const entries: Entry[] = useMemo(() => {
    const out: Entry[] = [];
    for (const g of tracker?.groups ?? []) for (const item of g.items) if (item.pinId && guide.pins[item.pinId]) out.push({ item, pin: guide.pins[item.pinId] });
    return out;
  }, [tracker]);
  const anyApprox = entries.some((e) => e.pin.approximate);
  const anyExact = entries.some((e) => !e.pin.approximate);

  // content px per world unit at zoom 1 (fit whole map in the box)
  const base = base0 || 0.05;
  const cw = W * base;
  const ch = H * base;

  const s = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startS = useSharedValue(1);
  const rz = useSharedValue(1); // zoom level the SVG is currently drawn at
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const worldToContent = (x: number, y: number) => ({ x: (x - B.minX) * base, y: (B.maxY - y) * base });

  const centerOn = useCallback(
    (x: number, y: number, z: number) => {
      const pt = { x: (x - B.minX) * base, y: (B.maxY - y) * base };
      s.value = withTiming(z);
      tx.value = withTiming(box.w / 2 - pt.x * z);
      ty.value = withTiming(box.h / 2 - pt.y * z);
      setZoom(z);
    },
    [base, box, s, tx, ty],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ w: width, h: height });
    // only position the map on first layout; later size changes (info card) keep the user's zoom
    if (initialised.current) return;
    initialised.current = true;
    const b = Math.min(width / W, height / H);
    setBase0(b);
    const fp = focusPin ? guide.pins[focusPin] : undefined;
    if (fp) {
      const pt = { x: (fp.x - B.minX) * b, y: (B.maxY - fp.y) * b };
      s.value = 4;
      tx.value = width / 2 - pt.x * 4;
      ty.value = height / 2 - pt.y * 4;
      setZoom(4);
    } else {
      tx.value = (width - W * b) / 2;
      ty.value = (height - H * b) / 2;
    }
  };

  const handleTap = useCallback(
    (sx: number, sy: number, sc: number, ox: number, oy: number) => {
      const cx = (sx - ox) / sc;
      const cy = (sy - oy) / sc;
      let best: { id: string; d: number } | undefined;
      for (const e of entries) {
        const pt = worldToContent(e.pin.x, e.pin.y);
        const d = Math.hypot(pt.x - cx, pt.y - cy) * sc;
        if (d < 34 && (!best || d < best.d)) best = { id: e.pin.id, d };
      }
      setSelected(best?.id);
    },
    [entries, base], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      startS.value = s.value;
      startX.value = tx.value;
      startY.value = ty.value;
    })
    .onUpdate((e) => {
      const ns = Math.min(MAX_Z, Math.max(MIN_Z, startS.value * e.scale));
      const k = ns / startS.value;
      s.value = ns;
      tx.value = e.focalX - (e.focalX - startX.value) * k;
      ty.value = e.focalY - (e.focalY - startY.value) * k;
    })
    .onEnd(() => runOnJS(setZoom)(s.value));
  const pan = Gesture.Pan()
    .averageTouches(true)
    .onStart(() => {
      startX.value = tx.value;
      startY.value = ty.value;
    })
    .onUpdate((e) => {
      tx.value = startX.value + e.translationX;
      ty.value = startY.value + e.translationY;
    });
  const tap = Gesture.Tap()
    .maxDuration(250)
    .onEnd((e) => runOnJS(handleTap)(e.x, e.y, s.value, tx.value, ty.value));
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      const ns = Math.min(MAX_Z, s.value * 2);
      const k = ns / s.value;
      tx.value = withTiming(e.x - (e.x - tx.value) * k);
      ty.value = withTiming(e.y - (e.y - ty.value) * k);
      s.value = withTiming(ns);
      runOnJS(setZoom)(ns);
    });
  const gesture = Gesture.Simultaneous(pinch, pan, Gesture.Exclusive(doubleTap, tap));

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: s.value / rz.value }],
  }));
  // draw the SVG at the settled zoom so it is crisp instead of a stretched bitmap
  const renderZoom = Math.min(MAX_RENDER_Z, Math.max(1, zoom));
  rz.value = renderZoom;

  const zoomBy = (f: number) => {
    const ns = Math.min(MAX_Z, Math.max(MIN_Z, s.value * f));
    const k = ns / s.value;
    const fx = box.w / 2;
    const fy = box.h / 2;
    tx.value = withTiming(fx - (fx - tx.value) * k);
    ty.value = withTiming(fy - (fy - ty.value) * k);
    s.value = withTiming(ns);
    setZoom(ns);
  };

  if (!tracker) return <T style={{ padding: 20 }}>Map not found.</T>;

  // sizes in content px, compensated for zoom so marks stay readable
  const px = (n: number) => n / zoom;
  const sel = entries.find((e) => e.pin.id === selected);
  const selDone = sel ? isItemDone(p, sel.item) : false;
  const roadColor = c.name === 'lamplight' ? '#6b5738' : '#a88d62';

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen options={{ title: `${tracker.short} Map` }} />
      <View style={[styles.legend, { borderColor: c.border }]}>
        {anyExact && <Chip text="● Exact position" tone="green" />}
        {anyApprox && <Chip text="◌ Approximate area" tone="gold" />}
        <Chip text="Grey = done" />
      </View>
      <View style={{ flex: 1, overflow: 'hidden' }} onLayout={onLayout}>
        <GestureDetector gesture={gesture}>
          <View style={StyleSheet.absoluteFill} collapsable={false}>
            <Animated.View style={[{ width: cw * renderZoom, height: ch * renderZoom, transformOrigin: 'top left' }, animStyle]}>
              <Svg width={cw * renderZoom} height={ch * renderZoom} viewBox={`${B.minX} ${-B.maxY} ${W} ${H}`}>
                <G>
                  <Path d={guide.map.roads} stroke={roadColor} strokeWidth={px(1.1) / base} fill="none" />
                  <Path d={guide.map.rail} stroke={c.inkMuted} strokeWidth={px(1.6) / base} strokeDasharray={`${px(5) / base} ${px(3) / base}`} fill="none" />
                  {guide.map.labels
                    .filter((l) => l.kind === 'town' || zoom >= 4)
                    .map((l) => (
                      <SvgText
                        key={`${l.text}-${l.x}`}
                        x={l.x}
                        y={-l.y}
                        fontSize={px(l.kind === 'town' ? 13 : 10) / base}
                        fontFamily={l.kind === 'town' ? fonts.display : fonts.bodyItalic}
                        fill={l.kind === 'town' ? c.ink : c.inkMuted}
                        textAnchor="middle"
                      >
                        {l.text}
                      </SvgText>
                    ))}
                  {entries.map((e, n) => {
                    const done = isItemDone(p, e.item);
                    const r = px(8) / base;
                    const isSel = e.pin.id === selected;
                    const col = done ? c.inkFaint : e.pin.approximate ? c.gold : c.red;
                    return (
                      <G key={e.pin.id}>
                        {e.pin.approximate && (
                          <Circle cx={e.pin.x} cy={-e.pin.y} r={Math.max(180, r * 3)} stroke={col} strokeWidth={px(1.5) / base} strokeDasharray={`${px(4) / base} ${px(3) / base}`} fill={col} fillOpacity={0.12} />
                        )}
                        <Circle cx={e.pin.x} cy={-e.pin.y} r={isSel ? r * 1.5 : r} fill={col} stroke={isSel ? c.ink : c.bg} strokeWidth={px(isSel ? 3 : 1.5) / base} />
                        {zoom >= 2.5 && (
                          <SvgText x={e.pin.x} y={-e.pin.y - r * 1.6} fontSize={px(11) / base} fill={c.ink} fontFamily={fonts.type} textAnchor="middle">
                            {pinNumber(e, n)}
                          </SvgText>
                        )}
                      </G>
                    );
                  })}
                </G>
              </Svg>
            </Animated.View>
          </View>
        </GestureDetector>

        <View style={[styles.zoomCol, { bottom: 16 }]}>
          <ZoomBtn label="Zoom in" onPress={() => zoomBy(1.8)}>
            <PlusIcon color={c.ink} />
          </ZoomBtn>
          <ZoomBtn label="Zoom out" onPress={() => zoomBy(1 / 1.8)}>
            <MinusIcon color={c.ink} />
          </ZoomBtn>
          <ZoomBtn
            label="Show whole map"
            onPress={() => {
              s.value = withTiming(1);
              tx.value = withTiming((box.w - cw) / 2);
              ty.value = withTiming((box.h - ch) / 2);
              setZoom(1);
            }}
          >
            <T v="label" color={c.ink} style={{ fontSize: 12 }}>
              FIT
            </T>
          </ZoomBtn>
        </View>
      </View>

      {sel ? (
        <View style={[styles.card, { backgroundColor: c.card, borderColor: sel.pin.approximate ? c.gold : c.red, paddingBottom: insets.bottom + 10 }]}>
          <T v="title" numberOfLines={2}>
            <SpoilerText safe={sel.item.label} real={sel.item.spoilerLabel} />
          </T>
          <T v="label" color={sel.pin.approximate ? c.gold : c.green}>
            {sel.pin.approximate ? 'APPROXIMATE AREA: SEARCH AROUND HERE' : 'EXACT POSITION'}
          </T>
          {sel.item.detail && (
            <T v="small" numberOfLines={4} style={{ marginTop: 4 }}>
              {sel.item.detail}
            </T>
          )}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Button
              title={selDone ? 'Untick' : 'Tick as found'}
              tone={selDone ? 'plain' : 'red'}
              style={{ flex: 1 }}
              onPress={() => {
                const key = sel.item.stepId ?? sel.item.id;
                const was = getState().checks[key] !== undefined;
                setChecked(key, !was);
                offerUndo(`${was ? 'Unticked' : 'Ticked'}: ${sel.item.label}`, () => setChecked(key, was));
              }}
            />
            <Button title="In list" onPress={() => router.push({ pathname: '/trackers/[id]', params: { id: tracker.id, focus: sel.item.id } })} />
            <Button title="Zoom" onPress={() => centerOn(sel.pin.x, sel.pin.y, Math.max(zoom, 5))} />
          </View>
        </View>
      ) : (
        <View style={[styles.credit, { paddingBottom: insets.bottom + 6 }]}>
          <T v="small" style={{ fontSize: 11, lineHeight: 15 }}>
            {`Tap a pin for details. ${tracker.mapNote ?? ''} Drawn map, not to game art. ${guide.map.credit}`}
          </T>
        </View>
      )}
      <UndoBar bottom={sel ? 180 : 0} />
    </View>
  );
}

function pinNumber(e: Entry, n: number) {
  const m = e.item.label.match(/(\d{2})/);
  return m ? m[1] : String(n + 1);
}

function ZoomBtn({ children, onPress, label }: { children: React.ReactNode; onPress: () => void; label: string }) {
  const c = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.zoomBtn, { backgroundColor: c.card, borderColor: c.gold }, pressed && { opacity: 0.6 }]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, paddingTop: 8, paddingBottom: 2, borderBottomWidth: 1 },
  zoomCol: { position: 'absolute', right: 12, gap: 10 },
  zoomBtn: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  card: { borderTopWidth: 2, padding: 12 },
  credit: { paddingHorizontal: 12, paddingTop: 6 },
});
