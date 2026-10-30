import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, BackLink, Button, Screen, TextField, showToast } from '../../components';
import { DISPLAY_NAME_MAX, normalizeDisplayName, setDisplayName } from '../../features/profile/actions';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../state/appStore';
import { spacing } from '../../theme';

export function DisplayNameScreen({ navigation }: RootScreenProps<'DisplayName'>) {
  const profile = useAppStore(s => s.profile);
  const [text, setText] = useState(profile?.display_name ?? '');
  const name = normalizeDisplayName(text);
  const valid = name.length > 0;
  const unchanged = name === (profile?.display_name ?? '');

  const save = () => {
    if (!valid || unchanged) return;
    setDisplayName(name);
    showToast('Name updated');
    navigation.goBack();
  };

  return (
    <Screen keyboard footer={<Button label="Save" onPress={save} disabled={!valid || unchanged} />}>
      <BackLink label="Profile" onPress={navigation.goBack} />
      <AppText variant="title" accessibilityRole="header" style={styles.title}>
        Name
      </AppText>
      <AppText variant="body" tone="secondary" style={styles.sub}>
        Reminders use your first name.
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
          onSubmitEditing={save}
          testID="display-name-input"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm },
  sub: { marginTop: spacing.sm },
  form: { marginTop: spacing.xxl },
});
