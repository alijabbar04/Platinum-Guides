import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Rye_400Regular } from '@expo-google-fonts/rye';
import { SpecialElite_400Regular } from '@expo-google-fonts/special-elite';
import {
  LibreCaslonText_400Regular,
  LibreCaslonText_400Regular_Italic,
  LibreCaslonText_700Bold,
} from '@expo-google-fonts/libre-caslon-text';
import { loadProgress, useProgress } from '../lib/progress';
import { usePalette } from '../lib/useTheme';
import { fonts } from '../lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});
loadProgress();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Rye_400Regular,
    SpecialElite_400Regular,
    LibreCaslonText_400Regular,
    LibreCaslonText_400Regular_Italic,
    LibreCaslonText_700Bold,
  });
  const p = useProgress();
  const c = usePalette();
  const ready = fontsLoaded && p.loaded;

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(c.bg).catch(() => {});
  }, [c.bg]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: c.bg }}>
      <SafeAreaProvider>
        <StatusBar style={c.statusBar} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: c.bg },
            headerTintColor: c.ink,
            headerTitleStyle: { fontFamily: fonts.display, fontSize: 20, color: c.ink },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: c.bg },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="trackers/index" options={{ title: 'Trackers' }} />
          <Stack.Screen name="trackers/[id]" options={{ title: '' }} />
          <Stack.Screen name="map/[tracker]" options={{ title: 'Map' }} />
          <Stack.Screen name="trophies" options={{ title: 'Trophies' }} />
          <Stack.Screen name="search" options={{ title: 'Search' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings & Backup' }} />
          <Stack.Screen name="issues" options={{ title: 'Unverified & Disputed' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
