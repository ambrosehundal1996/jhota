import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Card, Icon } from '../../components';
import { colors, spacing } from '../../theme';

interface Props {
  total: number;
  loggedTotal: number;
  entryCount: number;
  onEdit: () => void;
  onRemove: () => void;
}

export function OverrideBanner({ total, loggedTotal, entryCount, onEdit, onRemove }: Props) {
  return (
    <Card tone="mint" style={styles.card} accessibilityLabel={`Daily total set manually to ${Math.round(total)} grams`}>
      <View style={styles.row}>
        <Icon name="sigma" size={18} color={colors.accentText} />
        <AppText variant="bodyStrong" style={styles.flex}>
          Total set manually · {Math.round(total)}g
        </AppText>
      </View>
      <AppText variant="caption" tone="secondary">
        {entryCount > 0
          ? `Your ${entryCount} logged ${entryCount === 1 ? 'entry adds' : 'entries add'} up to ${Math.round(loggedTotal)}g. They’re kept, but the total you set is what counts for this day.`
          : 'This replaces the calculated total for this day.'}
      </AppText>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onEdit} hitSlop={8}>
          <AppText variant="captionStrong" tone="accent">
            Edit total
          </AppText>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onRemove} hitSlop={8}>
          <AppText variant="captionStrong" tone="secondary">
            Use logged entries
          </AppText>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.sm },
});
