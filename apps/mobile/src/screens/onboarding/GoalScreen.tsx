import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Screen, SelectCard, StepHeader } from '../../components';
import { GOAL_OPTIONS } from '../../features/goalTypes';
import { setOnboardingGoal } from '../../features/profile/actions';
import type { OnboardingScreenProps } from '../../navigation/types';
import { useAppStore } from '../../state/appStore';
import { spacing } from '../../theme';

export function GoalScreen({ navigation }: OnboardingScreenProps<'Goal'>) {
  const goalType = useAppStore(s => s.onboarding.goalType);
  return (
    <Screen footer={<Button label="Continue" disabled={!goalType} onPress={() => navigation.navigate('Weight')} />}>
      <StepHeader step={1} total={3} onBack={navigation.goBack} />
      <AppText variant="title" accessibilityRole="header">
        What are you working toward?
      </AppText>
      <AppText variant="body" tone="secondary" style={styles.sub}>
        This helps us tailor your experience. You can change it anytime.
      </AppText>
      <View style={styles.options} accessibilityRole="radiogroup">
        {GOAL_OPTIONS.map(option => (
          <SelectCard
            key={option.value}
            title={option.title}
            subtitle={option.subtitle}
            icon={option.icon}
            selected={goalType === option.value}
            onPress={() => setOnboardingGoal(option.value)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: spacing.sm },
  options: { gap: spacing.md, marginTop: spacing.xxl },
});
