import { convertWeight, isValidWeight, WEIGHT_LIMITS, type WeightUnit } from '@steady/domain';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Screen, SegmentedControl, StepHeader, TextField } from '../../components';
import { setOnboardingWeight } from '../../features/profile/actions';
import type { OnboardingScreenProps } from '../../navigation/types';
import { useAppStore } from '../../state/appStore';
import { spacing } from '../../theme';

const UNIT_OPTIONS = [
  { value: 'lb', label: 'lb' },
  { value: 'kg', label: 'kg' },
] as const;

export function parseWeight(text: string): number {
  return Number(text.replace(',', '.'));
}

export function WeightScreen({ navigation }: OnboardingScreenProps<'Weight'>) {
  const draft = useAppStore(s => s.onboarding);
  const [unit, setUnit] = useState<WeightUnit>(draft.weightUnit);
  const [text, setText] = useState(draft.weightValue ? String(draft.weightValue) : '');
  const [touched, setTouched] = useState(false);

  const value = parseWeight(text);
  const valid = isValidWeight(value, unit);
  const limits = WEIGHT_LIMITS[unit];

  const changeUnit = (next: WeightUnit) => {
    if (next === unit) return;
    if (Number.isFinite(value) && value > 0) setText(String(Math.round(convertWeight(value, unit, next))));
    setUnit(next);
  };

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    setOnboardingWeight(Math.round(value * 10) / 10, unit);
    navigation.navigate('Range');
  };

  return (
    <Screen keyboard footer={<Button label="Continue" disabled={!text} onPress={submit} />}>
      <StepHeader step={2} total={3} onBack={navigation.goBack} />
      <AppText variant="title" accessibilityRole="header">
        What do you weigh?
      </AppText>
      <AppText variant="body" tone="secondary" style={styles.sub}>
        We use this only to suggest a daily protein range.
      </AppText>
      <View style={styles.form}>
        <TextField
          label="Body weight"
          value={text}
          onChangeText={t => setText(t.replace(/[^0-9.,]/g, ''))}
          keyboardType="decimal-pad"
          placeholder={unit === 'lb' ? '175' : '80'}
          suffix={unit}
          size="large"
          autoFocus
          returnKeyType="done"
          onSubmitEditing={submit}
          error={touched && !valid ? `Enter a weight between ${limits.min} and ${limits.max} ${unit}.` : null}
          testID="weight-input"
        />
        <SegmentedControl options={UNIT_OPTIONS} value={unit} onChange={changeUnit} accessibilityLabel="Weight unit" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: spacing.sm },
  form: { gap: spacing.lg, marginTop: spacing.xxl },
});
