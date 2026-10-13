import { addDays, compareLocalDates, type LocalDate } from '@steady/domain';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { analytics } from '../../analytics';
import {
  AppText,
  BackLink,
  Button,
  ConfirmSheet,
  EmptyState,
  IconButton,
  ProgressBar,
  Screen,
  showToast,
  TextField,
} from '../../components';
import { copyLogsToDate, removeDailyOverride, saveMealFromLogs, setDailyOverride, undoLogs } from '../../features/logging/actions';
import { useDay, useTotalsByDate } from '../../hooks/useAppData';
import { useLocalToday } from '../../hooks/useLocalToday';
import { openLog } from '../../navigation/openLog';
import type { RootScreenProps } from '../../navigation/types';
import { groupByMeal, MEAL_LABELS, type MealGroup } from '../../state/selectors';
import { spacing } from '../../theme';
import { formatDayTitle, rangeLabel } from '../../utils/format';
import { MealGroupCard } from '../today/MealGroupCard';
import { OverrideBanner } from '../today/OverrideBanner';
import { MonthCalendar } from './MonthCalendar';

export function DayHistoryScreen({ navigation, route }: RootScreenProps<'Day'>) {
  const today = useLocalToday();
  const [date, setDate] = useState<LocalDate>(route.params.date);
  const day = useDay(date);
  const totals = useTotalsByDate();
  const groups = useMemo(() => groupByMeal(day.logs), [day.logs]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [saving, setSaving] = useState<MealGroup | null>(null);
  const [mealName, setMealName] = useState('');
  const isToday = date === today;
  const ctx = { date, src: 'history' as const };

  useEffect(() => setDate(route.params.date), [route.params.date]);
  useEffect(() => {
    analytics.track('day_history_viewed', { days_ago: Math.round((Date.parse(today) - Date.parse(date)) / 86_400_000) });
  }, [date, today]);

  const copyToToday = (group: MealGroup) => {
    const created = copyLogsToDate(group.logs, today);
    showToast(`Copied ${MEAL_LABELS[group.meal].toLowerCase()} to today · ${group.protein}g`, {
      label: 'Undo',
      onPress: () => undoLogs(created.map(l => l.id)),
    });
  };

  const saveMeal = () => {
    if (!saving || !mealName.trim()) return;
    saveMealFromLogs(mealName, saving.logs, saving.meal === 'other' ? null : saving.meal);
    setSaving(null);
    showToast('Saved to My foods');
  };

  const removeOverride = () => {
    const previous = day.override?.protein_total_g;
    removeDailyOverride(date);
    showToast('Back to the logged total', { label: 'Undo', onPress: () => previous !== undefined && setDailyOverride(date, previous) });
  };

  const status = day.status;

  return (
    <Screen>
      <BackLink label="Back" onPress={navigation.goBack} />
      <View style={styles.dateRow}>
        <IconButton icon="chevronLeft" tone="plain" accessibilityLabel="Previous day" onPress={() => setDate(addDays(date, -1))} />
        <Pressable
          style={styles.dateTitle}
          onPress={() => setCalendarOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`${formatDayTitle(date)}. Open calendar`}
        >
          <AppText variant="h2" align="center">
            {isToday ? 'Today' : formatDayTitle(date)}
          </AppText>
        </Pressable>
        <IconButton
          icon="chevronRight"
          tone="plain"
          accessibilityLabel="Next day"
          onPress={() => setDate(addDays(date, 1))}
          disabled={compareLocalDates(date, today) >= 0}
        />
      </View>

      <View style={styles.summary}>
        <AppText variant="hero">{Math.round(day.total.total)}g</AppText>
        <AppText variant="bodyStrong" tone={status.reached ? 'accent' : 'secondary'}>
          {status.reached ? 'Goal reached ✓' : status.state === 'not_started' ? 'Nothing logged' : `${status.toGoal}g to goal`}
        </AppText>
        <View style={styles.bar}>
          <ProgressBar progress={status.progress} />
        </View>
        <AppText variant="caption" tone="tertiary">
          Goal range: {rangeLabel(day.range)}
        </AppText>
      </View>

      <View style={styles.stack}>
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
          <View key={group.meal} style={styles.group}>
            <MealGroupCard
              group={group}
              muted={!!day.override}
              onPressLog={log => openLog(navigation, 'FoodDetail', { mode: 'edit', logId: log.id })}
            />
            <View style={styles.groupActions}>
              {!isToday ? (
                <Pressable accessibilityRole="button" onPress={() => copyToToday(group)} hitSlop={8}>
                  <AppText variant="captionStrong" tone="accent">
                    Copy to today
                  </AppText>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setMealName(group.meal === 'other' ? 'My meal' : `My ${MEAL_LABELS[group.meal].toLowerCase()}`);
                  setSaving(group);
                }}
                hitSlop={8}
              >
                <AppText variant="captionStrong" tone="secondary">
                  Save as meal
                </AppText>
              </Pressable>
            </View>
          </View>
        ))}

        {!day.logs.length && !day.override ? (
          <EmptyState icon="calendar" title="Nothing logged this day" message="You can still add what you ate, or set a total for the day." />
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button label="Add food" icon="plus" variant="secondary" size="medium" onPress={() => openLog(navigation, 'LogHome', ctx)} style={styles.flex} />
        <Button label="Set total" icon="sigma" variant="secondary" size="medium" onPress={() => openLog(navigation, 'SetTotal', ctx)} style={styles.flex} />
      </View>

      <ConfirmSheet visible={calendarOpen} title="Go to a day" onDismiss={() => setCalendarOpen(false)} actions={[]}>
        <MonthCalendar
          selected={date}
          today={today}
          totals={totals}
          goalMin={day.range.min}
          onSelect={d => {
            setDate(d);
            setCalendarOpen(false);
          }}
        />
      </ConfirmSheet>

      <ConfirmSheet
        visible={!!saving}
        title="Save as meal"
        message="Log the whole meal with one tap from My foods."
        onDismiss={() => setSaving(null)}
        actions={[
          { label: 'Save meal', onPress: saveMeal, variant: 'filled' },
          { label: 'Cancel', onPress: () => setSaving(null), variant: 'ghost' },
        ]}
      >
        <TextField label="Name" value={mealName} onChangeText={setMealName} maxLength={60} autoFocus />
      </ConfirmSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  dateTitle: { flex: 1, paddingVertical: spacing.sm },
  summary: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg },
  bar: { alignSelf: 'stretch', marginVertical: spacing.sm },
  stack: { gap: spacing.md, marginTop: spacing.xl },
  group: { gap: spacing.sm },
  groupActions: { flexDirection: 'row', gap: spacing.xl, paddingHorizontal: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  flex: { flex: 1 },
});
