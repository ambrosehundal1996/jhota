import React from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { colors, spacing } from '../theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

interface Props {
  title: string;
  subtitle?: string;
  value?: string;
  valueTone?: 'accent' | 'secondary';
  onPress?: () => void;
  chevron?: boolean;
  toggle?: { value: boolean; onChange: (value: boolean) => void; disabled?: boolean };
  right?: React.ReactNode;
  last?: boolean;
  destructive?: boolean;
}

export function ListRow({ title, subtitle, value, valueTone = 'secondary', onPress, chevron = !!onPress, toggle, right, last, destructive }: Props) {
  const content = (
    <View style={[styles.row, !last && styles.divider]}>
      <View style={styles.text}>
        <AppText variant="body" tone={destructive ? 'destructive' : 'primary'}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="tertiary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant={valueTone === 'accent' ? 'bodyStrong' : 'body'} tone={valueTone}>
          {value}
        </AppText>
      ) : null}
      {right}
      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onChange}
          disabled={toggle.disabled}
          trackColor={{ true: colors.accent, false: colors.track }}
          accessibilityLabel={title}
        />
      ) : null}
      {chevron ? <Icon name="chevronRight" size={16} color={colors.textTertiary} /> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={value ? `${title}, ${value}` : title} onPress={onPress} style={({ pressed }) => pressed && { backgroundColor: colors.surfacePressed }}>
      {content}
    </Pressable>
  );
}

export function ListGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

const styles = StyleSheet.create({
  group: { backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong },
  text: { flex: 1, gap: 2 },
});
