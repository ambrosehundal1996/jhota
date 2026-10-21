import { calculateProteinRange, validateProteinRange, type ProteinRange } from '@jota/domain';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { analytics } from '../../analytics';
import { AppText, Button, Card, Screen, StepHeader } from '../../components';
import { RangeEditor } from '../../components/RangeEditor';
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
  const [customizing, setCustomizing] = useState(false);
  const [custom, setCustom] = useState<ProteinRange>(() => suggested ?? { min: 120, max: 160 });
  const setPending = usePendingRange(s => s.set);

  useEffect(() => {
    if (suggested) analytics.track('protein_range_suggested', { min: suggested.min, max: suggested.max, unit: draft.weightUnit });
    else navigation.goBack();
  }, [suggested, draft.weightUnit, navigation]);

  if (!suggested) return null;

  const shown = customizing ? custom : suggested;
  const valid = validateProteinRange(shown.min, shown.max).ok;
  const isCustom = customizing && (custom.min !== suggested.min || custom.max !== suggested.max);

  const accept = () => {
    if (!valid) return;
    setPending({ range: { min: shown.min, max: shown.max }, isCustom });
    navigation.navigate('Ready');
  };

  return (
    <Screen keyboard footer={<Button label="Use this range" onPress={accept} disabled={!valid} testID="use-range" />}>
      <StepHeader step={3} total={3} onBack={navigation.goBack} />
      <AppText variant="title" accessibilityRole="header">
        Your suggested protein range
      </AppText>

      <Card tone="mint" style={styles.card}>
        <AppText variant="eyebrow" tone="accent">
          {isCustom ? 'Your custom range' : 'Your suggested range'}
        </AppText>
        <View style={styles.numberRow} accessibilityLabel={`${shown.min} to ${shown.max} grams per day`}>
          <AppText variant="display" style={styles.number}>
            {shown.min}–{shown.max}
          </AppText>
          <AppText variant="h2" tone="secondary">
            g
          </AppText>
        </View>
        <AppText variant="body" tone="secondary" align="center">
          protein per day
        </AppText>
        <AppText variant="caption" tone="secondary" align="center" style={styles.based}>
          Based on your body weight. You can adjust this anytime.
        </AppText>
      </Card>

      {customizing ? (
        <View style={styles.editor}>
          <RangeEditor range={custom} onChange={setCustom} />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setCustom(suggested);
              setCustomizing(false);
            }}
            style={styles.link}
          >
            <AppText variant="bodyStrong" tone="accent" align="center">
              Use the suggested range
            </AppText>
          </Pressable>
        </View>
      ) : (
        <>
          <AppText variant="caption" tone="tertiary" style={styles.note}>
            Most active people aim for 0.7–1 g of protein per lb of body weight each day. Reaching the lower number counts as hitting your goal.
          </AppText>
          <Pressable accessibilityRole="button" onPress={() => setCustomizing(true)} style={styles.link} testID="customize-range">
            <AppText variant="bodyStrong" tone="accent" align="center">
              Customize
            </AppText>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.xxl, alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.xs },
  numberRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: spacing.sm },
  number: { fontSize: 58, lineHeight: 64 },
  based: { marginTop: spacing.md },
  note: { marginTop: spacing.lg, paddingHorizontal: spacing.xs },
  editor: { marginTop: spacing.lg, gap: spacing.sm },
  link: { paddingVertical: spacing.md },
});
