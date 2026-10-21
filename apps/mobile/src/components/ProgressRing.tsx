import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { colors } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  /** 0–1 */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
  accessibilityLabel?: string;
  duration?: number;
  /** Bumps once when this value changes. */
  pulseKey?: string | number | boolean | null;
}

export function ProgressRing({
  progress,
  size = 220,
  strokeWidth = 18,
  color = colors.accent,
  trackColor = colors.track,
  children,
  accessibilityLabel,
  duration = 500,
  pulseKey = null,
}: Props) {
  const reduceMotion = useReduceMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animated = useSharedValue(Math.min(1, Math.max(0, progress)));
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  useEffect(() => {
    const next = Math.min(1, Math.max(0, progress));
    if (reduceMotion) {
      animated.value = next;
      return;
    }
    animated.value = withTiming(next, { duration, easing: Easing.out(Easing.cubic) });
  }, [progress, duration, reduceMotion, animated]);

  useEffect(() => {
    if (pulseKey === null || pulseKey === false || reduceMotion) return;
    const start = setTimeout(() => {
      scale.value = withSequence(
        withTiming(1.04, { duration: 280, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 320, easing: Easing.inOut(Easing.cubic) }),
      );
      glow.value = withSequence(
        withTiming(0.45, { duration: 220, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }),
      );
    }, 420);
    return () => clearTimeout(start);
  }, [pulseKey, reduceMotion, scale, glow]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animated.value),
  }));
  const glowProps = useAnimatedProps(() => ({
    opacity: glow.value,
    strokeWidth: strokeWidth + 10,
  }));
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[{ width: size, height: size }, pulseStyle]}
      accessible={!!accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          animatedProps={glowProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
