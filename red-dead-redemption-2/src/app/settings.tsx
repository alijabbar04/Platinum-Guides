import React, { useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import Constants from 'expo-constants';
import { guide } from '../lib/guide';
import { applyBackup, flush, makeBackup, parseBackup, resetProgress, updateSettings, useProgress } from '../lib/progress';
import { usePalette } from '../lib/useTheme';
import { Button, Rule, T } from '../components/ui';

function backupName() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `rdr2-ledger-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
}

export default function SettingsScreen() {
  const c = usePalette();
  const p = useProgress();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<string>();

  const json = () => JSON.stringify(makeBackup(guide.version), null, 1);

  const saveToFolder = async () => {
    try {
      await flush();
      const dir = await Directory.pickDirectoryAsync();
      const f = dir.createFile(backupName(), 'application/json');
      f.write(json());
      setStatus(`Saved ${f.name ?? 'backup'} (${Object.keys(p.checks).length} ticks).`);
    } catch (e: any) {
      if (!/cancel/i.test(String(e?.message))) setStatus(`Could not save: ${e?.message ?? e}`);
    }
  };

  const share = async () => {
    try {
      await flush();
      const f = new File(Paths.cache, backupName());
      f.create({ overwrite: true });
      f.write(json());
      if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
      await Sharing.shareAsync(f.uri, { mimeType: 'application/json', dialogTitle: 'Save or send your backup' });
      setStatus('Backup handed to the share sheet.');
    } catch (e: any) {
      setStatus(`Could not share: ${e?.message ?? e}`);
    }
  };

  const importBackup = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
      if (res.canceled) return;
      const text = await new File(res.assets[0].uri).text();
      const b = parseBackup(text);
      const n = Object.keys(b.checks).length;
      Alert.alert(
        'Import backup?',
        `This backup has ${n} ticks and ${Object.keys(b.counters).length} counters (exported ${b.exportedAt.slice(0, 16).replace('T', ' ')}).\n\nReplace wipes current progress and uses the backup. Merge keeps both.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Merge', onPress: () => (applyBackup(b, 'merge'), setStatus(`Merged ${n} ticks from backup.`)) },
          { text: 'Replace', style: 'destructive', onPress: () => (applyBackup(b, 'replace'), setStatus(`Restored ${n} ticks from backup.`)) },
        ],
      );
    } catch (e: any) {
      setStatus(`Import failed: ${e?.message ?? e}`);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 30 }}>
      <T v="label">DISPLAY</T>
      <Row label="Lamplight (dark) theme" hint="Easier on the eyes in a dim room.">
        <Switch
          value={p.settings.theme === 'lamplight'}
          onValueChange={(v) => updateSettings({ theme: v ? 'lamplight' : 'daylight' })}
          trackColor={{ true: c.gold, false: c.border }}
          thumbColor={c.ink}
          accessibilityLabel="Lamplight dark theme"
        />
      </Row>
      <Row label="Spoiler shield" hint="Hide mission names and story details until tapped.">
        <Switch
          value={p.settings.spoilerShield}
          onValueChange={(v) => updateSettings({ spoilerShield: v })}
          trackColor={{ true: c.gold, false: c.border }}
          thumbColor={c.ink}
          accessibilityLabel="Spoiler shield"
        />
      </Row>

      <Rule style={{ marginVertical: 16 }} />
      <T v="label">BACKUP</T>
      <T style={{ marginTop: 6 }}>
        {`Progress saves on this phone automatically after every tick. ${Object.keys(p.checks).length} ticks and ${Object.keys(p.counters).length} counters are stored now. Make a backup file before reinstalling or changing phones.`}
      </T>
      <Button title="Save backup to a folder" tone="gold" onPress={saveToFolder} style={styles.btn} />
      <Button title="Share backup (Drive, email…)" onPress={share} style={styles.btn} />
      <Button title="Import a backup" onPress={importBackup} style={styles.btn} />
      {status && (
        <T v="bodyBold" color={c.green} style={{ marginTop: 10 }} accessibilityLiveRegion="polite">
          {status}
        </T>
      )}

      <Rule style={{ marginVertical: 16 }} />
      <T v="label">ACCURACY</T>
      <T style={{ marginTop: 6 }}>
        {`${guide.issues.length} points where sources disagreed or could not be fully confirmed are listed, with what the guide does about each.`}
      </T>
      <Button title="Unverified & disputed items" onPress={() => router.push('/issues')} style={styles.btn} />

      <Rule style={{ marginVertical: 16 }} />
      <T v="label">RESET</T>
      <Button
        title="Clear all progress"
        tone="red"
        style={styles.btn}
        onPress={() =>
          Alert.alert('Clear all progress?', 'Every tick and counter will be removed. Make a backup first if you might want them back.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear everything', style: 'destructive', onPress: () => (resetProgress(), setStatus('Progress cleared.')) },
          ])
        }
      />

      <Rule style={{ marginVertical: 16 }} />
      <T v="label">ABOUT</T>
      <T style={{ marginTop: 6 }}>
        {`Platinum Ledger ${Constants.expoConfig?.version ?? ''} · guide content ${guide.builtAt} · ${guide.steps.length} steps · ${Platform.OS}`}
      </T>
      <T v="small" style={{ marginTop: 6 }}>
        An unofficial fan guide. Not affiliated with or endorsed by Rockstar Games or Take-Two Interactive. Red Dead Redemption is their trademark. No game artwork or logos are used; maps are drawn by the app from open (Unlicense) coordinate data by jeanropke/RDOMap and RDR2CollectorsMap. Fonts: Rye, Libre Caslon Text (SIL Open Font License) and Special Elite (Apache 2.0).
      </T>
      <T v="small" style={{ marginTop: 6 }}>
        Guide text was written from cross-checked community sources (PowerPyx, rdr2.org, Red Dead wiki, GamerGuides and others); each step keeps its sources in the project repository.
      </T>
      <Button small title="Project on GitHub" onPress={() => Linking.openURL('https://github.com/alijabbar04/Platinum-Guides')} style={styles.btn} />
    </ScrollView>
  );
}

function Row({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  const c = usePalette();
  return (
    <View style={[styles.row, { borderColor: c.rule }]}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <T v="bodyBold">{label}</T>
        <T v="small">{hint}</T>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 64, borderBottomWidth: 1, paddingVertical: 8 },
  btn: { marginTop: 10 },
});
