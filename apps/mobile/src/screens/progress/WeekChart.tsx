import type { LocalDate, ProgressDay, ProteinRange } from '@jota/domain';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components';
import { colors, radii, spacing } from '../../theme';
import { formatShortDay, weekdayInitial } from '../../utils/format';

const VALUE_H = 16;

interface Props {
  days: ProgressDay[];
  range: ProteinRange;
  today: LocalDate;
  selected: LocalDate | null;
  onSelect: (date: LocalDate) => void;
  height?: number;
}

/** Seven bars with a goal line at the minimum. Each bar shows that day's protein total. */
export function WeekChart({ days, range, today, selected, onSelect, height = 180 }: Props) {
  const top = Math.max(range.max, ...days.map(d => d.total)) * 1.12 || 1;
  const goalY = (range.min / top) * height;

  return (
    <View style={[styles.wrap, { height: height + 44 + VALUE_H }]}>
      <View style={[styles.goalLine, { bottom: goalY + 24 }]} pointerEvents="none">
        <View style={styles.dash} />
        <AppText variant="caption" tone="tertiary" style={styles.goalLabel}>
          {range.min}g
        </AppText>
      </View>
      <View style={styles.bars}>
        {days.map(day => {
          const barHeight = day.total > 0 ? Math.max(6, (day.total / top) * height) : 4;
          const isSelected = day.date === selected;
          const isToday = day.date === today;
          const grams = Math.round(day.total);
          const status = day.reached ? 'goal reached' : day.tracked ? `${Math.max(0, Math.ceil(range.min - day.total))} grams to goal` : 'nothing logged';
          return (
            <Pressable
              key={day.date}
              onPress={() => onSelect(day.date)}
              style={styles.column}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${formatShortDay(day.date)}, ${grams} grams, ${status}`}
            >
              <View style={[styles.barArea, { height: height + VALUE_H }]}>
                <AppText
                  variant="captionStrong"
                  tone={day.reached ? 'accent' : day.tracked ? 'primary' : 'tertiary'}
                  style={styles.barValue}
                  numberOfLines={1}
                >
                  {grams}
                </AppText>
                <View
                  style={[
                    styles.bar,
                    { height: barHeight },
                    day.reached ? styles.barReached : day.tracked ? styles.barTracked : styles.barEmpty,
                    isSelected && styles.barSelected,
                  ]}
                />
              </View>
              <AppText variant={isToday ? 'captionStrong' : 'caption'} tone={isSelected ? 'primary' : 'tertiary'} style={styles.dayLabel}>
                {weekdayInitial(day.date)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', marginTop: spacing.lg },
  goalLine: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', zIndex: 1 },
  dash: { flex: 1, borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.accent },
  goalLabel: { marginLeft: spacing.xs, backgroundColor: colors.background, paddingHorizontal: 2 },
  bars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', paddingRight: 36 },
  column: { flex: 1, alignItems: 'center' },
  barArea: { justifyContent: 'flex-end', alignItems: 'center', width: '100%' },
  bar: { width: '58%', maxWidth: 30, borderRadius: radii.sm },
  barReached: { backgroundColor: colors.accent },
  barTracked: { backgroundColor: colors.neutralBar },
  barEmpty: { backgroundColor: colors.track },
  barSelected: { borderWidth: 2, borderColor: colors.text },
  barValue: { fontSize: 11, lineHeight: 14, marginBottom: 2 },
  dayLabel: { marginTop: spacing.sm, height: 18 },
});
