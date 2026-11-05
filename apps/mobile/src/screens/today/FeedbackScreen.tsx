import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { analytics } from '../../analytics';
import { AppText, Button, Screen, showToast, TextField } from '../../components';
import { ApiError, apiFetch } from '../../services/api/client';
import { useAppStore } from '../../state/appStore';
import { spacing } from '../../theme';

const MAX_NOTE = 1500;

export function FeedbackScreen() {
  const displayName = useAppStore(s => s.profile?.display_name?.trim() || s.onboarding.displayName?.trim() || null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const trimmed = note.trim();

  useFocusEffect(
    useCallback(() => {
      analytics.track('feedback_opened');
    }, []),
  );

  const send = async () => {
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await apiFetch('/api/feedback', {
        method: 'POST',
        body: { message: trimmed, displayName },
      });
      analytics.track('feedback_sent');
      setNote('');
      showToast('Thanks — we got it');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Could not send that just now. Please try again.';
      Alert.alert('Couldn’t send', message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen
      edges={['top']}
      keyboard
      footer={<Button label="Send" onPress={() => void send()} disabled={!trimmed} loading={sending} />}
    >
      <AppText variant="title" accessibilityRole="header" style={styles.title}>
        Feedback
      </AppText>
      <AppText variant="body" tone="secondary" style={styles.sub}>
        Type a note. We’ll save it for the Jota team.
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
          style={styles.input}
          testID="feedback-input"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.lg },
  sub: { marginTop: spacing.sm },
  form: { marginTop: spacing.xl },
  input: { minHeight: 140, paddingTop: spacing.md },
});
