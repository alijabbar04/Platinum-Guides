// Hand-drawn line icons (own artwork), so no icon font or third-party art is bundled.
import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type P = { color: string; size?: number };

const S = ({ size = 26, children }: { size?: number; children: React.ReactNode }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {children}
  </Svg>
);

export const SearchIcon = ({ color, size }: P) => (
  <S size={size}>
    <Circle cx={10} cy={10} r={6.5} stroke={color} strokeWidth={2.2} />
    <Path d="M15 15 L21 21" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
  </S>
);

export const LedgerIcon = ({ color, size }: P) => (
  <S size={size}>
    <Rect x={4} y={3} width={16} height={18} rx={1.5} stroke={color} strokeWidth={2} />
    <Path d="M8 8 H16 M8 12 H16 M8 16 H13" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </S>
);

export const TrophyIcon = ({ color, size }: P) => (
  <S size={size}>
    <Path d="M7 4 H17 V9 A5 5 0 0 1 7 9 Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    <Path d="M7 6 H4 A3 3 0 0 0 7 11 M17 6 H20 A3 3 0 0 1 17 11" stroke={color} strokeWidth={1.8} />
    <Path d="M12 14 V18 M8 20 H16" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
  </S>
);

export const StarIcon = ({ color, size }: P) => (
  <S size={size}>
    <Path
      d="M12 2.5 L14.6 8.9 L21.5 9.4 L16.2 13.8 L17.9 20.6 L12 16.9 L6.1 20.6 L7.8 13.8 L2.5 9.4 L9.4 8.9 Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </S>
);

export const GearIcon = ({ color, size }: P) => (
  <S size={size}>
    <Circle cx={12} cy={12} r={3.2} stroke={color} strokeWidth={2} />
    <Path
      d="M12 2.5 V5.5 M12 18.5 V21.5 M2.5 12 H5.5 M18.5 12 H21.5 M5.3 5.3 L7.4 7.4 M16.6 16.6 L18.7 18.7 M5.3 18.7 L7.4 16.6 M16.6 7.4 L18.7 5.3"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
    />
    <Circle cx={12} cy={12} r={6.8} stroke={color} strokeWidth={1.6} />
  </S>
);

export const MapIcon = ({ color, size }: P) => (
  <S size={size}>
    <Path d="M3 6 L9 4 L15 6 L21 4 V18 L15 20 L9 18 L3 20 Z" stroke={color} strokeWidth={1.9} strokeLinejoin="round" />
    <Path d="M9 4 V18 M15 6 V20" stroke={color} strokeWidth={1.6} />
  </S>
);

export const DownIcon = ({ color, size }: P) => (
  <S size={size}>
    <Path d="M12 4 V19 M6 13 L12 19 L18 13" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </S>
);

export const FilterIcon = ({ color, size }: P) => (
  <S size={size}>
    <Path d="M3 5 H21 L14 13 V20 L10 18 V13 Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
  </S>
);

export const PlusIcon = ({ color, size }: P) => (
  <S size={size}>
    <Path d="M12 5 V19 M5 12 H19" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
  </S>
);

export const MinusIcon = ({ color, size }: P) => (
  <S size={size}>
    <Path d="M5 12 H19" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
  </S>
);
