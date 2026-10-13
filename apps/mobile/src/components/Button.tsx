import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radii, shadows, spacing } from '../theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'filled' | 'secondary' | 'ghost' | 'destructive';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  size?: 'large' | 'medium' | 'small';
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
}

/** Outlined green pill is the primary CTA style used across the mockups. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  size = 'large',
  style,
  accessibilityHint,
  testID,
}: Props) {
  const height = size === 'large' ? 56 : size === 'medium' ? 48 : 38;
  const textColor =
    variant === 'filled'
      ? colors.textOnAccent
      : variant === 'secondary'
        ? colors.text
        : variant === 'destructive'
          ? colors.destructive
          : colors.accentText;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { height, paddingHorizontal: size === 'small' ? spacing.md : spacing.xl },
        variant === 'primary' && [styles.primary, shadows.button],
        variant === 'filled' && styles.filled,
        variant === 'secondary' && styles.secondary,
        variant === 'destructive' && styles.secondary,
        pressed && styles.pressed,
        pressed && variant === 'filled' && { backgroundColor: colors.accentPressed },
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={size === 'small' ? 16 : 18} color={textColor} strokeWidth={2} /> : null}
          <AppText variant={size === 'small' ? 'captionStrong' : 'bodyStrong'} style={{ color: textColor }}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  primary: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  filled: { backgroundColor: colors.accent },
  secondary: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.4 },
});
