import React, { useEffect, useState } from 'react';
import { Easing, runOnJS, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { AppText, type AppTextProps } from './AppText';

interface Props extends Omit<AppTextProps, 'children'> {
  value: number;
  duration?: number;
}

/** Counts from the previous value to `value` over ~500ms. Jumps when Reduce Motion is on. */
export function CountUpText({ value, duration = 500, ...text }: Props) {
  const reduceMotion = useReduceMotion();
  const animated = useSharedValue(value);
  const [shown, setShown] = useState(Math.round(value));

  useEffect(() => {
    if (reduceMotion) {
      animated.value = value;
      setShown(Math.round(value));
      return;
    }
    animated.value = withTiming(value, { duration, easing: Easing.out(Easing.cubic) });
  }, [value, duration, reduceMotion, animated]);

  useAnimatedReaction(
    () => animated.value,
    current => {
      runOnJS(setShown)(Math.round(current));
    },
  );

  return <AppText {...text}>{shown}</AppText>;
}
