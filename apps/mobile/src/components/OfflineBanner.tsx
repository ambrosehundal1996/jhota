import { useNetInfo } from '@react-native-community/netinfo';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

/** Calm notice; logging keeps working offline and syncs later. */
export function OfflineBanner({ message = 'You’re offline. Entries are saved and will sync later.' }: { message?: string }) {
  const net = useNetInfo();
  const offline = net.isConnected === false || net.isInternetReachable === false;
  if (!offline) return null;
  return (
    <View style={styles.banner} accessibilityLiveRegion="polite" accessibilityRole="alert">
      <Icon name="cloudOff" size={16} color={colors.textSecondary} />
      <AppText variant="caption" tone="secondary" style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

export function useIsOffline(): boolean {
  const net = useNetInfo();
  return net.isConnected === false || net.isInternetReachable === false;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  text: { flex: 1 },
});
