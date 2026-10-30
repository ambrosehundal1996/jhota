import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { analytics } from '../../analytics';
import { AppText, Button, Screen, SheetHeader, showToast, TextField } from '../../components';
import type { RootScreenProps } from '../../navigation/types';
import { ApiError, apiFetch } from '../../services/api/client';
import { useAppStore } from '../../state/appStore';
import { spacing } from '../../theme';

const MAX_NOTE = 1500;

export function FeedbackScreen({ navigation }: RootScreenProps<'Feedback'>) {
  const displayName = useAppStore(s => s.profile?.display_name?.trim() || s.onboarding.displayName?.trim() || null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const trimmed = note.trim();

  useEffect(() => {
    analytics.track('feedback_opened');
  }, []);

  const send = async () => {
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await apiFetch('/api/feedback', {
        method: 'POST',
        body: { message: trimmed, displayName },
      });
      analytics.track('feedback_sent');
      showToast('Thanks — we got it');
      navigation.goBack();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Could not send that just now. Please try again.';
      Alert.alert('Couldn’t send', message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen keyboard edges={['bottom']} footer={<Button label="Send" onPress={() => void send()} disabled={!trimmed} loading={sending} />}>
      <SheetHeader title="Feedback" onClose={() => navigation.goBack()} />
      <AppText variant="body" tone="secondary" style={styles.sub}>
        Type a note. We’ll send it to the Jota team — no Mail app.
      </AppText>
      <View style={styles.form}>
        <TextField
          label="Your note"
          value={note}
          onChangeText={setNote}
          placeholder="Tell us anything"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={MAX_NOTE}
          autoFocus
          style={styles.input}
          testID="feedback-input"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: spacing.xs },
  form: { marginTop: spacing.xl },
  input: { minHeight: 140, paddingTop: spacing.md },
});
