import { calculateProteinRange, validateProteinRange, type ProteinRange } from '@jota/domain';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { analytics } from '../../analytics';
import { AppText, Button, Card, Icon, RangeIntervalBar, Screen, StepHeader } from '../../components';
import { RangeEditor } from '../../components/RangeEditor';
import { RangeSlider } from '../../components/RangeSlider';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import type { OnboardingScreenProps } from '../../navigation/types';
import { useAppStore } from '../../state/appStore';
import { colors, hitSlop, radii, spacing } from '../../theme';
import { usePendingRange } from './pendingRange';

export function RangeScreen({ navigation }: OnboardingScreenProps<'Range'>) {
  const draft = useAppStore(s => s.onboarding);
  const suggested = useMemo(
    () => (draft.weightValue ? calculateProteinRange(draft.weightValue, draft.weightUnit) : null),
    [draft.weightValue, draft.weightUnit],
  );
  const [range, setRange] = useState<ProteinRange>(() => suggested ?? { min: 120, max: 160 });
  const [customizing, setCustomizing] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const setPending = usePendingRange(s => s.set);
  const reduceMotion = useReduceMotion();
  const compact = useWindowDimensions().height < 720;
  const enter = reduceMotion ? undefined : FadeIn.duration(200);
  const exit = reduceMotion ? undefined : FadeOut.duration(160);

  useEffect(() => {
    if (!suggested) {
      navigation.goBack();
      return;
    }
    setRange(suggested);
    analytics.track('protein_range_suggested', { min: suggested.min, max: suggested.max, unit: draft.weightUnit });
  }, [suggested, draft.weightUnit, navigation]);

  if (!suggested) return null;

  const valid = validateProteinRange(range.min, range.max).ok;
  const isCustom = range.min !== suggested.min || range.max !== suggested.max;
  const spokenRange = `${Math.round(range.min)} to ${Math.round(range.max)} grams of protein per day`;

  const accept = () => {
    if (!valid) return;
    setPending({ range: { min: range.min, max: range.max }, isCustom });
    navigation.navigate('Ready');
  };

  return (
    <Screen keyboard footer={<Button label="Use this range" onPress={accept} disabled={!valid} testID="use-range" />}>
      <StepHeader step={4} total={4} onBack={navigation.goBack} />

      <AppText
        accessibilityRole="header"
        accessibilityLabel="Your goal is a range. Not a rigid number."
        maxFontSizeMultiplier={1.15}
        style={[styles.headline, compact && styles.headlineCompact]}
      >
        {'YOUR GOAL IS A RANGE.\nNOT A RIGID NUMBER.'}
      </AppText>
      <AppText variant="body" tone="secondary" style={styles.support}>
        You don’t need to hit the exact same number every day. Focus on consistency, not perfection.
      </AppText>

      <Card tone="raised" style={styles.card}>
        <AppText variant="eyebrow" tone="tertiary">
          {isCustom ? 'Your custom range' : 'Your daily range'}
        </AppText>
        <View style={styles.numberBlock} accessible accessibilityLabel={spokenRange} testID="range-display">
          <AppText
            maxFontSizeMultiplier={1.2}
            style={[styles.rangeNumber, compact && styles.rangeNumberCompact]}
          >
            {Math.round(range.min)}–{Math.round(range.max)}
          </AppText>
          <AppText variant="h3" tone="secondary" style={styles.unit}>
            g / day
          </AppText>
        </View>
        <RangeIntervalBar range={range} suggested={suggested} />
      </Card>

      <View style={styles.principle} accessibilityLiveRegion="polite">
        <View style={styles.principleRule} />
        <AppText variant="eyebrow" tone="accent">
          Consistency over perfection.
        </AppText>
        <AppText variant="caption" tone="secondary" style={styles.principleBody}>
          Any amount within your range counts as reaching your goal.
        </AppText>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Why a range?"
        accessibilityState={{ expanded: whyOpen }}
        accessibilityHint="Explains why Jota uses a protein range instead of a single number"
        hitSlop={hitSlop}
        onPress={() => setWhyOpen(v => !v)}
        style={({ pressed }) => [styles.whyBtn, pressed && styles.pressed]}
        testID="why-a-range"
      >
        <Icon name="info" size={16} color={colors.accentText} strokeWidth={1.8} />
        <AppText variant="bodyStrong" tone="accent">
          Why a range?
        </AppText>
      </Pressable>
      {whyOpen ? (
        <Animated.View entering={enter} exiting={exit} style={styles.whyBody}>
          <AppText variant="body" tone="secondary">
            Your protein needs aren’t one exact number. A range gives you flexibility while helping you work toward your
            nutrition goals.
          </AppText>
          <AppText variant="caption" tone="tertiary" style={styles.whyFine}>
            This is a general fitness estimate. Individual needs can vary, and you can adjust your range anytime.
          </AppText>
        </Animated.View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: customizing }}
        onPress={() => setCustomizing(v => !v)}
        style={({ pressed }) => [styles.customize, pressed && styles.pressed]}
        testID="customize-range"
      >
        <AppText variant="bodyStrong" tone="accent" align="center">
          {customizing ? 'Hide custom values' : 'Customize range'}
        </AppText>
      </Pressable>
      {customizing ? (
        <Animated.View entering={enter} exiting={exit} style={styles.editor}>
          <RangeSlider range={range} suggested={suggested} onChange={setRange} />
          <RangeEditor range={range} onChange={setRange} />
          {isCustom ? (
            <Button label="Reset to suggested" variant="ghost" size="small" onPress={() => setRange(suggested)} />
          ) : null}
        </Animated.View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headline: {
    marginTop: spacing.md,
    color: colors.hero,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: 0.35,
  },
  headlineCompact: { fontSize: 26, lineHeight: 30 },
  support: { marginTop: spacing.md, maxWidth: 340 },
  card: {
    marginTop: spacing.xxl,
    alignItems: 'stretch',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
  },
  numberBlock: { alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.md },
  rangeNumber: {
    color: colors.hero,
    fontSize: 52,
    lineHeight: 56,
    fontWeight: '700',
    letterSpacing: -1.4,
    fontVariant: ['tabular-nums'],
  },
  rangeNumberCompact: { fontSize: 44, lineHeight: 48 },
  unit: { marginTop: spacing.xs },
  principle: {
    marginTop: spacing.xl,
    backgroundColor: colors.accentTint,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  principleRule: {
    width: 28,
    height: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.lime,
    marginBottom: spacing.sm,
  },
  principleBody: { marginTop: spacing.xs },
  whyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  whyBody: { gap: spacing.sm, paddingBottom: spacing.sm },
  whyFine: { marginTop: spacing.xs },
  customize: { paddingVertical: spacing.md, minHeight: 44, justifyContent: 'center' },
  editor: { gap: spacing.sm, paddingBottom: spacing.md },
  pressed: { opacity: 0.7 },
});
