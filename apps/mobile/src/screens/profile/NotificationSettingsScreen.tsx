import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, StyleSheet } from 'react-native';
import { AppText, BackLink, Button, Card, ListGroup, ListRow, Screen, SectionLabel } from '../../components';
import { updateNotificationPrefs } from '../../features/profile/actions';
import type { RootScreenProps } from '../../navigation/types';
import { getPermissionStatus, requestPermission, type PermissionResult } from '../../services/notifications/reminders';
import { useAppStore } from '../../state/appStore';
import { spacing } from '../../theme';

export function NotificationSettingsScreen({ navigation }: RootScreenProps<'NotificationSettings'>) {
  const prefs = useAppStore(s => s.notificationPrefs);
  const [permission, setPermission] = useState<PermissionResult | null>(null);

  const refresh = useCallback(() => {
    getPermissionStatus().then(setPermission).catch(() => setPermission(null));
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', s => s === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);

  const enable = async () => {
    const result = await requestPermission();
    setPermission(result);
    updateNotificationPrefs({ enabled: result === 'granted', permission_status: result });
  };

  const disabled = !prefs.enabled || permission !== 'granted';

  return (
    <Screen>
      <BackLink label="Profile" onPress={navigation.goBack} />
      <AppText variant="title" accessibilityRole="header" style={styles.title}>
        Reminders
      </AppText>
      <AppText variant="body" tone="secondary" style={styles.sub}>
        Informative, never guilt. We stay quiet once you’ve logged something.
      </AppText>

      {permission === 'denied' ? (
        <Card style={styles.card}>
          <AppText variant="bodyStrong">Notifications are turned off</AppText>
          <AppText variant="caption" tone="secondary">
            Allow notifications for Steady in Settings to get reminders.
          </AppText>
          <Button label="Open Settings" size="medium" onPress={() => Linking.openSettings()} style={styles.cardButton} />
        </Card>
      ) : permission === 'not_determined' ? (
        <Card style={styles.card}>
          <AppText variant="bodyStrong">Turn on reminders</AppText>
          <AppText variant="caption" tone="secondary">
            One gentle nudge at 2 PM, only if nothing is logged yet.
          </AppText>
          <Button label="Allow notifications" size="medium" onPress={enable} style={styles.cardButton} />
        </Card>
      ) : null}

      <SectionLabel>Reminders</SectionLabel>
      <ListGroup>
        <ListRow title="Reminders" toggle={{ value: prefs.enabled, onChange: enabled => updateNotificationPrefs({ enabled }) }} />
        <ListRow
          title="Nothing logged by 2 PM"
          subtitle="“Nothing logged yet today.”"
          toggle={{ value: prefs.zero_log_2pm, onChange: v => updateNotificationPrefs({ zero_log_2pm: v }), disabled }}
        />
        <ListRow
          title="Nothing logged by 7 PM"
          subtitle="A last chance to set a quick total"
          toggle={{ value: prefs.zero_log_7pm, onChange: v => updateNotificationPrefs({ zero_log_7pm: v }), disabled }}
        />
        <ListRow
          title="Evening progress"
          subtitle="At 8 PM, if you’re still short of your goal"
          toggle={{ value: prefs.progress_reminder, onChange: v => updateNotificationPrefs({ progress_reminder: v }), disabled }}
          last
        />
      </ListGroup>
      <AppText variant="caption" tone="tertiary" style={styles.footnote}>
        Reminders use your phone’s local time. At most one per afternoon and one per evening.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm },
  sub: { marginTop: spacing.sm },
  card: { marginTop: spacing.xl, gap: spacing.xs },
  cardButton: { marginTop: spacing.md },
  footnote: { marginTop: spacing.md },
});
