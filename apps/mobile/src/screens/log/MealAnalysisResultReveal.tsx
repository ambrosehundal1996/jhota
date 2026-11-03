import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { haptic } from '../../services/haptics';

interface Props {
  children: React.ReactNode;
  totalG: number;
  style?: StyleProp<ViewStyle>;
}

/** One-shot fade/scale when the review screen first appears with a finished estimate. */
export function MealAnalysisResultReveal({ children, totalG, style }: Props) {
  const reduceMotion = useReduceMotion();
  const announced = useRef(false);
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (announced.current) return;
    announced.current = true;
    haptic('success');
    AccessibilityInfo.announceForAccessibility(
      `Your protein estimate is ready. About ${Math.round(totalG)} grams. Review your meal and adjust if needed.`,
    );
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    progress.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
  }, [progress, reduceMotion, totalG]);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.97 + 0.03 * progress.value }],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
