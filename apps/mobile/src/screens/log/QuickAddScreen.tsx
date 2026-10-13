import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { AppText, Button, Keypad, MealSelector, Screen, SheetHeader, showToast } from '../../components';
import { quickAdd, undoLogs } from '../../features/logging/actions';
import type { LogScreenProps } from '../../navigation/types';
import { colors, radii, spacing, typography } from '../../theme';
import { formatShortDay } from '../../utils/format';
import { closeLog, useLogContext } from './useLogContext';

export function QuickAddScreen({ navigation, route }: LogScreenProps<'QuickAdd'>) {
  const { date, isToday, meal, setMeal } = useLogContext(route.params);
  const [value, setValue] = useState('');
  const [name, setName] = useState('');
  const grams = Number(value);
  const valid = grams > 0 && grams <= 500;

  const add = () => {
    if (!valid) return;
    const log = quickAdd({ grams, name, meal, date });
    showToast(`Added ${grams}g${isToday ? '' : ` to ${formatShortDay(date)}`}`, { label: 'Undo', onPress: () => undoLogs([log.id]) });
    closeLog(navigation);
  };

  return (
    <Screen
      scroll={false}
      footer={<Button label={valid ? `Add ${grams}g` : 'Add protein'} variant="filled" disabled={!valid} onPress={add} testID="quick-add-submit" />}
    >
      <SheetHeader title={isToday ? 'Quick add' : `Quick add · ${formatShortDay(date)}`} onClose={() => closeLog(navigation)} />
      <View style={styles.display} accessibilityLabel={`${value || 0} grams`} accessibilityLiveRegion="polite">
        <AppText variant="display" style={[styles.amount, !value && styles.placeholder]}>
          {value || '0'}
        </AppText>
        <AppText variant="h2" tone="secondary">
          g protein
        </AppText>
      </View>
      {grams > 500 ? (
        <AppText variant="caption" tone="destructive" align="center">
          That’s more than 500g in one entry. Double-check the number.
        </AppText>
      ) : null}
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Add a name (optional)"
        placeholderTextColor={colors.textTertiary}
        style={styles.name}
        maxLength={60}
        returnKeyType="done"
        accessibilityLabel="Entry name, optional"
      />
      <View style={styles.meal}>
        <MealSelector value={meal} onChange={setMeal} />
      </View>
      <View style={styles.keypad}>
        <Keypad value={value} onChange={setValue} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  display: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xl },
  amount: { fontSize: 72, lineHeight: 80 },
  placeholder: { color: colors.textTertiary },
  name: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
  },
  meal: { marginTop: spacing.md },
  keypad: { flex: 1, justifyContent: 'flex-end', paddingBottom: spacing.sm },
});
