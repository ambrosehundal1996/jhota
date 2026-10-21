import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  addDays,
  buildInsights,
  compareLocalDates,
  computeGoalStreak,
  goalStatus,
  weeklySummary,
  type LocalDate,
} from '@jota/domain';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { analytics } from '../../analytics';
import { AppText, Button, Card, Chip, IconButton, Screen } from '../../components';
import { useRange, useTotalsByDate } from '../../hooks/useAppData';
import { useLocalToday } from '../../hooks/useLocalToday';
import { spacing } from '../../theme';
import { formatDayTitle, formatRangeOfDates } from '../../utils/format';
import { WeekChart } from './WeekChart';

export function ProgressScreen() {
  const navigation = useNavigation();
  const today = useLocalToday();
  const totals = useTotalsByDate();
  const range = useRange();
  const [endDate, setEndDate] = useState<LocalDate>(today);
  const [selected, setSelected] = useState<LocalDate | null>(today);

  useFocusEffect(
    useCallback(() => {
      analytics.track('progress_viewed', {});
    }, []),
  );

  const summary = useMemo(() => weeklySummary(totals, endDate, range), [totals, endDate, range]);
  const insights = useMemo(() => buildInsights(summary, range), [summary, range]);
  const streak = useMemo(() => computeGoalStreak(totals, today, range.min), [totals, today, range.min]);
  const isCurrentWeek = endDate === today;
  const startDate = summary.days[0]?.date ?? endDate;

  const selectedDay = summary.days.find(d => d.date === selected) ?? null;
  const selectedStatus = selectedDay ? goalStatus(selectedDay.total, range) : null;

  const shiftWeek = (delta: number) => {
    const next = addDays(endDate, delta * 7);
    const clamped = compareLocalDates(next, today) > 0 ? today : next;
    setEndDate(clamped);
    setSelected(clamped);
  };

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          Progress
        </AppText>
        {streak > 0 ? <Chip icon="flame" label={`${streak}-day streak`} /> : null}
      </View>

      <View style={styles.weekNav}>
        <IconButton icon="chevronLeft" tone="plain" accessibilityLabel="Previous week" onPress={() => shiftWeek(-1)} />
        <AppText variant="bodyStrong" accessibilityLiveRegion="polite">
          {isCurrentWeek ? 'Last 7 days' : formatRangeOfDates(startDate, endDate)}
        </AppText>
        <IconButton
          icon="chevronRight"
          tone="plain"
          accessibilityLabel="Next week"
          onPress={() => shiftWeek(1)}
          disabled={isCurrentWeek}
        />
      </View>

      <View style={styles.stats}>
        <Card style={styles.stat}>
          <AppText variant="caption" tone="secondary">
            7-day average
          </AppText>
          <AppText variant="hero">{summary.average === null ? '—' : `${summary.average}g`}</AppText>
          <AppText variant="caption" tone="tertiary">
            on days you tracked
          </AppText>
        </Card>
        <Card style={styles.stat}>
          <AppText variant="caption" tone="secondary">
            Goal days
          </AppText>
          <AppText variant="hero">
            {summary.goalDays}
            <AppText variant="h2" tone="tertiary">
              /{summary.totalDays}
            </AppText>
          </AppText>
          <AppText variant="caption" tone="tertiary">
            reached {range.min}g+
          </AppText>
        </Card>
      </View>

      <WeekChart days={summary.days} range={range} today={today} selected={selected} onSelect={setSelected} />

      {selectedDay && selectedStatus ? (
        <Card style={styles.selected}>
          <View style={styles.selectedText}>
            <AppText variant="bodyStrong">{selectedDay.date === today ? 'Today' : formatDayTitle(selectedDay.date)}</AppText>
            <AppText variant="caption" tone="secondary">
              {Math.round(selectedDay.total)}g ·{' '}
              {selectedStatus.reached ? 'Goal reached ✓' : selectedDay.tracked ? `${selectedStatus.toGoal}g to goal` : 'Nothing logged'}
            </AppText>
          </View>
          <Button label="View day" size="small" variant="secondary" onPress={() => navigation.navigate('Day', { date: selectedDay.date })} />
        </Card>
      ) : null}

      <View style={styles.insights}>
        {insights.map(insight => (
          <Card key={insight.id} tone="mint" style={styles.insight}>
            <AppText variant="eyebrow" tone="accent">
              {insight.eyebrow}
            </AppText>
            <AppText variant="body">{insight.text}</AppText>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  stats: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  stat: { flex: 1, gap: 2 },
  selected: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  selectedText: { flex: 1, gap: 2 },
  insights: { gap: spacing.md, marginTop: spacing.xl },
  insight: { gap: spacing.xs },
});
