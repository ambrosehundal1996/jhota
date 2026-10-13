import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface Props {
  icon?: IconName;
  title: string;
  message?: string;
  children?: React.ReactNode;
}

/** Empty and error states always offer a next step via children (buttons or tiles). */
export function EmptyState({ icon, title, message, children }: Props) {
  return (
    <View style={styles.wrap} accessibilityRole="summary">
      {icon ? (
        <View style={styles.icon}>
          <Icon name={icon} size={24} color={colors.accentText} />
        </View>
      ) : null}
      <AppText variant="h3" align="center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="body" tone="secondary" align="center">
          {message}
        </AppText>
      ) : null}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  actions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.md },
});
