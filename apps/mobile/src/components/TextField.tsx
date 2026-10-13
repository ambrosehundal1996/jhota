import React, { forwardRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { AppText } from './AppText';

interface Props extends TextInputProps {
  label?: string;
  suffix?: string;
  error?: string | null;
  size?: 'regular' | 'large';
}

export type TextFieldRef = React.ComponentRef<typeof TextInput>;

export const TextField = forwardRef<TextFieldRef, Props>(function TextFieldInner({ label, suffix, error, size = 'regular', style, ...rest }, ref) {
  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText variant="caption" tone="secondary">
          {label}
        </AppText>
      ) : null}
      <View style={[styles.field, size === 'large' && styles.fieldLarge, !!error && styles.fieldError]}>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textTertiary}
          accessibilityLabel={label}
          style={[size === 'large' ? styles.inputLarge : styles.input, style]}
          {...rest}
        />
        {suffix ? (
          <AppText variant="body" tone="tertiary">
            {suffix}
          </AppText>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" tone="destructive" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldLarge: { minHeight: 64 },
  fieldError: { borderColor: colors.destructive },
  input: { flex: 1, ...typography.body, color: colors.text, paddingVertical: spacing.md },
  inputLarge: { flex: 1, ...typography.h2, color: colors.text, paddingVertical: spacing.md },
});
