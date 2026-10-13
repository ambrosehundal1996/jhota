import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../theme';
import { AppText } from './AppText';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: readonly Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  size?: 'regular' | 'compact';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function SegmentedControl<T extends string>({ options, value, onChange, size = 'regular', style, accessibilityLabel }: Props<T>) {
  return (
    <View style={[styles.container, style]} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map(option => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={[styles.segment, size === 'compact' && styles.compact, selected && styles.selected]}
          >
            <AppText variant={selected ? 'captionStrong' : 'caption'} tone={selected ? 'accent' : 'secondary'}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
  },
  compact: { minHeight: 32, paddingHorizontal: spacing.md, flex: 0 },
  selected: { backgroundColor: colors.accentTint, borderWidth: 1, borderColor: colors.accentBorder },
});
