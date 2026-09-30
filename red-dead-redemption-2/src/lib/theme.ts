// Frontier-print palette. "Lamplight" is the default: dark walnut with cream ink,
// readable in a dim room. "Daylight" is worn paper with dark ink.

export type ThemeName = 'lamplight' | 'daylight';

export type Palette = {
  name: ThemeName;
  bg: string;
  card: string;
  cardDone: string;
  border: string;
  rule: string;
  ink: string;
  inkMuted: string;
  inkFaint: string;
  red: string;
  redInk: string; // text on red
  gold: string;
  green: string;
  goldBg: string;
  warnBg: string;
  chipBg: string;
  overlay: string;
  statusBar: 'light' | 'dark';
};

export const palettes: Record<ThemeName, Palette> = {
  lamplight: {
    name: 'lamplight',
    bg: '#17120d',
    card: '#261e16',
    cardDone: '#1d1711',
    border: '#4a3a28',
    rule: '#3a2e21',
    ink: '#f0e4c8',
    inkMuted: '#bfab88',
    inkFaint: '#8a7a60',
    red: '#c8452f',
    redInk: '#fff4e2',
    gold: '#d9a84e',
    green: '#9dbb74',
    goldBg: '#33281a',
    warnBg: '#3a1c15',
    chipBg: '#332819',
    overlay: 'rgba(10,7,4,0.82)',
    statusBar: 'light',
  },
  daylight: {
    name: 'daylight',
    bg: '#e8dbbd',
    card: '#f5ecd6',
    cardDone: '#e2d5b6',
    border: '#b9a27a',
    rule: '#cdb991',
    ink: '#241a11',
    inkMuted: '#5c4a35',
    inkFaint: '#7d6a51',
    red: '#9b2616',
    redInk: '#fff6e8',
    gold: '#8a5d12',
    green: '#4d6b26',
    goldBg: '#efdfb7',
    warnBg: '#f2d6c6',
    chipBg: '#e6d6b1',
    overlay: 'rgba(40,28,16,0.6)',
    statusBar: 'dark',
  },
};

export const fonts = {
  display: 'Rye_400Regular', // wanted-poster display face (OFL)
  type: 'SpecialElite_400Regular', // typewriter / stamp labels (Apache 2.0)
  body: 'LibreCaslonText_400Regular', // Caslon: period book face (OFL)
  bodyItalic: 'LibreCaslonText_400Regular_Italic',
  bodyBold: 'LibreCaslonText_700Bold',
};

export const size = {
  body: 17,
  bodyLine: 25,
  small: 14,
  title: 19,
  tap: 52, // minimum tap target (dp)
};
