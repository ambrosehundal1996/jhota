import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Screen, StepHeader, TextField } from '../../components';
import { DISPLAY_NAME_MAX, normalizeDisplayName, setOnboardingName } from '../../features/profile/actions';
import type { OnboardingScreenProps } from '../../navigation/types';
import { useAppStore } from '../../state/appStore';
import { spacing } from '../../theme';

export function NameScreen({ navigation }: OnboardingScreenProps<'Name'>) {
  const saved = useAppStore(s => s.onboarding.displayName ?? s.profile?.display_name ?? '');
  const [text, setText] = useState(saved);
  const name = normalizeDisplayName(text);
  const valid = name.length > 0;

  const submit = () => {
    if (!valid) return;
    setOnboardingName(name);
    navigation.navigate('Goal');
  };

  return (
    <Screen keyboard footer={<Button label="Continue" disabled={!valid} onPress={submit} testID="name-continue" />}>
      <StepHeader step={1} total={4} onBack={navigation.goBack} />
      <AppText variant="title" accessibilityRole="header">
        What’s your name?
      </AppText>
      <AppText variant="body" tone="secondary" style={styles.sub}>
        We’ll use it in reminders so they feel like they’re for you.
      </AppText>
      <View style={styles.form}>
        <TextField
          label="Name"
          value={text}
          onChangeText={setText}
          placeholder="Alex"
          autoFocus
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={DISPLAY_NAME_MAX}
          returnKeyType="done"
          onSubmitEditing={submit}
          testID="name-input"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: spacing.sm },
  form: { marginTop: spacing.xxl },
});
