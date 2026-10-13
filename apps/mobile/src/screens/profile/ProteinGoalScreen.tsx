import { previewRecalculatedRange, validateProteinRange, type ProteinRange } from '@steady/domain';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, BackLink, Button, Card, Chip, ConfirmSheet, Screen, showToast } from '../../components';
import { RangeEditor } from '../../components/RangeEditor';
import { confirmRecalculatedRange, saveManualRange, toGoalSettings } from '../../features/profile/actions';
import type { RootScreenProps } from '../../navigation/types';
import { useAppStore } from '../../state/appStore';
import { spacing } from '../../theme';
import { rangeLabel } from '../../utils/format';

export function ProteinGoalScreen({ navigation }: RootScreenProps<'ProteinGoal'>) {
  const profile = useAppStore(s => s.profile);
  const current: ProteinRange = { min: profile?.protein_goal_min ?? 0, max: profile?.protein_goal_max ?? 0 };
  const [draft, setDraft] = useState<ProteinRange>(current);
  const [previewOpen, setPreviewOpen] = useState(false);

  const preview = useMemo(() => {
    if (!profile?.weight_value) return null;
    try {
      return previewRecalculatedRange(toGoalSettings(profile));
    } catch {
      return null;
    }
  }, [profile]);

  if (!profile) return null;
  const dirty = draft.min !== current.min || draft.max !== current.max;
  const valid = validateProteinRange(draft.min, draft.max).ok;

  const save = () => {
    saveManualRange(draft);
    showToast(`Goal set to ${rangeLabel(draft)} per day`);
    navigation.goBack();
  };

  const applyPreview = () => {
    confirmRecalculatedRange();
    setPreviewOpen(false);
    if (preview) {
      setDraft({ min: preview.min, max: preview.max });
      showToast(`Goal set to ${rangeLabel(preview)} per day`);
    }
  };

  return (
    <Screen keyboard footer={dirty ? <Button label="Save goal" onPress={save} disabled={!valid} /> : undefined}>
      <BackLink label="Profile" onPress={navigation.goBack} />
      <AppText variant="title" accessibilityRole="header" style={styles.title}>
        Protein goal
      </AppText>

      <Card tone="mint" style={styles.card}>
        <View style={styles.cardTop}>
          <AppText variant="eyebrow" tone="accent">
            Current range
          </AppText>
          <Chip label={profile.protein_goal_is_custom ? 'Custom' : 'Suggested'} tone="neutral" />
        </View>
        <AppText variant="hero">{rangeLabel(current)}</AppText>
        <AppText variant="body" tone="secondary">
          per day · goal reached at {current.min}g
        </AppText>
      </Card>

      <AppText variant="body" tone="secondary" style={styles.copy}>
        Your suggested range is based on your body weight. You can adjust it anytime.
      </AppText>

      <RangeEditor range={draft} onChange={setDraft} />

      {preview ? (
        <Pressable accessibilityRole="button" onPress={() => setPreviewOpen(true)} style={styles.link} testID="recalculate">
          <AppText variant="bodyStrong" tone="accent" align="center">
            Recalculate from body weight
          </AppText>
        </Pressable>
      ) : null}

      <ConfirmSheet
        visible={previewOpen && !!preview}
        title="Recalculate your range?"
        message={
          preview
            ? `Based on ${profile.weight_value} ${profile.weight_unit}, your suggested range is ${rangeLabel(preview)}/day. This replaces your current ${rangeLabel(current)} range.`
            : undefined
        }
        onDismiss={() => setPreviewOpen(false)}
        actions={[
          { label: preview ? `Use ${rangeLabel(preview)}` : 'Use suggested range', onPress: applyPreview },
          { label: 'Keep current range', onPress: () => setPreviewOpen(false), variant: 'ghost' },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm },
  card: { marginTop: spacing.xl, gap: spacing.xs },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  copy: { marginTop: spacing.lg, marginBottom: spacing.md },
  link: { paddingVertical: spacing.lg },
});
