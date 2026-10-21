import { validateProteinRange, type ProteinRange } from '@jota/domain';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { haptic } from '../services/haptics';
import { colors, radii, spacing, typography } from '../theme';
import { AppText } from './AppText';
import { IconButton } from './IconButton';

function GramField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const commit = (raw: string) => {
    const n = Number(raw);
    onChange(Number.isFinite(n) ? n : 0);
  };
  return (
    <View style={styles.field}>
      <AppText variant="bodyStrong" style={styles.label}>
        {label}
      </AppText>
      <IconButton
        icon="minus"
        size={36}
        accessibilityLabel={`Decrease ${label}`}
        onPress={() => {
          if (value <= 0) return;
          haptic('selection');
          onChange(Math.max(0, value - 5));
        }}
      />
      <View style={styles.inputWrap}>
        <TextInput
          value={text}
          onChangeText={t => {
            const digits = t.replace(/\D/g, '').slice(0, 3);
            setText(digits);
            commit(digits);
          }}
          keyboardType="number-pad"
          accessibilityLabel={`${label} grams per day`}
          style={styles.input}
          selectTextOnFocus
        />
        <AppText variant="body" tone="tertiary">
          g
        </AppText>
      </View>
      <IconButton
        icon="plus"
        size={36}
        accessibilityLabel={`Increase ${label}`}
        onPress={() => {
          haptic('selection');
          onChange(value + 5);
        }}
      />
    </View>
  );
}

interface Props {
  range: ProteinRange;
  onChange: (range: ProteinRange) => void;
}

/** Min/max editor with inline validation (both positive, min ≤ max). */
export function RangeEditor({ range, onChange }: Props) {
  const validation = validateProteinRange(range.min, range.max);
  return (
    <View style={styles.wrap}>
      <GramField label="Minimum" value={range.min} onChange={min => onChange({ ...range, min })} />
      <View style={styles.divider} />
      <GramField label="Maximum" value={range.max} onChange={max => onChange({ ...range, max })} />
      {!validation.ok ? (
        <AppText variant="caption" tone="destructive" style={styles.error} accessibilityLiveRegion="polite">
          {validation.message}
        </AppText>
      ) : (
        <AppText variant="caption" tone="tertiary" style={styles.error}>
          Your goal counts as reached once you hit the minimum.
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.md },
  field: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { flex: 1 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 76,
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  input: { ...typography.numberSmall, color: colors.text, paddingVertical: spacing.sm, minWidth: 36, textAlign: 'right' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong },
  error: { marginTop: spacing.xs },
});
