import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../theme';
import { AppText } from './AppText';
import { IconButton } from './IconButton';

interface Props {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  format?: (value: number) => string;
  label: string;
  size?: 'regular' | 'large';
}

export function Stepper({ value, onChange, step = 1, min = 0, max = 9999, format = String, label, size = 'regular' }: Props) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 100) / 100));
  return (
    <View style={styles.row} accessibilityLabel={label} accessibilityValue={{ text: format(value) }} accessibilityRole="adjustable"
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={e => onChange(clamp(value + (e.nativeEvent.actionName === 'increment' ? step : -step)))}
    >
      <IconButton icon="minus" accessibilityLabel={`Decrease ${label}`} onPress={() => onChange(clamp(value - step))} disabled={value <= min} size={size === 'large' ? 44 : 36} />
      <AppText variant={size === 'large' ? 'h2' : 'numberSmall'} style={styles.value}>
        {format(value)}
      </AppText>
      <IconButton icon="plus" accessibilityLabel={`Increase ${label}`} onPress={() => onChange(clamp(value + step))} disabled={value >= max} size={size === 'large' ? 44 : 36} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  value: { minWidth: 44, textAlign: 'center' },
});
