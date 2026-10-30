import { useNavigation } from '@react-navigation/native';
import { computeGoalStreak, type RecentFood } from '@jota/domain';
import React, { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  AppText,
  Chip,
  EmptyState,
  Icon,
  OfflineBanner,
  Screen,
  SectionLabel,
  showToast,
  useIsOffline,
} from '../../components';
import { relogRecent, removeDailyOverride, setDailyOverride, undoLogs } from '../../features/logging/actions';
import { useDay, useRecents, useTotalsByDate } from '../../hooks/useAppData';
import { useLocalToday } from '../../hooks/useLocalToday';
import { openLog } from '../../navigation/openLog';
import { getState, setState } from '../../state/appStore';
import { colors, hitSlop, radii, shadows, spacing } from '../../theme';
import { formatTodayHeader } from '../../utils/format';
import { DailyProteinProgress } from './DailyProteinProgress';
import { LoggedFoodsCard } from './LoggedFoodsCard';
import { NotificationPromptCard } from './NotificationPromptCard';
import { OverrideBanner } from './OverrideBanner';

export function TodayScreen() {
  const navigation = useNavigation();
  const today = useLocalToday();
  const day = useDay(today);
  const totals = useTotalsByDate();
  const recents = useRecents(10);
  const offline = useIsOffline();

  useEffect(() => {
    if (!getState().flags.openLogAfterOnboarding) return;
    setState(s => ({ flags: { ...s.flags, openLogAfterOnboarding: false } }));
    openLog(navigation, 'LogHome', { date: today, src: 'onboarding' });
  }, [navigation, today]);

  const streak = useMemo(() => computeGoalStreak(totals, today, day.range.min), [totals, today, day.range.min]);
  const hasAnything = day.logs.length > 0 || !!day.override;
  const total = Math.round(day.total.total);
  const ctx = { date: today, src: 'today' as const };

  const logAgain = (recent: RecentFood) => {
    const log = relogRecent(recent, today);
    if (!log) return;
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

      <DailyProteinProgress
        total={total}
        range={day.range}
        status={day.status}
        source={day.total.source === 'override' ? 'override' : 'logged'}
      />

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log protein"
          onPress={() => openLog(navigation, 'LogHome', ctx)}
          style={({ pressed }) => [styles.logButton, pressed && styles.logButtonPressed]}
          testID="log-food"
        >
          <Icon name="plus" size={40} color={colors.white} strokeWidth={2.4} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send feedback"
          hitSlop={hitSlop}
          onPress={() => navigation.navigate('Feedback')}
          style={({ pressed }) => [styles.feedback, pressed && styles.pressed]}
          testID="send-feedback"
        >
          <AppText variant="caption" tone="accent">
            Send feedback
          </AppText>
        </Pressable>
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

        <LoggedFoodsCard
          logs={day.logs}
          muted={!!day.override}
          onPressLog={log => openLog(navigation, 'FoodDetail', { mode: 'edit', logId: log.id })}
        />
      </View>

      {!hasAnything ? (
        <EmptyState title="Nothing logged yet" message="Tap + to log. A rough estimate still counts." />
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
  actions: { marginTop: spacing.xl, alignItems: 'center', gap: spacing.md },
  feedback: { paddingVertical: spacing.sm },
  logButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    ...shadows.button,
  },
  logButtonPressed: { backgroundColor: colors.accentPressed, transform: [{ scale: 0.96 }] },
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
  setTotal: { paddingVertical: spacing.lg },
});
