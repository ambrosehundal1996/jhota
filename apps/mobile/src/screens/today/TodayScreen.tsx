import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { computeGoalStreak, defaultMealForTime, type RecentFood } from '@steady/domain';
import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Chip,
  EmptyState,
  Icon,
  MethodTile,
  OfflineBanner,
  ProgressRing,
  Screen,
  SectionLabel,
  showToast,
  useIsOffline,
} from '../../components';
import { relogRecent, removeDailyOverride, setDailyOverride, undoLogs } from '../../features/logging/actions';
import { useDay, useRecents, useTotalsByDate } from '../../hooks/useAppData';
import { useLocalToday } from '../../hooks/useLocalToday';
import { openLog } from '../../navigation/openLog';
import { useAppStore } from '../../state/appStore';
import { groupByMeal } from '../../state/selectors';
import { colors, radii, spacing } from '../../theme';
import { formatTodayHeader, rangeLabel } from '../../utils/format';
import { MealGroupCard } from './MealGroupCard';
import { NotificationPromptCard } from './NotificationPromptCard';
import { OverrideBanner } from './OverrideBanner';

export function TodayScreen() {
  const navigation = useNavigation();
  const today = useLocalToday();
  const day = useDay(today);
  const totals = useTotalsByDate();
  const recents = useRecents(10);
  const pendingCelebration = useAppStore(s => s.flags.pendingCelebrationDate);
  const offline = useIsOffline();

  const streak = useMemo(() => computeGoalStreak(totals, today, day.range.min), [totals, today, day.range.min]);
  const groups = useMemo(() => groupByMeal(day.logs), [day.logs]);
  const hasAnything = day.logs.length > 0 || !!day.override;
  const total = Math.round(day.total.total);
  const ctx = { date: today, src: 'today' as const };

  useFocusEffect(
    useCallback(() => {
      if (pendingCelebration === today) navigation.navigate('GoalReached');
    }, [pendingCelebration, today, navigation]),
  );

  const logAgain = (recent: RecentFood) => {
    const log = relogRecent(recent, today, recent.lastMeal ?? defaultMealForTime(new Date()));
    showToast(`Added ${recent.food_name} · ${Math.round(log.protein_g)}g`, { label: 'Undo', onPress: () => undoLogs([log.id]) });
  };

  const removeOverride = () => {
    const previous = day.override?.protein_total_g;
    removeDailyOverride(today);
    showToast('Back to your logged total', {
      label: 'Undo',
      onPress: () => previous !== undefined && setDailyOverride(today, previous),
    });
  };

  const ringLabel = day.status.reached
    ? `${total} grams today. Goal reached.`
    : `${total} grams today. ${day.status.toGoal} grams to goal.`;

  return (
    <Screen edges={['top']} testID="today-screen">
      <View style={styles.header}>
        <View>
          <AppText variant="eyebrow" tone="tertiary">
            {formatTodayHeader(today)}
          </AppText>
          <AppText variant="title" accessibilityRole="header">
            Today
          </AppText>
        </View>
        {streak > 0 ? <Chip icon="flame" label={`${streak} day${streak === 1 ? '' : 's'}`} /> : null}
      </View>

      {offline ? <OfflineBanner /> : null}

      <View style={styles.hero}>
        <ProgressRing progress={day.status.progress} size={232} strokeWidth={16} accessibilityLabel={ringLabel}>
          <AppText variant="display" testID="today-total">
            {total}
            <AppText variant="h2" tone="secondary">
              g
            </AppText>
          </AppText>
          <AppText variant="caption" tone="tertiary">
            {day.total.source === 'override' ? 'total set' : 'protein today'}
          </AppText>
        </ProgressRing>

        {day.status.reached ? (
          <View style={styles.reached} accessibilityLiveRegion="polite">
            <Icon name="check" size={18} color={colors.accentText} strokeWidth={2.4} />
            <AppText variant="h3" tone="accent">
              Goal reached
            </AppText>
          </View>
        ) : (
          <AppText variant="h3" style={styles.status}>
            {day.status.toGoal}g to goal
          </AppText>
        )}
        <AppText variant="caption" tone="secondary">
          Goal range: {rangeLabel(day.range)}
          {day.status.aboveMax ? ' · above your range is fine' : ''}
        </AppText>
      </View>

      <View style={styles.actions}>
        <Button label="Log food" icon="plus" variant="filled" onPress={() => openLog(navigation, 'LogHome', ctx)} style={styles.flex} testID="log-food" />
        <Button label="Quick add" icon="bolt" onPress={() => openLog(navigation, 'QuickAdd', ctx)} style={styles.flex} testID="quick-add" />
      </View>

      {recents.length > 0 ? (
        <>
          <SectionLabel>Log again</SectionLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recents} style={styles.recentsScroll}>
            {recents.map(recent => (
              <Pressable
                key={recent.key}
                onPress={() => logAgain(recent)}
                accessibilityRole="button"
                accessibilityLabel={`Log ${recent.food_name} again, ${Math.round(recent.protein_g)} grams`}
                style={({ pressed }) => [styles.recent, pressed && styles.pressed]}
              >
                <AppText variant="captionStrong" numberOfLines={1} style={styles.recentName}>
                  {recent.food_name}
                </AppText>
                <View style={styles.recentBottom}>
                  <AppText variant="caption" tone="accent">
                    +{Math.round(recent.protein_g)}g
                  </AppText>
                  <Icon name="plus" size={14} color={colors.accentText} />
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : null}

      <View style={styles.stack}>
        <NotificationPromptCard hasLogged={hasAnything} />

        {day.override ? (
          <OverrideBanner
            total={day.total.total}
            loggedTotal={day.total.loggedTotal}
            entryCount={day.total.entryCount}
            onEdit={() => openLog(navigation, 'SetTotal', ctx)}
            onRemove={removeOverride}
          />
        ) : null}

        {groups.map(group => (
          <MealGroupCard
            key={group.meal}
            group={group}
            muted={!!day.override}
            onPressLog={log => openLog(navigation, 'FoodDetail', { mode: 'edit', logId: log.id })}
          />
        ))}
      </View>

      {!hasAnything ? (
        <EmptyState title="Nothing logged yet" message="Start with whatever is easiest. A rough estimate still counts.">
          <View style={styles.tiles}>
            <MethodTile label="Search" icon="search" onPress={() => openLog(navigation, 'Search', ctx)} />
            <MethodTile
              label="AI photo"
              icon="camera"
              onPress={() => openLog(navigation, 'Photo', ctx)}
            />
            <MethodTile label="Quick add" icon="bolt" onPress={() => openLog(navigation, 'QuickAdd', ctx)} />
            <MethodTile label="Set total" icon="sigma" onPress={() => openLog(navigation, 'SetTotal', ctx)} />
          </View>
        </EmptyState>
      ) : !day.override ? (
        <Pressable accessibilityRole="button" onPress={() => openLog(navigation, 'SetTotal', ctx)} style={styles.setTotal}>
          <AppText variant="caption" tone="tertiary" align="center">
            Lost track? Set today’s total instead
          </AppText>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  hero: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg },
  status: { marginTop: spacing.lg },
  reached: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  flex: { flex: 1 },
  recentsScroll: { marginHorizontal: -spacing.xl },
  recents: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  recent: {
    width: 132,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  recentName: { color: colors.text },
  recentBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pressed: { opacity: 0.7 },
  stack: { gap: spacing.md, marginTop: spacing.xl },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  setTotal: { paddingVertical: spacing.lg },
});
