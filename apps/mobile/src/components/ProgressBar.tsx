import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radii } from '../theme';

export function ProgressBar({ progress, height = 6 }: { progress: number; height?: number }) {
  const pct = Math.min(1, Math.max(0, progress)) * 100;
  return (
    <View
      style={[styles.track, { height, borderRadius: height }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
    >
      <View style={[styles.fill, { width: `${pct}%`, borderRadius: height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: colors.track, overflow: 'hidden', borderRadius: radii.pill },
  fill: { height: '100%', backgroundColor: colors.accent },
});
