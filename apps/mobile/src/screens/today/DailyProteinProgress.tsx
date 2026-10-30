import { goalStatusHeadline, rangeBarLayout, type GoalStatus, type ProteinRange } from '@jota/domain';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AppText, CountUpText, Icon, LogDeltaChip } from '../../components';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { colors, spacing } from '../../theme';

const TRACK_H = 12;
const MARKER = 18;
const TICK_W = 2;

export function DailyProteinProgress({
  total,
  range,
  status,
  source,
}: {
  total: number;
  range: ProteinRange;
  status: GoalStatus;
  source?: 'logged' | 'override';
}) {
  const reduceMotion = useReduceMotion();
  const layout = useMemo(() => rangeBarLayout(total, range), [total, range]);
  const headline = goalStatusHeadline(status);
  const [trackW, setTrackW] = useState(0);
  const progress = useSharedValue(layout.current);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = layout.current;
      return;
    }
    progress.value = withTiming(layout.current, { duration: 520, easing: Easing.out(Easing.cubic) });
  }, [layout, reduceMotion, progress]);

  const fillStyle = useAnimatedStyle(() => ({ width: trackW * progress.value }));
  const markerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: trackW * progress.value - MARKER / 2 }],
  }));

  const minLeft = layout.minStart * trackW;
  const maxLeft = layout.maxEnd * trackW;
  const zoneW = Math.max(4, maxLeft - minLeft);
  const fillColor = colors.lime;
  const label = `${Math.round(total)} grams consumed today. Daily goal ${Math.round(range.min)} to ${Math.round(range.max)} grams. ${headline}`;

  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: Math.round(layout.scaleMax), now: Math.round(total) }}
    >
      <View style={styles.numberBlock}>
        <LogDeltaChip />
        <View style={styles.totalRow}>
          <CountUpText variant="display" value={total} testID="today-total" tone="onHero" />
          <AppText variant="h2" tone="onHeroMuted">
            g
          </AppText>
        </View>
        <AppText variant="caption" tone="onHeroMuted">
          {source === 'override' ? 'Total set today' : 'Protein consumed today'}
        </AppText>
        <AppText variant="body" tone="onHeroMuted" style={styles.goal}>
          Your daily goal: {Math.round(range.min)}–{Math.round(range.max)}g
        </AppText>
      </View>

      <View style={styles.barBlock}>
        <View style={styles.trackHit} onLayout={e => setTrackW(e.nativeEvent.layout.width)} collapsable={false}>
          <View style={styles.track} />
          {trackW > 0 ? (
            <View
              pointerEvents="none"
              style={[
                styles.zone,
                {
                  left: minLeft,
                  width: zoneW,
                },
              ]}
            />
          ) : null}
          {trackW > 0 ? <Animated.View pointerEvents="none" style={[styles.fill, { backgroundColor: fillColor }, fillStyle]} /> : null}
          {trackW > 0 ? (
            <>
              <View pointerEvents="none" style={[styles.tick, { left: minLeft - TICK_W / 2 }]} />
              <View pointerEvents="none" style={[styles.tick, { left: maxLeft - TICK_W / 2 }]} />
              <Animated.View pointerEvents="none" style={[styles.marker, status.reached && styles.markerReached, markerStyle]} />
            </>
          ) : null}
        </View>
        {trackW > 0 ? (
          <View style={styles.labels}>
            <AppText variant="caption" tone="onHeroMuted" style={[styles.bound, { left: clampLabel(minLeft, trackW) }]}>
              {Math.round(range.min)}g
            </AppText>
            <AppText variant="caption" tone="onHeroMuted" style={[styles.bound, { left: clampLabel(maxLeft, trackW) }]}>
              {Math.round(range.max)}g
            </AppText>
          </View>
        ) : null}
      </View>

      {status.reached ? (
        <View style={styles.statusRow} accessibilityLiveRegion="polite">
          <Icon name="check" size={18} color={colors.lime} strokeWidth={2.4} />
          <AppText variant="h3" tone="lime" style={styles.statusText} testID="today-status">
            {headline}
          </AppText>
        </View>
      ) : (
        <AppText variant="h3" tone="onHero" style={styles.status} testID="today-status">
          {headline}
        </AppText>
      )}
    </View>
  );
}

const LABEL_W = 52;

function clampLabel(center: number, trackW: number): number {
  return Math.max(0, Math.min(trackW - LABEL_W, center - LABEL_W / 2));
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.hero,
    borderRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  numberBlock: { gap: spacing.xs, paddingTop: spacing.xl },
  totalRow: { flexDirection: 'row', alignItems: 'baseline' },
  goal: { marginTop: spacing.xs },
  barBlock: { marginTop: spacing.sm, gap: spacing.sm, paddingHorizontal: MARKER / 2 },
  trackHit: { height: MARKER, justifyContent: 'center' },
  track: {
    height: TRACK_H,
    borderRadius: TRACK_H,
    backgroundColor: colors.white,
  },
  zone: {
    position: 'absolute',
    height: TRACK_H,
    borderRadius: 4,
    backgroundColor: colors.lime,
    opacity: 0.28,
  },
  fill: {
    position: 'absolute',
    height: TRACK_H,
    borderRadius: TRACK_H,
    left: 0,
  },
  tick: {
    position: 'absolute',
    width: TICK_W,
    height: 18,
    borderRadius: 1,
    backgroundColor: colors.lime,
    top: (MARKER - 18) / 2,
  },
  marker: {
    position: 'absolute',
    top: 0,
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    backgroundColor: colors.lime,
    borderWidth: 2,
    borderColor: colors.white,
  },
  markerReached: { borderColor: colors.white },
  labels: { height: 18 },
  bound: { position: 'absolute', width: LABEL_W, textAlign: 'center' },
  status: { marginTop: spacing.xs },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  statusText: { flexShrink: 1 },
});
