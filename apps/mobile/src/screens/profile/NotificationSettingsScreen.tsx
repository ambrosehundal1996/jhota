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
        Informative, never guilt. We stay quiet once you’ve hit your goal.
      </AppText>

      {permission === 'denied' ? (
        <Card style={styles.card}>
          <AppText variant="bodyStrong">Notifications are turned off</AppText>
          <AppText variant="caption" tone="secondary">
            Allow notifications for Jota in Settings to get reminders.
          </AppText>
          <Button label="Open Settings" size="medium" onPress={() => Linking.openSettings()} style={styles.cardButton} />
        </Card>
      ) : permission === 'not_determined' ? (
        <Card style={styles.card}>
          <AppText variant="bodyStrong">Turn on reminders</AppText>
          <AppText variant="caption" tone="secondary">
            A morning nudge, a 2 PM check-in if nothing is logged, and how much protein you have left later in the day.
          </AppText>
          <Button label="Allow notifications" size="medium" onPress={enable} style={styles.cardButton} />
        </Card>
      ) : null}

      <SectionLabel>Reminders</SectionLabel>
      <ListGroup>
        <ListRow title="Reminders" toggle={{ value: prefs.enabled, onChange: enabled => updateNotificationPrefs({ enabled }) }} />
        <ListRow
          title="Morning at 9 AM"
          subtitle="Today’s goal, if you haven’t logged yet"
          toggle={{ value: prefs.morning_9am !== false, onChange: v => updateNotificationPrefs({ morning_9am: v }), disabled }}
        />
        <ListRow
          title="Nothing logged by 2 PM"
          subtitle="“Takes about 5 seconds to log.”"
          toggle={{ value: prefs.zero_log_2pm, onChange: v => updateNotificationPrefs({ zero_log_2pm: v }), disabled }}
        />
        <ListRow
          title="Protein left at 4 PM"
          subtitle="How many grams you still have to eat"
          toggle={{ value: prefs.remaining_4pm !== false, onChange: v => updateNotificationPrefs({ remaining_4pm: v }), disabled }}
        />
        <ListRow
          title="Protein left at 7 PM"
          subtitle="How many grams you still have to eat"
          toggle={{ value: prefs.remaining_7pm !== false, onChange: v => updateNotificationPrefs({ remaining_7pm: v }), disabled }}
        />
        <ListRow
          title="Nothing logged by 8 PM"
          subtitle="Set the day’s total in one step"
          toggle={{ value: prefs.zero_log_8pm !== false, onChange: v => updateNotificationPrefs({ zero_log_8pm: v }), disabled }}
        />
        <ListRow
          title="Evening progress"
          subtitle="At 8 PM, if you’re still short of your goal"
          toggle={{ value: prefs.progress_reminder, onChange: v => updateNotificationPrefs({ progress_reminder: v }), disabled }}
          last
        />
      </ListGroup>
      <AppText variant="caption" tone="tertiary" style={styles.footnote}>
        Reminders use your phone’s local time. Protein-left reminders are skipped once you’ve hit your goal.
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
