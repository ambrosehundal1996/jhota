import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Card, FoodRow } from '../../components';
import { MEAL_LABELS, type MealGroup } from '../../state/selectors';
import type { FoodLog } from '../../types/models';
import { spacing } from '../../theme';
import { formatServing } from '../../utils/format';

interface Props {
  group: MealGroup;
  onPressLog: (log: FoodLog) => void;
  right?: React.ReactNode;
  muted?: boolean;
}

export function logDetail(log: FoodLog): string | null {
  if (log.source === 'quick_add') return 'Quick add';
  if (log.source === 'ai_photo') return 'AI estimate';
  const serving = formatServing(log.serving_quantity, log.serving_unit);
  return serving || null;
}

export function MealGroupCard({ group, onPressLog, right, muted }: Props) {
  return (
    <Card style={[styles.card, muted && styles.muted]}>
      <View style={styles.header}>
        <AppText variant="h3" accessibilityRole="header">
          {MEAL_LABELS[group.meal]}
        </AppText>
        <View style={styles.headerRight}>
          {right}
          <AppText variant="bodyStrong" tone="secondary">
            {group.protein}g
          </AppText>
        </View>
      </View>
      {group.logs.map((log, index) => (
        <FoodRow
          key={log.id}
          name={log.food_name}
          brand={log.brand}
          detail={logDetail(log)}
          protein={log.protein_g}
          onPress={() => onPressLog(log)}
          last={index === group.logs.length - 1}
        />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingBottom: spacing.xs },
  muted: { opacity: 0.6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
