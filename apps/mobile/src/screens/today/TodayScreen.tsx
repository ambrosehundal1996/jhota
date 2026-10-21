import { useNavigation } from '@react-navigation/native';
import { computeGoalStreak, type RecentFood } from '@jota/domain';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  AppText,
  Chip,
  CountUpText,
  EmptyState,
  Icon,
  LogDeltaChip,
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
import { colors, radii, shadows, spacing } from '../../theme';
import { formatTodayHeader, rangeLabel } from '../../utils/format';
import { LoggedFoodsCard } from './LoggedFoodsCard';
import { NotificationPromptCard } from './NotificationPromptCard';
import { OverrideBanner } from './OverrideBanner';

export function TodayScreen() {
  const navigation = useNavigation();
  const today = useLocalToday();
  const day = useDay(today);
  const totals = useTotalsByDate();
  const recents = useRecents(10);
  const celebrating = useAppStore(s => s.flags.pendingCelebrationDate === today);
  const offline = useIsOffline();

  const streak = useMemo(() => computeGoalStreak(totals, today, day.range.min), [totals, today, day.range.min]);
  const hasAnything = day.logs.length > 0 || !!day.override;
  const total = Math.round(day.total.total);
  const ctx = { date: today, src: 'today' as const };
  const over = Math.round(day.total.total - day.range.min);

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
        <View>
          <LogDeltaChip />
          <ProgressRing
            progress={day.status.progress}
            size={232}
            strokeWidth={16}
            pulseKey={celebrating ? today : null}
            accessibilityLabel={ringLabel}
          >
            <View style={styles.totalRow}>
              <CountUpText variant="display" value={total} testID="today-total" />
              <AppText variant="h2" tone="secondary">
                g
              </AppText>
            </View>
            <AppText variant="caption" tone="tertiary">
              {day.total.source === 'override' ? 'total set' : 'protein today'}
            </AppText>
          </ProgressRing>
        </View>

        {over > 0 && day.status.reached ? (
          <AppText variant="h3" tone="secondary" style={styles.status}>
            +{over}g over
          </AppText>
        ) : day.status.reached ? (
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
        </AppText>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log food"
          onPress={() => openLog(navigation, 'LogHome', ctx)}
          style={({ pressed }) => [styles.logButton, pressed && styles.logButtonPressed]}
          testID="log-food"
        >
          <Icon name="plus" size={40} color={colors.white} strokeWidth={2.4} />
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
  hero: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg },
  totalRow: { flexDirection: 'row', alignItems: 'baseline' },
  status: { marginTop: spacing.lg },
  reached: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg },
  actions: { marginTop: spacing.xl, alignItems: 'center' },
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
