import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Card, FoodRow } from '../../components';
import { SwipeToDelete } from '../../components/SwipeToDelete';
import type { FoodLog } from '../../types/models';
import { spacing } from '../../theme';
import { formatLogTime, formatServing } from '../../utils/format';

interface Props {
  logs: FoodLog[];
  onPressLog: (log: FoodLog) => void;
  onDeleteLog?: (log: FoodLog) => void;
  muted?: boolean;
}

export function logDetail(log: FoodLog): string | null {
  if (log.notes?.trim()) return log.notes.trim().replace(/\n/g, ' · ');
  if (log.source === 'quick_add') return 'Quick add';
  if (log.source === 'ai_photo') return 'AI estimate';
  const serving = formatServing(log.serving_quantity, log.serving_unit);
  return serving || null;
}

export function LoggedFoodsCard({ logs, onPressLog, onDeleteLog, muted }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (!logs.length) return null;
  return (
    <Card padded={false} style={[styles.card, muted && styles.muted]}>
      {logs.map((log, index) => (
        <SwipeToDelete
          key={log.id}
          open={openId === log.id}
          onOpenChange={open => setOpenId(open ? log.id : current => (current === log.id ? null : current))}
          onDelete={() => {
            setOpenId(current => (current === log.id ? null : current));
            onDeleteLog?.(log);
          }}
          enabled={!!onDeleteLog}
        >
          <FoodRow
            name={log.food_name}
            brand={log.brand}
            detail={formatLogTime(log.logged_at)}
            meta={logDetail(log)}
            protein={log.protein_g}
            photoUri={log.photo_uri}
            photoStoragePath={log.photo_storage_path}
            onPress={() => {
              if (openId === log.id) {
                setOpenId(null);
                return;
              }
              onPressLog(log);
            }}
            last={index === logs.length - 1}
          />
        </SwipeToDelete>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', paddingVertical: spacing.xs },
  muted: { opacity: 0.6 },
});
