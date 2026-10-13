import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Icon, ProgressRing, Screen } from '../../components';
import { completeOnboarding } from '../../features/profile/actions';
import type { OnboardingScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { usePendingRange } from './pendingRange';

export function ReadyScreen({ navigation }: OnboardingScreenProps<'Ready'>) {
  const { range, isCustom } = usePendingRange();
  useEffect(() => {
    if (!range) navigation.goBack();
  }, [range, navigation]);
  if (!range) return null;
  return (
    <Screen scroll={false} footer={<Button label="Start Tracking" onPress={() => completeOnboarding(range, isCustom)} testID="start-tracking" />}>
      <View style={styles.center}>
        <ProgressRing progress={1} size={160} strokeWidth={12}>
          <Icon name="check" size={48} color={colors.accent} strokeWidth={2.4} />
        </ProgressRing>
        <AppText variant="title" align="center" accessibilityRole="header" style={styles.title}>
          You’re ready.
        </AppText>
        <AppText variant="hero" align="center">
          {range.min}–{range.max}g
        </AppText>
        <AppText variant="body" tone="secondary" align="center">
          protein per day
        </AppText>
        <AppText variant="caption" tone="tertiary" align="center" style={styles.note}>
          Your goal counts as reached at {range.min}g. Going over {range.max}g is fine too.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  title: { marginTop: spacing.xxl, marginBottom: spacing.md },
  note: { marginTop: spacing.lg, maxWidth: 280 },
});
