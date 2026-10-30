import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, spacing } from '../theme';
import { AppText } from './AppText';

export function BrandMark({ size = 26, inverted = false }: { size?: number; inverted?: boolean }) {
  return (
    <View style={[styles.mark, inverted && styles.markInverted, { width: size, height: size, borderRadius: size * 0.28 }]}>
      <Svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="8.5" stroke={inverted ? colors.heroSurface : colors.accentTintStrong} strokeWidth={3.4} fill="none" />
        <Path d="M12 3.5a8.5 8.5 0 018.5 8.5" stroke={inverted ? colors.lime : colors.accent} strokeWidth={3.4} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}

export function Wordmark({ inverted = false }: { inverted?: boolean }) {
  return (
    <View style={styles.row} accessibilityLabel="Jota">
      <BrandMark inverted={inverted} />
      <AppText variant="h3" tone={inverted ? 'onHero' : 'primary'}>
        jota
      </AppText>
    </View>
  );
}

/** Decorative partial ring from the welcome mockup. */
export function HeroRing({ size = 360 }: { size?: number }) {
  const stroke = 22;
  const r = (size - stroke) / 2 - 18;
  const c = size / 2;
  const arc = (startDeg: number, endDeg: number) => {
    const toXY = (deg: number) => {
      const rad = ((deg - 90) * Math.PI) / 180;
      return `${c + r * Math.cos(rad)} ${c + r * Math.sin(rad)}`;
    };
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${toXY(startDeg)} A ${r} ${r} 0 ${large} 1 ${toXY(endDeg)}`;
  };
  return (
    <Svg width={size} height={size} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Circle cx={c} cy={c} r={r + 18} stroke={colors.heroSurface} strokeWidth={1} fill="none" />
      <Circle cx={c} cy={c} r={r} stroke={colors.heroSurface} strokeWidth={stroke} fill="none" />
      <Path d={arc(20, 75)} stroke={colors.lime} strokeWidth={stroke} strokeLinecap="round" fill="none" />
      <Path d={arc(200, 262)} stroke={colors.lime} strokeWidth={stroke} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mark: { backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' },
  markInverted: { backgroundColor: colors.heroSurface },
});
