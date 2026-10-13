import { Platform, type TextStyle } from 'react-native';

export const colors = {
  background: '#FAFBFA',
  surface: '#F1F4F2',
  surfaceRaised: '#FFFFFF',
  surfacePressed: '#E8EDE9',
  border: '#E2E7E3',
  borderStrong: '#D3DAD5',
  text: '#121814',
  textSecondary: '#59635C',
  textTertiary: '#8A938C',
  textOnAccent: '#FFFFFF',
  accent: '#1E9E4A',
  accentPressed: '#178A3F',
  accentText: '#167A3A',
  accentTint: '#E4F4E9',
  accentTintStrong: '#CBEAD5',
  accentBorder: '#A9DCB9',
  track: '#E6EBE7',
  neutralBar: '#C8CEC9',
  destructive: '#A8473C',
  scrim: 'rgba(18, 24, 20, 0.32)',
  white: '#FFFFFF',
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
    shadowColor: '#0F1F14',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  button: {
    shadowColor: '#1E9E4A',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 } as const;
