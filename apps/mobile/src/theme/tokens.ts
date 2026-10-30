import { Platform, type TextStyle } from 'react-native';

/**
 * Premium forest-green palette. Existing token names stay stable so screens
 * pick up the brand through shared components. Hero/lime tokens are for the
 * dark branded sections (welcome, daily progress).
 *
 * Forest Green #103B2D · Dark Green Surface #1C4D3D · Lime #B7EC92
 * Warm Cream #F7F8F3 · Dark Text #172B20 · Muted Light Green #D2E5D9
 * Dark Green Button #174B38 · Light Border #DCE6DE
 */
export const colors = {
  background: '#F7F8F3',
  surface: '#E8EFE9',
  surfaceRaised: '#FFFFFF',
  surfacePressed: '#DCE6DE',
  border: '#DCE6DE',
  borderStrong: '#C5D4C9',
  text: '#172B20',
  textSecondary: '#4A6356',
  textTertiary: '#5C7468',
  textOnAccent: '#FFFFFF',
  /** Primary actions and selected states on cream. */
  accent: '#174B38',
  accentPressed: '#103B2D',
  accentText: '#174B38',
  accentTint: '#D2E5D9',
  accentTintStrong: '#B7D4C3',
  accentBorder: '#8FB8A0',
  track: '#DCE6DE',
  neutralBar: '#C5D4C9',
  destructive: '#A8473C',
  scrim: 'rgba(16, 59, 45, 0.52)',
  heroScrim: 'rgba(16, 59, 45, 0.88)',
  white: '#FFFFFF',

  hero: '#103B2D',
  heroSurface: '#1C4D3D',
  lime: '#B7EC92',
  limePressed: '#9FD978',
  textOnHero: '#F7F8F3',
  textOnHeroMuted: '#D2E5D9',
  textOnLime: '#103B2D',
  heroTrack: '#245445',
  heroZone: '#2F6A56',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

const family = Platform.select({ ios: 'System', default: undefined });

const tabular: TextStyle['fontVariant'] = ['tabular-nums'];

export const typography = {
  display: { fontFamily: family, fontSize: 68, lineHeight: 74, fontWeight: '600', letterSpacing: -2, fontVariant: tabular },
  hero: { fontFamily: family, fontSize: 46, lineHeight: 52, fontWeight: '600', letterSpacing: -1.2, fontVariant: tabular },
  headline: { fontFamily: family, fontSize: 36, lineHeight: 40, fontWeight: '600', letterSpacing: -0.9 },
  title: { fontFamily: family, fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.6 },
  h2: { fontFamily: family, fontSize: 22, lineHeight: 28, fontWeight: '600', letterSpacing: -0.3 },
  h3: { fontFamily: family, fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontFamily: family, fontSize: 15, lineHeight: 21, fontWeight: '400' },
  bodyStrong: { fontFamily: family, fontSize: 15, lineHeight: 21, fontWeight: '600' },
  caption: { fontFamily: family, fontSize: 13, lineHeight: 18, fontWeight: '400' },
  captionStrong: { fontFamily: family, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  eyebrow: { fontFamily: family, fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 0.9, textTransform: 'uppercase' },
  number: { fontFamily: family, fontSize: 22, lineHeight: 26, fontWeight: '600', fontVariant: tabular },
  numberSmall: { fontFamily: family, fontSize: 17, lineHeight: 22, fontWeight: '600', fontVariant: tabular },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

export const shadows = {
  card: {
    shadowColor: '#103B2D',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  button: {
    shadowColor: '#103B2D',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 } as const;
