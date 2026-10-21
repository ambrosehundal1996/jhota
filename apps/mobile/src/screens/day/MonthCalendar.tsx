import { compareLocalDates, toLocalDate, type LocalDate } from '@jota/domain';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, IconButton } from '../../components';
import { colors, radii, spacing } from '../../theme';

interface Props {
  selected: LocalDate;
  today: LocalDate;
  totals: Record<LocalDate, number>;
  goalMin: number;
  onSelect: (date: LocalDate) => void;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function monthGrid(year: number, month: number): (LocalDate | null)[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (LocalDate | null)[] = Array.from({ length: first.getDay() }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toLocalDate(new Date(year, month, d)));
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function MonthCalendar({ selected, today, totals, goalMin, onSelect }: Props) {
  const [cursor, setCursor] = useState(() => {
    const [y, m] = selected.split('-').map(Number);
    return { year: y!, month: m! - 1 };
  });
  const cells = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor]);
  const title = new Date(cursor.year, cursor.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const [ty, tm] = today.split('-').map(Number);
  const atCurrentMonth = cursor.year === ty && cursor.month === tm! - 1;

  const shift = (delta: number) =>
    setCursor(c => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  return (
    <View>
      <View style={styles.header}>
        <IconButton icon="chevronLeft" tone="plain" accessibilityLabel="Previous month" onPress={() => shift(-1)} />
        <AppText variant="bodyStrong">{title}</AppText>
        <IconButton icon="chevronRight" tone="plain" accessibilityLabel="Next month" onPress={() => shift(1)} disabled={atCurrentMonth} />
      </View>
      <View style={styles.grid}>
        {WEEKDAYS.map((d, i) => (
          <View key={`h${i}`} style={styles.cell}>
            <AppText variant="caption" tone="tertiary">
              {d}
            </AppText>
          </View>
        ))}
        {cells.map((date, i) => {
          if (!date) return <View key={`e${i}`} style={styles.cell} />;
          const future = compareLocalDates(date, today) > 0;
          const total = totals[date] ?? 0;
          const reached = total >= goalMin;
          const isSelected = date === selected;
          return (
            <Pressable
              key={date}
              style={styles.cell}
              disabled={future}
              onPress={() => onSelect(date)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: future }}
              accessibilityLabel={`${date}, ${Math.round(total)} grams${reached ? ', goal reached' : ''}`}
            >
              <View style={[styles.day, reached && styles.reached, isSelected && styles.selected]}>
                <AppText variant="caption" tone={future ? 'tertiary' : 'primary'}>
                  {Number(date.slice(8))}
                </AppText>
              </View>
              {total > 0 && !reached ? <View style={styles.dot} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  cell: { width: `${100 / 7}%`, height: 44, alignItems: 'center', justifyContent: 'center' },
  day: { width: 34, height: 34, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  reached: { backgroundColor: colors.accentTint },
  selected: { borderWidth: 2, borderColor: colors.accent },
  dot: { position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.neutralBar },
});
