import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, hitSlop } from '../theme';
import { Icon, type IconName } from './Icon';

interface Props {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  tone?: 'outline' | 'accent' | 'plain' | 'surface';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({ icon, onPress, accessibilityLabel, size = 40, tone = 'outline', disabled, style }: Props) {
  const color = tone === 'accent' ? colors.accent : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        tone === 'outline' && styles.outline,
        tone === 'accent' && styles.accent,
        tone === 'surface' && styles.surface,
        pressed && { opacity: 0.6 },
        disabled && { opacity: 0.35 },
        style,
      ]}
    >
      <Icon name={icon} size={size * 0.5} color={color} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  outline: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised },
  accent: { borderWidth: 1.5, borderColor: colors.accent, backgroundColor: colors.surfaceRaised },
  surface: { backgroundColor: colors.surface },
});
