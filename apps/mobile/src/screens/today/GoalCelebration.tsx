import { computeGoalStreak, weeklySummary } from '@jota/domain';
import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { AppText, ProgressRing } from '../../components';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useDay, useTotalsByDate } from '../../hooks/useAppData';
import { useLocalToday } from '../../hooks/useLocalToday';
import { haptic } from '../../services/haptics';
import { setState, useAppStore } from '../../state/appStore';
import { colors, spacing } from '../../theme';

const PARTICLE_OFFSETS = [
  { x: -42, y: -58, size: 6, delay: 0 },
  { x: 36, y: -64, size: 5, delay: 40 },
  { x: -18, y: -78, size: 4, delay: 80 },
  { x: 22, y: -48, size: 7, delay: 30 },
  { x: -56, y: -28, size: 5, delay: 90 },
  { x: 54, y: -24, size: 4, delay: 50 },
  { x: -8, y: -92, size: 5, delay: 20 },
  { x: 8, y: -70, size: 6, delay: 70 },
];

function dismiss(): void {
  setState(s => ({ flags: { ...s.flags, pendingCelebrationDate: null } }));
}

/** ~2s overlay. Tap anywhere to dismiss. Does not block the rest of the app once it closes. */
export function GoalCelebrationHost() {
  const today = useLocalToday();
  const pending = useAppStore(s => s.flags.pendingCelebrationDate);
  if (pending !== today) return null;
  return <GoalCelebration />;
}

function GoalCelebration() {
  const today = useLocalToday();
  const day = useDay(today);
  const totals = useTotalsByDate();
  const reduceMotion = useReduceMotion();
  const total = Math.round(day.total.total);
  const week = useMemo(() => weeklySummary(totals, today, day.range), [totals, today, day.range]);
  const streak = useMemo(() => computeGoalStreak(totals, today, day.range.min), [totals, today, day.range.min]);

  useEffect(() => {
    haptic('success');
    const timer = setTimeout(dismiss, 2000);
    return () => clearTimeout(timer);
  }, []);

  const hasHistory = week.days.some(d => d.date !== today && d.tracked);
  const quietLine = hasHistory
    ? `${week.goalDays} of the last ${week.totalDays} days.`
    : streak > 1
      ? `${streak} days in a row`
      : null;

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.host]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Goal hit. Dismiss."
        onPress={dismiss}
        style={StyleSheet.absoluteFill}
      >
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(160)} style={styles.scrim} />
      </Pressable>
      <View pointerEvents="none" style={styles.center}>
        <Animated.View entering={reduceMotion ? undefined : ZoomIn.duration(280)}>
          <View>
            {!reduceMotion
              ? PARTICLE_OFFSETS.map((particle, i) => (
                  <Animated.View
                    key={i}
                    entering={FadeIn.delay(140 + particle.delay).duration(280)}
                    exiting={FadeOut.duration(200)}
                    style={[
                      styles.particle,
                      {
                        width: particle.size,
                        height: particle.size,
                        borderRadius: particle.size / 2,
                        transform: [{ translateX: particle.x }, { translateY: particle.y }],
                      },
                    ]}
                  />
                ))
              : null}
            <ProgressRing progress={1} size={168} strokeWidth={14} pulseKey="goal" accessibilityLabel="Goal hit">
              <AppText variant="h2" tone="accent">
                {total}g
              </AppText>
            </ProgressRing>
          </View>
        </Animated.View>
        <Animated.View entering={reduceMotion ? undefined : FadeIn.delay(120).duration(220)} style={styles.copy}>
          <AppText variant="title" align="center" accessibilityRole="header">
            Goal hit. {total}g today.
          </AppText>
          {quietLine ? (
            <AppText variant="body" tone="secondary" align="center">
              {quietLine}
            </AppText>
          ) : null}
          {/* TODO: share this day card */}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { zIndex: 30 },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.scrim,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.xxl,
  },
  copy: { gap: spacing.sm },
  particle: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -3,
    marginTop: -3,
    backgroundColor: colors.accent,
    opacity: 0.55,
  },
});
