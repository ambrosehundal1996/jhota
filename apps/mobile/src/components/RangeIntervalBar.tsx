import type { ProteinRange } from '@jota/domain';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import { AppText } from './AppText';
import { suggestedSliderBounds, xAtGrams } from './rangeSliderMath';

const TRACK_H = 10;
const CAP = 12;
const LABEL_W = 72;

/**
 * Display-only interval: the highlighted band is the user’s range.
 * No progress fill — onboarding should not imply a current intake.
 */
export function RangeIntervalBar({
  range,
  suggested,
}: {
  range: ProteinRange;
  suggested: ProteinRange;
}) {
  const scale = useMemo(() => suggestedSliderBounds(suggested), [suggested]);
  const [width, setWidth] = useState(0);
  const minX = xAtGrams(range.min, width, scale);
  const maxX = xAtGrams(range.max, width, scale);
  const zoneW = Math.max(CAP, maxX - minX);
  const overlap = width > 0 && Math.abs(maxX - minX) < LABEL_W;
  const minLeft = clampLabel(minX, width);
  const maxLeft = clampLabel(maxX, width);
  return (
    <View
      style={styles.wrap}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      testID="range-interval"
    >
      <View style={styles.hit} onLayout={e => setWidth(e.nativeEvent.layout.width)} collapsable={false}>
        <View style={styles.track} />
        {width > 0 ? (
          <>
            <View pointerEvents="none" style={[styles.zone, { left: minX, width: zoneW }]} />
            <View pointerEvents="none" style={[styles.cap, { left: minX - CAP / 2 }]} />
            <View pointerEvents="none" style={[styles.cap, { left: maxX - CAP / 2 }]} />
          </>
        ) : null}
      </View>
      {width > 0 ? (
        overlap ? (
          <View style={styles.spread}>
            <Bound label="Lower" grams={range.min} align="left" />
            <Bound label="Upper" grams={range.max} align="right" />
          </View>
        ) : (
          <View style={styles.overlay}>
            <View style={[styles.boundWrap, { left: minLeft }]}>
              <Bound label="Lower" grams={range.min} align="center" />
            </View>
            <View style={[styles.boundWrap, { left: maxLeft }]}>
              <Bound label="Upper" grams={range.max} align="center" />
            </View>
          </View>
        )
      ) : null}
    </View>
  );
}

function Bound({ label, grams, align }: { label: string; grams: number; align: 'left' | 'right' | 'center' }) {
  return (
    <View>
      <AppText variant="caption" tone="tertiary" align={align}>
        {label}
      </AppText>
      <AppText variant="captionStrong" tone="accent" align={align}>
        {Math.round(grams)}g
      </AppText>
    </View>
  );
}

function clampLabel(center: number, trackW: number): number {
  if (trackW <= 0) return 0;
  return Math.max(0, Math.min(trackW - LABEL_W, center - LABEL_W / 2));
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', gap: spacing.sm, paddingTop: spacing.sm, paddingHorizontal: CAP / 2, overflow: 'visible' },
  hit: { height: CAP, justifyContent: 'center', overflow: 'visible' },
  track: {
    height: TRACK_H,
    borderRadius: radii.pill,
    backgroundColor: colors.track,
  },
  zone: {
    position: 'absolute',
    top: (CAP - TRACK_H) / 2,
    height: TRACK_H,
    borderRadius: radii.pill,
    backgroundColor: colors.hero,
  },
  cap: {
    position: 'absolute',
    top: 0,
    width: CAP,
    height: CAP,
    borderRadius: CAP / 2,
    backgroundColor: colors.lime,
    borderWidth: 2,
    borderColor: colors.hero,
  },
  overlay: { height: 36 },
  boundWrap: { position: 'absolute', width: LABEL_W },
  spread: { flexDirection: 'row', justifyContent: 'space-between' },
});
