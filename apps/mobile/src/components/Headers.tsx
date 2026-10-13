import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, hitSlop, radii, spacing } from '../theme';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

/** Onboarding header: circular back button, segmented progress, "1 of 3". */
export function StepHeader({ step, total, onBack }: { step: number; total: number; onBack?: () => void }) {
  return (
    <View style={styles.stepRow}>
      {onBack ? <IconButton icon="back" accessibilityLabel="Back" onPress={onBack} size={38} /> : <View style={{ width: 38 }} />}
      <View style={styles.segments} accessibilityLabel={`Step ${step} of ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.segment, i < step && styles.segmentActive]} />
        ))}
      </View>
      <AppText variant="caption" tone="tertiary">
        {step} of {total}
      </AppText>
    </View>
  );
}

/** Modal sheet header: title on the left, close on the right. */
export function SheetHeader({ title, onClose, left }: { title: string; onClose?: () => void; left?: React.ReactNode }) {
  return (
    <View style={styles.sheetRow}>
      {left}
      <AppText variant="h2" style={styles.flex} accessibilityRole="header">
        {title}
      </AppText>
      {onClose ? <IconButton icon="close" accessibilityLabel="Close" onPress={onClose} size={34} tone="surface" /> : null}
    </View>
  );
}

/** Pushed-screen back link, e.g. "‹ Progress". */
export function BackLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Back to ${label}`} hitSlop={hitSlop} onPress={onPress} style={styles.backLink}>
      <Icon name="chevronLeft" size={18} color={colors.accentText} strokeWidth={2.2} />
      <AppText variant="bodyStrong" tone="accent">
        {label}
      </AppText>
    </Pressable>
  );
}

export function SectionLabel({ children, right }: { children: string; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <AppText variant="eyebrow" tone="tertiary" accessibilityRole="header">
        {children}
      </AppText>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xl },
  segments: { flex: 1, flexDirection: 'row', gap: spacing.sm },
  segment: { flex: 1, height: 3, borderRadius: radii.pill, backgroundColor: colors.track },
  segmentActive: { backgroundColor: colors.accent },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.md },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: spacing.sm, alignSelf: 'flex-start' },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
});
