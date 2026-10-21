import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, FoodRow } from '../../components';
import type { FoodLog } from '../../types/models';
import { spacing } from '../../theme';
import { formatLogTime, formatServing } from '../../utils/format';

interface Props {
  logs: FoodLog[];
  onPressLog: (log: FoodLog) => void;
  muted?: boolean;
}

export function logDetail(log: FoodLog): string | null {
  if (log.source === 'quick_add') return 'Quick add';
  if (log.source === 'ai_photo') return 'AI estimate';
  const serving = formatServing(log.serving_quantity, log.serving_unit);
  return serving || null;
}

export function LoggedFoodsCard({ logs, onPressLog, muted }: Props) {
  if (!logs.length) return null;
  return (
    <Card style={[styles.card, muted && styles.muted]}>
      {logs.map((log, index) => (
        <FoodRow
          key={log.id}
          name={log.food_name}
          brand={log.brand}
          detail={formatLogTime(log.logged_at)}
          meta={logDetail(log)}
          protein={log.protein_g}
          onPress={() => onPressLog(log)}
          last={index === logs.length - 1}
        />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: spacing.xs },
  muted: { opacity: 0.6 },
});
