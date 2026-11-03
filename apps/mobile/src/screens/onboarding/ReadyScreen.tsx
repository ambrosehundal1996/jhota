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

  const finish = (openLog: boolean) => completeOnboarding(range, isCustom, { openLog });

  return (
    <Screen
      scroll={false}
      footer={
        <>
          <Button label="Log your first protein" variant="filled" onPress={() => finish(true)} testID="log-first-protein" />
          <Button label="I’ll log later" variant="ghost" onPress={() => finish(false)} testID="log-later" />
        </>
      }
    >
      <View style={styles.center}>
        <ProgressRing progress={1} size={160} strokeWidth={12}>
          <Icon name="check" size={48} color={colors.accent} strokeWidth={2.4} />
        </ProgressRing>
        <AppText variant="title" align="center" accessibilityRole="header" style={styles.title}>
          You’re all set!
        </AppText>
        <AppText variant="body" tone="secondary" align="center" style={styles.sub}>
          Your daily protein range is {range.min}–{range.max}g. Anywhere in that range counts as reaching your goal.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  title: { marginTop: spacing.xxl, marginBottom: spacing.md },
  sub: { maxWidth: 300 },
});
