import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, ConfirmSheet, Keypad, Screen, SheetHeader, showToast } from '../../components';
import { removeDailyOverride, setDailyOverride } from '../../features/logging/actions';
import { useDay } from '../../hooks/useAppData';
import type { LogScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { formatShortDay } from '../../utils/format';
import { closeLog, useLogContext } from './useLogContext';

export function SetTotalScreen({ navigation, route }: LogScreenProps<'SetTotal'>) {
  const { date, isToday } = useLogContext(route.params);
  const day = useDay(date);
  const [value, setValue] = useState(day.override ? String(Math.round(day.override.protein_total_g)) : '');
  const [confirming, setConfirming] = useState(false);
  const grams = Number(value);
  const valid = value !== '' && grams >= 0 && grams <= 1000;
  const logged = Math.round(day.total.loggedTotal);
  const dayLabel = isToday ? 'today' : formatShortDay(date);

  const commit = () => {
    const previous = day.override?.protein_total_g;
    setDailyOverride(date, grams);
    setConfirming(false);
    showToast(`${isToday ? 'Today’s' : `${formatShortDay(date)}’s`} total set to ${grams}g`, {
      label: 'Undo',
      onPress: () => (previous === undefined ? removeDailyOverride(date) : setDailyOverride(date, previous)),
    });
    closeLog(navigation);
  };

  const save = () => {
    if (!valid) return;
    if (day.logs.length > 0 && !day.override) setConfirming(true);
    else commit();
  };

  return (
    <Screen
      scroll={false}
      footer={<Button label={isToday ? 'Set today’s total' : `Set ${dayLabel} total`} variant="filled" disabled={!valid} onPress={save} testID="set-total-submit" />}
    >
      <SheetHeader title={isToday ? 'Set today’s total' : `Set total · ${dayLabel}`} onClose={() => closeLog(navigation)} />
      <AppText variant="body" tone="secondary" align="center" style={styles.sub}>
        Lost track? Enter your best estimate for the whole day. It replaces the calculated total.
      </AppText>
      <View style={styles.display} accessibilityLabel={`${value || 0} grams total`}>
        <AppText variant="display" style={[styles.amount, !value && styles.placeholder]}>
          {value || '0'}
        </AppText>
        <AppText variant="h2" tone="secondary">
          g total
        </AppText>
      </View>
      {day.logs.length > 0 ? (
        <AppText variant="caption" tone="tertiary" align="center">
          Logged entries {dayLabel}: {logged}g
        </AppText>
      ) : null}
      <View style={styles.keypad}>
        <Keypad value={value} onChange={setValue} maxDigits={4} />
      </View>

      <ConfirmSheet
        visible={confirming}
        title={`Set ${dayLabel}’s total?`}
        message={`You currently have ${logged}g logged from individual entries. Setting ${isToday ? 'today’s' : 'this day’s'} total to ${grams}g will override the calculated total for this day.`}
        onDismiss={() => setConfirming(false)}
        actions={[
          { label: `Set total to ${grams}g`, onPress: commit, variant: 'filled' },
          { label: 'Cancel', onPress: () => setConfirming(false), variant: 'ghost' },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: spacing.sm, paddingHorizontal: spacing.lg },
  display: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xxl },
  amount: { fontSize: 72, lineHeight: 80 },
  placeholder: { color: colors.textTertiary },
  keypad: { flex: 1, justifyContent: 'flex-end', paddingBottom: spacing.sm },
});
