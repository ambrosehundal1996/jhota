import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { analytics } from '../../analytics';
import { AppText, Button, Card, Icon } from '../../components';
import { updateNotificationPrefs } from '../../features/profile/actions';
import { getPermissionStatus, requestPermission } from '../../services/notifications/reminders';
import { setState, useAppStore } from '../../state/appStore';
import { colors, spacing } from '../../theme';

/**
 * Soft, contextual pre-prompt shown after the first log instead of asking for permission
 * at launch. Dismissal is remembered; the system prompt only appears after "Turn on".
 */
export function NotificationPromptCard({ hasLogged }: { hasLogged: boolean }) {
  const shown = useAppStore(s => s.flags.notificationPromptShown);
  const [undetermined, setUndetermined] = useState(false);

  useEffect(() => {
    if (shown || !hasLogged) return;
    getPermissionStatus()
      .then(status => setUndetermined(status === 'not_determined'))
      .catch(() => setUndetermined(false));
  }, [shown, hasLogged]);

  useEffect(() => {
    if (!shown && hasLogged && undetermined) analytics.track('notification_prompt_shown', { context: 'today_card' });
  }, [shown, hasLogged, undetermined]);

  if (shown || !hasLogged || !undetermined) return null;

  const close = () => setState(s => ({ flags: { ...s.flags, notificationPromptShown: true } }));

  const turnOn = async () => {
    const result = await requestPermission();
    updateNotificationPrefs({ enabled: result === 'granted', permission_status: result });
    close();
  };

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Icon name="bell" size={20} color={colors.accentText} />
        <AppText variant="bodyStrong" style={styles.flex}>
          Want a gentle nudge?
        </AppText>
      </View>
      <AppText variant="caption" tone="secondary">
        If nothing is logged by 2 PM, we’ll send one quiet reminder. Nothing else.
      </AppText>
      <View style={styles.actions}>
        <Button label="Turn on" size="small" variant="filled" onPress={turnOn} />
        <Button label="Not now" size="small" variant="ghost" onPress={close} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
