import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, spacing } from '../theme';
import { AppText } from './AppText';

export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.28 }]}>
      <Svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="8.5" stroke={colors.accentTintStrong} strokeWidth={3.4} fill="none" />
        <Path d="M12 3.5a8.5 8.5 0 018.5 8.5" stroke={colors.accent} strokeWidth={3.4} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}

export function Wordmark() {
  return (
    <View style={styles.row} accessibilityLabel="Steady">
      <BrandMark />
      <AppText variant="h3">steady</AppText>
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
      <Circle cx={c} cy={c} r={r + 18} stroke={colors.accentTint} strokeWidth={1} fill="none" />
      <Circle cx={c} cy={c} r={r} stroke={colors.accentTint} strokeWidth={stroke} fill="none" />
      <Path d={arc(20, 75)} stroke={colors.accent} strokeWidth={stroke} strokeLinecap="round" fill="none" />
      <Path d={arc(200, 262)} stroke={colors.accent} strokeWidth={stroke} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mark: { backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' },
});
