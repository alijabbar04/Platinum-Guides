import React, { memo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import type { Step } from '../data/types';
import { trackerById, trophyById } from '../lib/guide';
import { usePalette } from '../lib/useTheme';
import { fonts } from '../lib/theme';
import { Button, CheckButton, Chip, Spoiler, SpoilerText, T } from './ui';
import { MapIcon } from './icons';

export const DONE_ROW_HEIGHT = 64;

const typeLabel: Record<Step['type'], string> = {
  mission: 'Mission',
  task: 'Task',
  warning: 'Warning',
  session: 'Free roam',
  info: 'Read me',
};

type Props = { step: Step; done: boolean; onToggle: (step: Step) => void; forceOpen?: boolean };

function StepCardInner({ step, done, onToggle, forceOpen }: Props) {
  const c = usePalette();
  const [peek, setPeek] = useState(false);

  if (done && !peek && !forceOpen) {
    return (
      <View style={[styles.doneRow, { backgroundColor: c.cardDone, borderColor: c.rule }]}>
        <CheckButton on onPress={() => onToggle(step)} label={`Untick: ${step.title}`} />
        <Pressable
          style={styles.doneTitle}
          onPress={() => setPeek(true)}
          accessibilityRole="button"
          accessibilityLabel={`Done: ${step.title}. Tap to read again`}
        >
          <T v="body" color={c.inkFaint} numberOfLines={1} style={{ textDecorationLine: 'line-through' }}>
            {step.title}
          </T>
        </Pressable>
      </View>
    );
  }

  const warning = step.type === 'warning';
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: warning ? c.warnBg : c.card, borderColor: warning ? c.red : step.missable ? c.gold : c.border },
        warning && { borderWidth: 2 },
      ]}
    >
      {warning && (
        <View style={[styles.poster, { backgroundColor: c.red }]}>
          <T v="stamp">★ POINT OF NO RETURN ★</T>
        </View>
      )}
      <View style={styles.head}>
        <CheckButton on={done} onPress={() => onToggle(step)} label={`${done ? 'Untick' : 'Tick'}: ${step.title}`} />
        <View style={{ flex: 1, paddingTop: 10 }}>
          <T v="title" accessibilityRole="header">
            {step.title}
          </T>
          <View style={styles.chips}>
            <Chip text={typeLabel[step.type]} />
            {step.missable && <Chip text="Missable" tone="red" />}
            {step.optional && <Chip text="Optional" />}
            {step.gold && step.gold.length > 0 && <Chip text="Gold medal" tone="gold" />}
            {done && <Chip text="Done" tone="green" />}
          </View>
        </View>
      </View>

      {step.missable && (
        <View style={[styles.ribbon, { borderColor: c.red }]}>
          <T v="label" color={c.red}>
            CUT-OFF
          </T>
          <T v="bodyBold">{step.missable.deadline}</T>
        </View>
      )}

      {step.missionName && (
        <Field label="Mission">
          <T>
            <SpoilerText safe="Name hidden (tap to show)" real={step.missionName} />
          </T>
        </Field>
      )}

      {step.where && (
        <Field label="Where">
          <T>{step.where}</T>
        </Field>
      )}

      {step.before && step.before.length > 0 && (
        <Field label="Before you start">
          {step.before.map((b, i) => (
            <Bullet key={i} mark="•" text={b} />
          ))}
        </Field>
      )}

      {step.how.length > 0 && (
        <Field label={step.type === 'mission' ? 'How' : 'What to do'}>
          {step.how.map((h, i) => (
            <Bullet key={i} mark={`${i + 1}.`} text={h} />
          ))}
        </Field>
      )}

      {step.gold && step.gold.length > 0 && (
        <View style={[styles.box, { backgroundColor: c.goldBg, borderColor: c.gold }]}>
          <T v="label" color={c.gold}>
            GOLD MEDAL OBJECTIVES
          </T>
          {step.gold.map((g, i) => (
            <Bullet key={i} mark="◆" text={g} markColor={c.gold} />
          ))}
          {step.goldTips?.map((g, i) => (
            <T key={`t${i}`} v="italic" style={{ marginTop: 4 }}>
              Tip: {g}
            </T>
          ))}
          <T v="small" style={{ marginTop: 6 }}>
            Missed gold? Replay the mission after the story; tick it in the Gold Medals tracker when you get it.
          </T>
        </View>
      )}

      {step.tip && (
        <Field label="Tip">
          <T v="italic" color={c.ink}>
            {step.tip}
          </T>
        </Field>
      )}

      {step.spoiler && step.spoiler.length > 0 && <Spoiler lines={step.spoiler} />}

      {step.unverified && (
        <View style={[styles.box, { borderColor: c.border, borderStyle: 'dashed' }]}>
          <T v="label">NOT FULLY VERIFIED</T>
          <T v="small" color={c.inkMuted} style={{ marginTop: 2 }}>
            {step.unverified}
          </T>
        </View>
      )}

      {(step.counts.length > 0 || step.trackers.length > 0) && (
        <View style={{ marginTop: 12 }}>
          <T v="label">COUNTS TOWARDS</T>
          <View style={[styles.chips, { marginTop: 6 }]}>
            {step.counts.map((id) => {
              const t = trophyById.get(id);
              if (!t) return null;
              return (
                <Pressable
                  key={id}
                  onPress={() => router.push({ pathname: '/trophies', params: { focus: id } })}
                  accessibilityRole="link"
                  accessibilityLabel={`Trophy ${t.name}`}
                  style={[styles.link, { borderColor: c.gold }]}
                >
                  <T v="small" color={c.gold} style={{ fontFamily: fonts.type }}>
                    🏆 {t.name}
                  </T>
                </Pressable>
              );
            })}
          </View>
          {step.trackers.map((id) => {
            const tr = trackerById.get(id);
            if (!tr) return null;
            return (
              <Button
                key={id}
                small
                title={`Open tracker: ${tr.short}`}
                onPress={() => router.push({ pathname: '/trackers/[id]', params: { id } })}
                icon={tr.hasMap ? <MapIcon color={c.ink} size={20} /> : undefined}
                style={{ marginTop: 6, justifyContent: 'flex-start' }}
              />
            );
          })}
        </View>
      )}

      {done && peek && (
        <Pressable onPress={() => setPeek(false)} style={styles.collapse} accessibilityRole="button">
          <T v="label">COLLAPSE ▲</T>
        </Pressable>
      )}
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 12 }}>
      <T v="label" style={{ marginBottom: 3 }}>
        {label.toUpperCase()}
      </T>
      {children}
    </View>
  );
}

function Bullet({ mark, text, markColor }: { mark: string; text: string; markColor?: string }) {
  const c = usePalette();
  return (
    <View style={{ flexDirection: 'row', marginTop: 3 }}>
      <T style={{ width: 26, color: markColor ?? c.inkMuted, fontFamily: fonts.type }}>{mark}</T>
      <T style={{ flex: 1 }}>{text}</T>
    </View>
  );
}

export const StepCard = memo(StepCardInner);

const styles = StyleSheet.create({
  doneRow: {
    height: DONE_ROW_HEIGHT - 6,
    marginBottom: 6,
    marginHorizontal: 10,
    borderWidth: 1,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  doneTitle: { flex: 1, height: '100%', justifyContent: 'center' },
  card: { marginHorizontal: 10, marginBottom: 12, borderWidth: 1.5, borderRadius: 6, padding: 12, paddingTop: 4, overflow: 'hidden' },
  poster: { marginHorizontal: -12, marginTop: -4, marginBottom: 6, paddingVertical: 7, alignItems: 'center' },
  head: { flexDirection: 'row', marginLeft: -8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  ribbon: { borderLeftWidth: 4, paddingLeft: 10, marginTop: 8, paddingVertical: 2 },
  box: { borderWidth: 1, borderRadius: 4, padding: 10, marginTop: 12 },
  link: { borderWidth: 1, borderRadius: 3, paddingHorizontal: 8, paddingVertical: 8, marginRight: 6, marginBottom: 6, minHeight: 40, justifyContent: 'center' },
  collapse: { alignItems: 'center', paddingVertical: 12, marginTop: 6 },
});
