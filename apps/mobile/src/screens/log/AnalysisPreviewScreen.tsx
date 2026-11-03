import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { SheetHeader } from '../../components/Headers';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { colors, radii, spacing } from '../../theme';
import { MealAnalysisLoading } from './MealAnalysisLoading';
import { MealAnalysisResultReveal } from './MealAnalysisResultReveal';

type Scene = 'live' | 'wait8' | 'wait20' | 'reduce' | 'failed' | 'result';

const SCENES: { value: Scene; label: string }[] = [
  { value: 'live', label: 'Live' },
  { value: 'wait8', label: '8s' },
  { value: 'wait20', label: '20s' },
  { value: 'reduce', label: 'Reduce' },
  { value: 'failed', label: 'Failed' },
  { value: 'result', label: 'Result' },
];

/** Local SVG plate so the preview doesn’t need a camera or network photo. */
export const PREVIEW_MEAL_URI =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#E8EFE9"/>
      <ellipse cx="400" cy="318" rx="248" ry="228" fill="#DCE6DE"/>
      <ellipse cx="400" cy="308" rx="210" ry="192" fill="#F7F8F3"/>
      <ellipse cx="332" cy="278" rx="96" ry="72" fill="#C48A5A"/>
      <ellipse cx="328" cy="262" rx="70" ry="28" fill="#B07A4C"/>
      <ellipse cx="486" cy="292" rx="78" ry="58" fill="#6F9A55"/>
      <ellipse cx="508" cy="278" rx="34" ry="22" fill="#8FB56A"/>
      <ellipse cx="400" cy="382" rx="92" ry="44" fill="#F1E3C4"/>
      <ellipse cx="398" cy="374" rx="70" ry="18" fill="#E7D4A8"/>
    </svg>`,
  );

export function AnalysisPreviewScreen() {
  const [scene, setScene] = useState<Scene>('live');
  const analyzing = scene === 'live' || scene === 'wait8' || scene === 'wait20' || scene === 'reduce';
  const elapsed = scene === 'wait8' ? 8 : scene === 'wait20' ? 20 : scene === 'live' ? undefined : 0;

  return (
    <Screen>
      <AppText variant="h2" accessibilityRole="header" style={styles.title}>
        Photo analysis preview
      </AppText>
      <AppText variant="caption" tone="secondary" style={styles.sub}>
        Local mock of the AI photo wait. Buttons don’t analyze a real meal.
      </AppText>
      <View style={styles.scenes} accessibilityRole="radiogroup" accessibilityLabel="Preview state">
        {SCENES.map(option => {
          const selected = option.value === scene;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              onPress={() => setScene(option.value)}
              style={[styles.scene, selected && styles.sceneSelected]}
            >
              <AppText variant={selected ? 'captionStrong' : 'caption'} tone={selected ? 'accent' : 'secondary'}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.phone} accessibilityLabel="Analysis preview">
        <SheetHeader title="Log a Meal" onClose={() => undefined} />
        {scene === 'result' ? (
          <ResultPreview />
        ) : (
          <MealAnalysisLoading
            key={scene}
            uri={PREVIEW_MEAL_URI}
            analyzing={analyzing}
            previewElapsedSec={elapsed}
            previewReduceMotion={scene === 'reduce' ? true : scene === 'live' ? undefined : false}
            onCancel={analyzing ? () => setScene('failed') : undefined}
          />
        )}
        {scene === 'failed' ? (
          <>
            <Card style={styles.message}>
              <View style={styles.row}>
                <Icon name="cloudOff" size={18} color={colors.textSecondary} />
                <AppText variant="bodyStrong">Couldn’t analyze this meal.</AppText>
              </View>
              <AppText variant="caption" tone="secondary">
                Please try again or enter your protein manually.
              </AppText>
            </Card>
            <View style={styles.footer}>
              <Button label="Try again" variant="filled" onPress={() => setScene('live')} />
              <Button label="Enter protein manually" variant="ghost" onPress={() => undefined} />
            </View>
          </>
        ) : null}
      </View>
    </Screen>
  );
}

function ResultPreview() {
  return (
    <View>
      <View style={styles.photoCard}>
        <Image source={{ uri: PREVIEW_MEAL_URI }} style={styles.photo} resizeMode="contain" accessibilityLabel="Your meal photo" />
      </View>
      <MealAnalysisResultReveal key="result" totalG={42} style={styles.hero}>
        <AppText variant="eyebrow" tone="accent">
          Your protein estimate is ready.
        </AppText>
        <View style={styles.totalRow}>
          <AppText variant="hero" tone="secondary">
            ~
          </AppText>
          <AppText variant="hero">42</AppText>
          <AppText variant="h2" tone="secondary">
            g
          </AppText>
        </View>
        <AppText variant="caption" tone="secondary">
          Estimated from your meal
        </AppText>
      </MealAnalysisResultReveal>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm },
  sub: { marginTop: spacing.xs },
  scenes: { marginTop: spacing.lg, marginBottom: spacing.lg, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  scene: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    minHeight: 36,
    justifyContent: 'center',
  },
  sceneSelected: { backgroundColor: colors.accentTint },
  phone: {
    backgroundColor: colors.background,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    paddingBottom: spacing.lg,
    overflow: 'hidden',
  },
  message: { marginTop: spacing.lg, marginHorizontal: spacing.xl, gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  footer: { marginTop: spacing.lg, paddingHorizontal: spacing.xl, gap: spacing.sm },
  photoCard: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.xl,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photo: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.surface },
  hero: { marginTop: spacing.xl, marginHorizontal: spacing.xl, gap: spacing.xs },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
});
