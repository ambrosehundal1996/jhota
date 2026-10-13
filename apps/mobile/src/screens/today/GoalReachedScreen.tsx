import { computeGoalStreak } from '@steady/domain';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { AppText, Button, Icon, ProgressRing, Screen } from '../../components';
import { useDay, useTotalsByDate } from '../../hooks/useAppData';
import { useLocalToday } from '../../hooks/useLocalToday';
import type { RootScreenProps } from '../../navigation/types';
import { setState } from '../../state/appStore';
import { colors, spacing } from '../../theme';

export function GoalReachedScreen({ navigation }: RootScreenProps<'GoalReached'>) {
  const today = useLocalToday();
  const day = useDay(today);
  const totals = useTotalsByDate();
  const streak = computeGoalStreak(totals, today, day.range.min);

  useEffect(() => {
    setState(s => ({ flags: { ...s.flags, pendingCelebrationDate: null } }));
  }, []);

  return (
    <Screen scroll={false} footer={<Button label="Done" variant="filled" onPress={navigation.goBack} testID="goal-reached-done" />}>
      <View style={styles.center}>
        <Animated.View entering={ZoomIn.springify().damping(14)}>
          <ProgressRing progress={1} size={180} strokeWidth={14} accessibilityLabel="Goal reached">
            <Icon name="check" size={56} color={colors.accent} strokeWidth={2.4} />
          </ProgressRing>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(150)} style={styles.copy}>
          <AppText variant="title" align="center" accessibilityRole="header">
            Goal reached
          </AppText>
          <AppText variant="body" tone="secondary" align="center">
            {Math.round(day.total.total)}g today · your goal was {day.range.min}g.
          </AppText>
          {streak > 1 ? (
            <AppText variant="bodyStrong" tone="accent" align="center" style={styles.streak}>
              {streak} days in a row
            </AppText>
          ) : (
            <AppText variant="body" tone="secondary" align="center" style={styles.streak}>
              That’s a steady day.
            </AppText>
          )}
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  copy: { marginTop: spacing.xxl, gap: spacing.sm },
  streak: { marginTop: spacing.md },
});
