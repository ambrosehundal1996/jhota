import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, typography, type TypographyVariant } from '../theme';

type Tone = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'onAccent' | 'destructive';

const toneColor: Record<Tone, string> = {
  primary: colors.text,
  secondary: colors.textSecondary,
  tertiary: colors.textTertiary,
  accent: colors.accentText,
  onAccent: colors.textOnAccent,
  destructive: colors.destructive,
};

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  tone?: Tone;
  align?: TextStyle['textAlign'];
}

export function AppText({ variant = 'body', tone = 'primary', align, style, ...rest }: AppTextProps) {
  return (
    <Text
      maxFontSizeMultiplier={1.4}
      {...rest}
      style={[typography[variant], { color: toneColor[tone] }, align ? { textAlign: align } : null, style]}
    />
  );
}
