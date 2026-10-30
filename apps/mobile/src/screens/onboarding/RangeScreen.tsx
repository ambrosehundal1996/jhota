import { calculateProteinRange, validateProteinRange, type ProteinRange } from '@jota/domain';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { analytics } from '../../analytics';
import { AppText, Button, Card, Screen, StepHeader } from '../../components';
import { RangeEditor } from '../../components/RangeEditor';
import { RangeSlider } from '../../components/RangeSlider';
import type { OnboardingScreenProps } from '../../navigation/types';
import { useAppStore } from '../../state/appStore';
import { spacing } from '../../theme';
import { usePendingRange } from './pendingRange';

export function RangeScreen({ navigation }: OnboardingScreenProps<'Range'>) {
  const draft = useAppStore(s => s.onboarding);
  const suggested = useMemo(
    () => (draft.weightValue ? calculateProteinRange(draft.weightValue, draft.weightUnit) : null),
    [draft.weightValue, draft.weightUnit],
  );
  const [range, setRange] = useState<ProteinRange>(() => suggested ?? { min: 120, max: 160 });
  const [customizing, setCustomizing] = useState(false);
  const setPending = usePendingRange(s => s.set);

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

  const accept = () => {
    if (!valid) return;
    setPending({ range: { min: range.min, max: range.max }, isCustom });
    navigation.navigate('Ready');
  };

  return (
    <Screen
      keyboard
      footer={
        <>
          <Button label="Use this range" onPress={accept} disabled={!valid} testID="use-range" />
          <Button
            label={customizing ? 'Hide custom values' : 'Customize range'}
            variant="ghost"
            onPress={() => setCustomizing(v => !v)}
            testID="customize-range"
          />
        </>
      }
    >
      <StepHeader step={4} total={4} onBack={navigation.goBack} />
      <AppText variant="eyebrow" tone="accent" style={styles.eyebrow}>
        Your protein goal
      </AppText>
      <AppText variant="title" accessibilityRole="header">
        Your suggested protein range
      </AppText>

      <Card tone="mint" style={styles.card}>
        <AppText variant="eyebrow" tone="accent">
          {isCustom ? 'Your custom range' : 'Your suggested range'}
        </AppText>
        <View style={styles.numberRow} accessibilityLabel={`${range.min} to ${range.max} grams per day`}>
          <AppText variant="display" style={styles.number}>
            {range.min}–{range.max}
          </AppText>
          <AppText variant="h2" tone="secondary">
            g
          </AppText>
        </View>
        <AppText variant="body" tone="secondary" align="center">
          protein per day
        </AppText>
        <RangeSlider range={range} suggested={suggested} onChange={setRange} />
      </Card>

      <AppText variant="body" tone="secondary" style={styles.aim}>
        Aim to reach anywhere in this range each day.
      </AppText>
      <AppText variant="caption" tone="secondary" style={styles.based}>
        Based on your body weight (0.7–1.0g per pound). Reaching the lower end counts as hitting your goal, and going
        above the range is okay.
      </AppText>

      {customizing ? (
        <View style={styles.editor}>
          <RangeEditor range={range} onChange={setRange} />
          {isCustom ? (
            <Button
              label="Reset to suggested"
              variant="ghost"
              size="small"
              onPress={() => setRange(suggested)}
            />
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { marginTop: spacing.md, marginBottom: spacing.xs },
  card: { marginTop: spacing.xxl, alignItems: 'center', alignSelf: 'stretch', paddingVertical: spacing.xxl, gap: spacing.xs },
  numberRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: spacing.sm },
  number: { fontSize: 58, lineHeight: 64 },
  aim: { marginTop: spacing.lg },
  based: { marginTop: spacing.sm },
  editor: { marginTop: spacing.lg, gap: spacing.sm },
});
