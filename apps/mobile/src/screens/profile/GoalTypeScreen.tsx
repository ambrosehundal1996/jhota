import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, BackLink, Screen, SelectCard } from '../../components';
import { GOAL_OPTIONS } from '../../features/goalTypes';
import { setGoalType } from '../../features/profile/actions';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../state/appStore';
import { spacing } from '../../theme';

export function GoalTypeScreen({ navigation }: RootScreenProps<'GoalTypeSettings'>) {
  const goalType = useAppStore(s => s.profile?.goal_type ?? null);
  return (
    <Screen>
      <BackLink label="Profile" onPress={navigation.goBack} />
      <AppText variant="title" accessibilityRole="header" style={styles.title}>
        Primary goal
      </AppText>
      <AppText variant="body" tone="secondary" style={styles.sub}>
        Changing this won’t change your protein range.
      </AppText>
      <View style={styles.options} accessibilityRole="radiogroup">
        {GOAL_OPTIONS.map(option => (
          <SelectCard
            key={option.value}
            title={option.title}
            subtitle={option.subtitle}
            icon={option.icon}
            selected={goalType === option.value}
            onPress={() => setGoalType(option.value)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm },
  sub: { marginTop: spacing.sm },
  options: { gap: spacing.md, marginTop: spacing.xl },
});
