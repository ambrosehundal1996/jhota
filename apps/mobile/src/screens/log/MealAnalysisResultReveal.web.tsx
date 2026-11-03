import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { haptic } from '../../services/haptics';

interface Props {
  children: React.ReactNode;
  totalG: number;
  style?: StyleProp<ViewStyle>;
}

/** Web stand-in for the native Reanimated reveal. */
export function MealAnalysisResultReveal({ children, totalG, style }: Props) {
  const reduceMotion = useReduceMotion();
  const announced = useRef(false);
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (announced.current) return;
    announced.current = true;
    haptic('success');
    AccessibilityInfo.announceForAccessibility(
      `Your protein estimate is ready. About ${Math.round(totalG)} grams. Review your meal and adjust if needed.`,
    );
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    Animated.timing(progress, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [progress, reduceMotion, totalG]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
