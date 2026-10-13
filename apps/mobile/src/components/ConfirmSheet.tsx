import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '../theme';
import { AppText } from './AppText';
import { Button } from './Button';

export interface SheetAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'filled' | 'secondary' | 'ghost' | 'destructive';
}

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  children?: React.ReactNode;
  actions: SheetAction[];
  onDismiss: () => void;
}

/** Bottom confirmation sheet. Used wherever the spec requires explicit confirmation. */
export function ConfirmSheet({ visible, title, message, children, actions, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.scrim} onPress={onDismiss} accessibilityLabel="Dismiss" accessibilityRole="button" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]} accessibilityViewIsModal>
        <View style={styles.grabber} />
        <AppText variant="h2" accessibilityRole="header">
          {title}
        </AppText>
        {message ? (
          <AppText variant="body" tone="secondary" style={styles.message}>
            {message}
          </AppText>
        ) : null}
        {children}
        <View style={styles.actions}>
          {actions.map(action => (
            <Button key={action.label} label={action.label} onPress={action.onPress} variant={action.variant ?? 'primary'} />
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: colors.scrim },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, marginBottom: spacing.md },
  message: { marginTop: spacing.xs },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
});
