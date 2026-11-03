import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { colors, hitSlop, radii, shadows, spacing } from '../../theme';
import { analysisCopy } from './analysisCopy';

interface Props {
  uri: string;
  analyzing: boolean;
  onCancel?: () => void;
  previewElapsedSec?: number;
  previewReduceMotion?: boolean;
}

const DOT = 8;
const CYCLE = 1000;

/** Web stand-in: same layout as native, using RN Animated because Reanimated crashes this webpack bundle. */
export function MealAnalysisLoading({ uri, analyzing, onCancel, previewElapsedSec, previewReduceMotion }: Props) {
  const systemReduceMotion = useReduceMotion();
  const reduceMotion = previewReduceMotion ?? systemReduceMotion;
  const startedAt = useRef<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(previewElapsedSec ?? 0);

  useEffect(() => {
    if (previewElapsedSec != null) {
      startedAt.current = null;
      setElapsedSec(previewElapsedSec);
      return;
    }
    if (!analyzing) {
      startedAt.current = null;
      setElapsedSec(0);
      return;
    }
    if (startedAt.current == null) startedAt.current = Date.now();
    const tick = () => {
      const next = (Date.now() - (startedAt.current ?? Date.now())) / 1000;
      setElapsedSec(prev => {
        const bucket = next >= 20 ? 20 : next >= 8 ? 8 : 0;
        const current = prev >= 20 ? 20 : prev >= 8 ? 8 : 0;
        return bucket === current ? prev : bucket;
      });
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [analyzing, previewElapsedSec]);

  const copy = analysisCopy(elapsedSec);

  useEffect(() => {
    if (!analyzing) return;
    AccessibilityInfo.announceForAccessibility(`Analysis in progress. ${copy.headline} ${copy.supporting}`);
  }, [analyzing, copy.headline, copy.supporting]);

  return (
    <View style={styles.wrap}>
      <View style={[styles.photoCard, analyzing && styles.photoActive, shadows.card]} accessibilityLabel="Your meal photo">
        <Image source={{ uri }} style={styles.photo} resizeMode="contain" accessibilityIgnoresInvertColors />
      </View>

      {analyzing ? (
        <View
          style={styles.status}
          accessibilityRole="summary"
          accessibilityLabel={`Analysis in progress. ${copy.headline} ${copy.supporting}`}
          accessibilityLiveRegion="polite"
        >
          <AppText variant="h2" align="center">
            {copy.headline}
          </AppText>
          {reduceMotion ? <StaticAnalyzing /> : <AnalysisDots />}
          <AppText variant="body" tone="secondary" align="center">
            {copy.supporting}
          </AppText>
          <View style={styles.cancelSlot}>
            {copy.showCancel && onCancel ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel analysis"
                hitSlop={hitSlop}
                onPress={onCancel}
                style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
                testID="cancel-analysis"
              >
                <AppText variant="captionStrong" tone="accent">
                  Cancel analysis
                </AppText>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function AnalysisDots() {
  return (
    <View style={styles.dots} accessible={false} testID="analysis-activity">
      <Dot index={0} />
      <Dot index={1} />
      <Dot index={2} />
    </View>
  );
}

function Dot({ index }: { index: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(progress, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
          Animated.timing(progress, { toValue: 0, duration: CYCLE - 380, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        ]),
      );
      loop.start();
    }, index * 160);
    return () => {
      clearTimeout(timeout);
      progress.stopAnimation();
    };
  }, [index, progress]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.28, 1] }),
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -3.5] }) }],
        },
      ]}
    />
  );
}

function StaticAnalyzing() {
  return (
    <View style={styles.staticRow} testID="analysis-activity">
      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotStatic]} />
        <View style={[styles.dot, styles.dotStatic]} />
        <View style={[styles.dot, styles.dotStatic]} />
      </View>
      <AppText variant="eyebrow" tone="accent">
        Analyzing
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.sm, gap: spacing.xl },
  photoCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoActive: {
    borderWidth: 2,
    borderColor: colors.lime,
  },
  photo: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.surface },
  status: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md },
  dots: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, height: 16 },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: colors.hero,
  },
  dotStatic: { opacity: 0.85 },
  staticRow: { alignItems: 'center', gap: spacing.sm },
  cancelSlot: { minHeight: 44, justifyContent: 'center' },
  cancel: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  pressed: { opacity: 0.7 },
});
