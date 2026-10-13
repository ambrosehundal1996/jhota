import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../theme';

interface Props extends ViewProps {
  tone?: 'surface' | 'mint' | 'raised';
  padded?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Card({ tone = 'surface', padded = true, onPress, style, children, accessibilityLabel, ...rest }: Props) {
  const content = [
    styles.base,
    tone === 'mint' && styles.mint,
    tone === 'raised' && styles.raised,
    padded && styles.padded,
    style,
  ];
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [content, pressed && { opacity: 0.85 }]}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View style={content} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.surface, borderRadius: radii.lg },
  mint: { backgroundColor: colors.accentTint, borderWidth: 1, borderColor: colors.accentTintStrong },
  raised: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  padded: { padding: spacing.lg },
});
