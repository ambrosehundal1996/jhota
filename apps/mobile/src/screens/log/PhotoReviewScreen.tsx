import type { AiConfidence, UncertaintyReason } from '@jota/domain';
import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText, Button, Card, ConfirmSheet, Icon, IconButton, Screen, SheetHeader, showToast } from '../../components';
import {
  addDraftItem,
  confirmDraft,
  discardDraft,
  draftTotal,
  isDraftEdited,
  itemConfidenceTag,
  removeDraftItem,
  rescaleDraftTotal,
  updateDraftItem,
} from '../../features/ai/draft';
import { analytics } from '../../analytics';
import { undoLogs } from '../../features/logging/actions';
import { useLocalToday } from '../../hooks/useLocalToday';
import type { LogScreenProps } from '../../navigation/types';
import { useAppStore } from '../../state/appStore';
import type { AiDraftItem } from '../../types/models';
import { colors, radii, spacing, typography } from '../../theme';
import { formatShortDay, trimNumber } from '../../utils/format';
import { closeLog } from './useLogContext';

const LEVEL_LABEL: Record<AiConfidence, string> = { high: 'High', medium: 'Medium', low: 'Low' };

const REASON_LABEL: Record<UncertaintyReason, string> = {
  unclear_food_identity: 'hard to tell exactly what this is',
  uncertain_portion: 'portion is estimated from the photo',
  hidden_ingredients: 'some ingredients may be hidden',
  uncertain_preparation: 'preparation is unclear',
  variable_nutrition: 'protein varies by recipe or brand',
  poor_image_quality: 'photo is hard to read',
  conflicting_context: 'your note and the photo don’t match',
};

function tagLabel(item: AiDraftItem): string | null {
  const tag = itemConfidenceTag(item);
  if (tag === 'user_adjusted') return 'User adjusted';
  if (tag === 'user_added') return 'Added by you';
  if (tag === 'medium' || tag === 'low') return `${LEVEL_LABEL[tag]} confidence`;
  return null;
}

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
        {item.portion || tagLabel(item) ? (
          <AppText variant="caption" tone="tertiary">
            {[item.portion, tagLabel(item)].filter(Boolean).join(' · ')}
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
  const [detailsOpen, setDetailsOpen] = useState(false);
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
  const confidence = draft.overallConfidence ?? null;
  const edited = isDraftEdited(draft);
  const reviewNotes = confidence === 'medium' || confidence === 'low' ? (draft.reviewNotes ?? []) : [];
  const ratedItems = items.filter(i => i.original_protein_g !== null && i.confidence);

  const toggleDetails = () => {
    if (!detailsOpen) analytics.track('ai_confidence_details_opened', { overall_confidence: confidence, edited });
    setDetailsOpen(open => !open);
  };

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
          {confidence ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: detailsOpen }}
              accessibilityLabel={`${edited ? 'AI confidence' : 'Confidence'}: ${LEVEL_LABEL[confidence]}. Show details`}
              onPress={toggleDetails}
              hitSlop={8}
              style={styles.confidence}
              testID="confidence-toggle"
            >
              <AppText variant="caption" tone="secondary">
                {edited ? `AI confidence: ${LEVEL_LABEL[confidence]} · adjusted by you` : `Confidence: ${LEVEL_LABEL[confidence]}`}
              </AppText>
              <Icon name="info" size={14} color={colors.textTertiary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {detailsOpen && confidence ? (
        <Card style={styles.details} testID="confidence-details">
          <AppText variant="caption" tone="secondary">
            This is the AI’s own rating of its original estimate, based on how clear the food, portion and ingredients
            are. It isn’t a measured accuracy.
          </AppText>
          {ratedItems.map(item => {
            const reasons = (item.uncertainty_reasons ?? []).map(r => REASON_LABEL[r]);
            const adjusted = itemConfidenceTag(item) === 'user_adjusted';
            return (
              <View key={item.key} style={styles.detailRow}>
                <AppText variant="captionStrong">{item.original_name ?? item.name}</AppText>
                <AppText variant="caption" tone="tertiary">
                  {[`${LEVEL_LABEL[item.confidence!]} confidence`, ...reasons, adjusted ? 'since adjusted by you' : null]
                    .filter(Boolean)
                    .join(' · ')}
                </AppText>
              </View>
            );
          })}
        </Card>
      ) : null}

      <AppText variant="caption" tone="secondary" style={styles.disclaimer}>
        {confidence === 'low' && !edited
          ? 'We’re less certain about this estimate. Please review before saving.'
          : 'AI estimates can be off. Adjust anything that doesn’t look right before adding.'}
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

      {reviewNotes.length ? (
        <View style={styles.notes}>
          {reviewNotes.map(note => (
            <AppText key={note} variant="caption" tone="tertiary">
              {note}
            </AppText>
          ))}
        </View>
      ) : null}

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
  notes: { marginTop: spacing.md, gap: spacing.xs },
  confidence: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2, alignSelf: 'flex-start' },
  details: { marginTop: spacing.md, gap: spacing.sm },
  detailRow: { gap: 2 },
});
