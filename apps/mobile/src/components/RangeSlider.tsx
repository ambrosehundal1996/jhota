import type { ProteinRange } from '@jota/domain';
import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { haptic } from '../services/haptics';
import { colors, shadows, spacing } from '../theme';
import { AppText } from './AppText';
import { applyThumb, gramsAtX, nearestThumb, suggestedSliderBounds, xAtGrams, type SliderThumb } from './rangeSliderMath';

const THUMB = 28;
const TRACK_H = 6;

export function RangeSlider({
  range,
  suggested,
  onChange,
}: {
  range: ProteinRange;
  suggested: ProteinRange;
  onChange: (range: ProteinRange) => void;
}) {
  const bounds = useMemo(() => suggestedSliderBounds(suggested), [suggested]);
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const rangeRef = useRef(range);
  const boundsRef = useRef(bounds);
  const onChangeRef = useRef(onChange);
  const thumbRef = useRef<SliderThumb>('min');
  const lastHaptic = useRef(range.min + range.max);
  rangeRef.current = range;
  boundsRef.current = bounds;
  onChangeRef.current = onChange;
  widthRef.current = width;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: evt => {
        const w = widthRef.current;
        if (!w) return;
        thumbRef.current = nearestThumb(evt.nativeEvent.locationX, rangeRef.current, w, boundsRef.current);
        haptic('selection');
      },
      onPanResponderMove: evt => {
        const w = widthRef.current;
        if (!w) return;
        const track = boundsRef.current;
        const grams = gramsAtX(evt.nativeEvent.locationX, w, track);
        const next = applyThumb(rangeRef.current, thumbRef.current, grams, track);
        if (next.min === rangeRef.current.min && next.max === rangeRef.current.max) return;
        const key = next.min + next.max;
        if (key !== lastHaptic.current) {
          lastHaptic.current = key;
          haptic('selection');
        }
        onChangeRef.current(next);
      },
    }),
  ).current;

  const minX = xAtGrams(range.min, width, bounds);
  const maxX = xAtGrams(range.max, width, bounds);

  return (
    <View
      style={styles.wrap}
      accessibilityRole="adjustable"
      accessibilityLabel={`Protein range ${range.min} to ${range.max} grams. Drag the left handle to change the minimum, right handle for the maximum.`}
      accessibilityValue={{ min: bounds.min, max: bounds.max, now: range.min, text: `${range.min} to ${range.max} grams` }}
    >
      <View
        style={styles.hit}
        onLayout={e => setWidth(e.nativeEvent.layout.width)}
        {...pan.panHandlers}
      >
        <View style={styles.track} />
        {width > 0 ? (
          <View
            pointerEvents="none"
            style={[styles.fill, { left: minX, width: Math.max(TRACK_H, maxX - minX) }]}
          />
        ) : null}
        {width > 0 ? (
          <>
            <View pointerEvents="none" style={[styles.thumb, { left: minX - THUMB / 2 }]} />
            <View pointerEvents="none" style={[styles.thumb, { left: maxX - THUMB / 2 }]} />
          </>
        ) : null}
      </View>
      <View style={styles.labels} pointerEvents="none">
        <AppText variant="captionStrong">{range.min}g</AppText>
        <AppText variant="captionStrong">{range.max}g</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', width: '100%', gap: spacing.sm, paddingTop: spacing.md },
  hit: { height: THUMB, justifyContent: 'center' },
  track: {
    height: TRACK_H,
    borderRadius: TRACK_H,
    backgroundColor: colors.track,
  },
  fill: {
    position: 'absolute',
    height: TRACK_H,
    borderRadius: TRACK_H,
    backgroundColor: colors.accent,
  },
  thumb: {
    position: 'absolute',
    top: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.accent,
    ...shadows.card,
  },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
});
