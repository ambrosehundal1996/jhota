import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, FadeInDown, FadeOutUp, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { colors, radii, spacing } from '../theme';
import { AppText } from './AppText';
import { clearLogPulse, useLogPulse } from '../features/logging/feedback';

/** Short-lived "+32g · 38g to go" chip. Never blocks taps. */
export function LogDeltaChip() {
  const pulse = useLogPulse();
  const reduceMotion = useReduceMotion();
  const lift = useSharedValue(0);

  useEffect(() => {
    if (!pulse.label) return;
    lift.value = reduceMotion ? -8 : 0;
    if (!reduceMotion) {
      lift.value = withTiming(-10, { duration: 900, easing: Easing.out(Easing.cubic) });
    }
    const timer = setTimeout(() => clearLogPulse(), 1000);
    return () => clearTimeout(timer);
  }, [pulse.id, pulse.label, reduceMotion, lift]);

  const motion = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));
  if (!pulse.label) return null;

  return (
    <Animated.View
      pointerEvents="none"
      entering={reduceMotion ? undefined : FadeInDown.duration(120)}
      exiting={reduceMotion ? undefined : FadeOutUp.duration(180)}
      style={[styles.chip, motion]}
      accessibilityLiveRegion="polite"
    >
      <AppText variant="captionStrong" tone="accent">
        {pulse.label}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    position: 'absolute',
    top: 4,
    zIndex: 2,
    alignSelf: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radii.sm,
    backgroundColor: colors.accentTint,
  },
});
