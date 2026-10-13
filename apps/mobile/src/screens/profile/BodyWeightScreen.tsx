import { convertWeight, isValidWeight, WEIGHT_LIMITS, type CalculatedProteinRange, type WeightUnit } from '@steady/domain';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, BackLink, Button, ConfirmSheet, Screen, SegmentedControl, showToast, TextField } from '../../components';
import { confirmRecalculatedRange, keepRangeAfterWeightChange, saveBodyWeight } from '../../features/profile/actions';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../state/appStore';
import { spacing } from '../../theme';
import { rangeLabel } from '../../utils/format';

const UNIT_OPTIONS = [
  { value: 'lb', label: 'lb' },
  { value: 'kg', label: 'kg' },
] as const;

export function BodyWeightScreen({ navigation }: RootScreenProps<'BodyWeight'>) {
  const profile = useAppStore(s => s.profile);
  const [unit, setUnit] = useState<WeightUnit>(profile?.weight_unit ?? 'lb');
  const [text, setText] = useState(profile?.weight_value ? String(profile.weight_value) : '');
  const [suggestion, setSuggestion] = useState<CalculatedProteinRange | null>(null);

  if (!profile) return null;
  const value = Number(text.replace(',', '.'));
  const valid = isValidWeight(value, unit);
  const unchanged = value === profile.weight_value && unit === profile.weight_unit;
  const current = { min: profile.protein_goal_min ?? 0, max: profile.protein_goal_max ?? 0 };

  const changeUnit = (next: WeightUnit) => {
    if (next === unit) return;
    if (valid) setText(String(convertWeight(value, unit, next)));
    setUnit(next);
  };

  const save = () => {
    const result = saveBodyWeight(Math.round(value * 10) / 10, unit);
    if (result?.shouldPromptRangeUpdate) {
      setSuggestion(result.suggestedRange);
      return;
    }
    showToast('Body weight updated');
    navigation.goBack();
  };

  const recalc = () => {
    confirmRecalculatedRange();
    setSuggestion(null);
    showToast(suggestion ? `Goal set to ${rangeLabel(suggestion)} per day` : 'Goal updated');
    navigation.goBack();
  };

  const keep = () => {
    keepRangeAfterWeightChange();
    setSuggestion(null);
    showToast(`Kept your ${rangeLabel(current)} range`);
    navigation.goBack();
  };

  return (
    <Screen keyboard footer={<Button label="Save" onPress={save} disabled={!valid || unchanged} />}>
      <BackLink label="Profile" onPress={navigation.goBack} />
      <AppText variant="title" accessibilityRole="header" style={styles.title}>
        Body weight
      </AppText>
      <AppText variant="body" tone="secondary" style={styles.sub}>
        Updating your weight won’t change your protein goal unless you choose to.
      </AppText>
      <View style={styles.form}>
        <TextField
          label="Body weight"
          value={text}
          onChangeText={t => setText(t.replace(/[^0-9.,]/g, ''))}
          keyboardType="decimal-pad"
          suffix={unit}
          size="large"
          error={text && !valid ? `Enter a weight between ${WEIGHT_LIMITS[unit].min} and ${WEIGHT_LIMITS[unit].max} ${unit}.` : null}
        />
        <SegmentedControl options={UNIT_OPTIONS} value={unit} onChange={changeUnit} accessibilityLabel="Weight unit" />
      </View>

      <ConfirmSheet
        visible={!!suggestion}
        title="Your weight changed."
        message={
          suggestion
            ? `Your new suggested protein range is ${rangeLabel(suggestion)}/day. Would you like to update your protein range? Your current range is ${rangeLabel(current)}.`
            : undefined
        }
        onDismiss={keep}
        actions={[
          { label: 'Recalculate', onPress: recalc },
          { label: 'Keep Current Range', onPress: keep, variant: 'ghost' },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm },
  sub: { marginTop: spacing.sm },
  form: { gap: spacing.lg, marginTop: spacing.xxl },
});
