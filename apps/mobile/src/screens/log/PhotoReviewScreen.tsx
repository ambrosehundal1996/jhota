import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText, Button, Card, ConfirmSheet, Icon, IconButton, MealSelector, Screen, SheetHeader, showToast } from '../../components';
import {
  addDraftItem,
  confirmDraft,
  discardDraft,
  draftTotal,
  removeDraftItem,
  rescaleDraftTotal,
  setDraftMeal,
  updateDraftItem,
} from '../../features/ai/draft';
import { undoLogs } from '../../features/logging/actions';
import { useLocalToday } from '../../hooks/useLocalToday';
import type { LogScreenProps } from '../../navigation/types';
import { useAppStore } from '../../state/appStore';
import type { AiDraftItem } from '../../types/models';
import { colors, radii, spacing, typography } from '../../theme';
import { formatShortDay, trimNumber } from '../../utils/format';
import { closeLog } from './useLogContext';

const parse = (text: string) => {
  const n = Number(text.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 500) : 0;
};

function ItemRow({ item, canRemove }: { item: AiDraftItem; canRemove: boolean }) {
  const [protein, setProtein] = useState(trimNumber(item.protein_g));
  useEffect(() => setProtein(trimNumber(item.protein_g)), [item.protein_g]);
  return (
    <View style={styles.item}>
      <View style={styles.itemText}>
        <TextInput
          value={item.name}
          onChangeText={name => updateDraftItem(item.key, { name })}
          placeholder="Item name"
          placeholderTextColor={colors.textTertiary}
          style={styles.itemName}
          accessibilityLabel="Item name"
          maxLength={80}
        />
        {item.portion ? (
          <AppText variant="caption" tone="tertiary">
            {item.portion}
          </AppText>
        ) : null}
      </View>
      <View style={styles.gramsBox}>
        <TextInput
          value={protein}
          onChangeText={t => setProtein(t.replace(/[^0-9.]/g, ''))}
          onEndEditing={() => updateDraftItem(item.key, { protein_g: parse(protein) })}
          keyboardType="decimal-pad"
          style={styles.grams}
          selectTextOnFocus
          accessibilityLabel={`Protein for ${item.name || 'item'}, grams`}
        />
        <AppText variant="caption" tone="secondary">
          g
        </AppText>
      </View>
      {canRemove ? (
        <IconButton icon="close" tone="plain" size={32} accessibilityLabel={`Remove ${item.name || 'item'}`} onPress={() => removeDraftItem(item.key)} />
      ) : null}
    </View>
  );
}

export function PhotoReviewScreen({ navigation }: LogScreenProps<'PhotoReview'>) {
  const draft = useAppStore(s => s.aiDraft);
  const today = useLocalToday();
  const [totalText, setTotalText] = useState('');
  const [editingTotal, setEditingTotal] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const leaving = useRef(false);

  const items = draft?.items ?? [];
  const total = draftTotal(items);

  useEffect(() => {
    if (!editingTotal) setTotalText(trimNumber(total));
  }, [total, editingTotal]);

  useEffect(() => {
    if (!leaving.current && (!draft || draft.status !== 'ready')) navigation.goBack();
  }, [draft, navigation]);
  if (!draft || draft.status !== 'ready') return null;

  const isToday = draft.date === today;

  const confirm = () => {
    leaving.current = true;
    const logs = confirmDraft();
    if (!logs.length) {
      leaving.current = false;
      showToast('Add at least one item with protein.');
      return;
    }
    const sum = Math.round(logs.reduce((s, l) => s + l.protein_g, 0));
    showToast(`Added ${sum}g from your photo`, { label: 'Undo', onPress: () => undoLogs(logs.map(l => l.id)) });
    closeLog(navigation);
  };

  const discard = () => {
    leaving.current = true;
    setConfirmDiscard(false);
    discardDraft();
    closeLog(navigation);
  };

  return (
    <Screen
      keyboard
      footer={
        <Button
          label={`Add to ${isToday ? 'today' : formatShortDay(draft.date)} · ${Math.round(total)}g`}
          variant="filled"
          onPress={confirm}
          disabled={total <= 0}
          testID="confirm-estimate"
        />
      }
    >
      <SheetHeader title="Review estimate" onClose={() => setConfirmDiscard(true)} />

      <View style={styles.top}>
        {draft.photoUri ? <Image source={{ uri: draft.photoUri }} style={styles.thumb} accessibilityIgnoresInvertColors /> : null}
        <View style={styles.flex}>
          <AppText variant="eyebrow" tone="accent">
            Estimated protein
          </AppText>
          <View style={styles.totalRow}>
            <TextInput
              value={totalText}
              onFocus={() => setEditingTotal(true)}
              onChangeText={t => setTotalText(t.replace(/[^0-9.]/g, ''))}
              onEndEditing={() => {
                setEditingTotal(false);
                const next = parse(totalText);
                if (Math.round(next * 10) !== Math.round(total * 10)) rescaleDraftTotal(next);
              }}
              keyboardType="decimal-pad"
              style={styles.total}
              selectTextOnFocus
              accessibilityLabel="Estimated total protein in grams. Editing rescales the items."
              testID="estimate-total"
            />
            <AppText variant="h2" tone="secondary">
              g
            </AppText>
            <Icon name="edit" size={16} color={colors.textTertiary} />
          </View>
        </View>
      </View>

      <AppText variant="caption" tone="secondary" style={styles.disclaimer}>
        AI estimates can be off. Adjust anything that doesn’t look right before adding.
      </AppText>

      <Card style={styles.items}>
        {items.map(item => (
          <ItemRow key={item.key} item={item} canRemove={items.length > 1} />
        ))}
        <Pressable accessibilityRole="button" onPress={addDraftItem} style={styles.addItem}>
          <Icon name="plus" size={16} color={colors.accentText} />
          <AppText variant="bodyStrong" tone="accent">
            Add item
          </AppText>
        </Pressable>
      </Card>

      {draft.notes ? (
        <AppText variant="caption" tone="tertiary" style={styles.notes}>
          {draft.notes}
        </AppText>
      ) : null}

      <AppText variant="bodyStrong" style={styles.label}>
        Meal
      </AppText>
      <MealSelector value={draft.meal} onChange={setDraftMeal} />

      <ConfirmSheet
        visible={confirmDiscard}
        title="Discard this estimate?"
        message="Nothing will be logged."
        onDismiss={() => setConfirmDiscard(false)}
        actions={[
          { label: 'Discard', onPress: discard, variant: 'destructive' },
          { label: 'Keep reviewing', onPress: () => setConfirmDiscard(false), variant: 'ghost' },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.sm },
  thumb: { width: 84, height: 84, borderRadius: radii.md, backgroundColor: colors.surface },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  total: { ...typography.hero, color: colors.text, minWidth: 60, padding: 0 },
  disclaimer: { marginTop: spacing.md },
  items: { marginTop: spacing.lg, paddingVertical: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderStrong,
  },
  itemText: { flex: 1, gap: 2 },
  itemName: { ...typography.bodyStrong, color: colors.text, padding: 0 },
  gramsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    minWidth: 64,
  },
  grams: { ...typography.numberSmall, color: colors.text, paddingVertical: spacing.xs, minWidth: 32, textAlign: 'right' },
  addItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md },
  notes: { marginTop: spacing.md },
  label: { marginTop: spacing.xl, marginBottom: spacing.sm },
});
