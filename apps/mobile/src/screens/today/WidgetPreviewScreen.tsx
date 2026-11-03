import { rangeBarLayout } from '@jota/domain';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { BackLink } from '../../components/Headers';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { SegmentedControl } from '../../components/SegmentedControl';
import type { RootScreenProps } from '../../navigation/types';
import { colors, radii, spacing } from '../../theme';

type Scene = 'empty' | 'mid' | 'close' | 'hit' | 'over';

const MIN = 125;
const MAX = 170;

const SCENES: { value: Scene; label: string }[] = [
  { value: 'empty', label: '0g' },
  { value: 'mid', label: 'Mid' },
  { value: 'close', label: 'Close' },
  { value: 'hit', label: 'Hit' },
  { value: 'over', label: 'Over' },
];

function widgetCopy(total: number, min: number, max: number) {
  const reached = total >= min;
  const toGoal = reached ? 0 : Math.max(0, min - total);
  if (total <= 0) {
    return { headline: "LET'S GET STARTED", supporting: `0g today · Goal ${min}–${max}g`, celebrates: false };
  }
  if (reached && total > max) {
    return { headline: `${total}g TODAY ✓`, supporting: `Goal ${min}–${max}g`, celebrates: true };
  }
  if (reached) {
    return { headline: 'GOAL HIT ✓', supporting: `${total}g today · Goal ${min}–${max}g`, celebrates: true };
  }
  if (toGoal <= 10) {
    return { headline: 'ALMOST THERE!', supporting: `${toGoal}g left · ${total}g today · Goal ${min}–${max}g`, celebrates: false };
  }
  return { headline: `${toGoal}g LEFT`, supporting: `${total}g today · Goal ${min}–${max}g`, celebrates: false };
}

export function WidgetPreviewScreen({ navigation }: Partial<RootScreenProps<'WidgetPreview'>> = {}) {
  const [scene, setScene] = useState<Scene>('mid');
  const canGoBack = navigation?.canGoBack() ?? false;
  const total = useMemo(() => {
    if (scene === 'empty') return 0;
    if (scene === 'mid') return Math.round(MIN * 0.68);
    if (scene === 'close') return MIN - 8;
    if (scene === 'hit') return MIN;
    return MAX + 10;
  }, [scene]);
  const copy = widgetCopy(total, MIN, MAX);

  return (
    <Screen>
      {canGoBack && navigation ? <BackLink label="Profile" onPress={navigation.goBack} /> : null}
      <AppText variant="h2" accessibilityRole="header" style={styles.title}>
        Widget preview
      </AppText>
      <AppText variant="caption" tone="secondary" style={styles.sub}>
        Dark-green Home Screen widget and Lock Screen Live Activity. Buttons don’t log.
      </AppText>
      <SegmentedControl options={SCENES} value={scene} onChange={setScene} size="compact" style={styles.scenes} accessibilityLabel="Preview state" />

      <AppText variant="eyebrow" tone="tertiary" style={styles.label}>
        Lock Screen · Live Activity
      </AppText>
      <View style={styles.phone} accessibilityLabel={`${copy.headline}. ${copy.supporting}`}>
        <AppText variant="caption" tone="onHeroMuted" align="center">
          Saturday  12:46
        </AppText>
        <WidgetCard copy={copy} total={total} min={MIN} max={MAX} />
      </View>

      <AppText variant="eyebrow" tone="tertiary" style={styles.label}>
        Home Screen · Medium
      </AppText>
      <WidgetCard copy={copy} total={total} min={MIN} max={MAX} home />
    </Screen>
  );
}

function WidgetCard({
  copy,
  total,
  min,
  max,
  home,
}: {
  copy: ReturnType<typeof widgetCopy>;
  total: number;
  min: number;
  max: number;
  home?: boolean;
}) {
  return (
    <View style={[styles.card, home && styles.cardHome]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="h2" tone={copy.celebrates ? 'lime' : 'onHero'} numberOfLines={1} style={styles.headline}>
            {copy.headline}
          </AppText>
          <AppText variant="caption" tone="onHeroMuted" numberOfLines={1}>
            {copy.supporting}
          </AppText>
        </View>
        <View style={styles.camera} accessibilityLabel="Snap meal">
          <Icon name="camera" size={18} color={colors.hero} />
        </View>
      </View>
      <PreviewBar total={total} min={min} max={max} />
      <View style={styles.actions}>
        <PreviewChip label="+20g" filled />
        <PreviewChip label="+30g" filled />
        <PreviewChip label="Custom +" />
      </View>
    </View>
  );
}

function PreviewBar({ total, min, max }: { total: number; min: number; max: number }) {
  const [width, setWidth] = useState(0);
  const layout = useMemo(() => rangeBarLayout(total, { min, max }), [max, min, total]);
  return (
    <View style={styles.barHit} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      <View style={styles.track} />
      {width > 0 ? (
        <>
          <View
            style={[
              styles.zone,
              { left: layout.minStart * width, width: Math.max(4, (layout.maxEnd - layout.minStart) * width) },
            ]}
          />
          {total > 0 ? <View style={[styles.fill, { width: Math.max(6, layout.current * width) }]} /> : null}
          <View style={[styles.tick, { left: layout.minStart * width }]} />
          <View style={[styles.tick, { left: layout.maxEnd * width }]} />
        </>
      ) : null}
    </View>
  );
}

function PreviewChip({ label, filled }: { label: string; filled?: boolean }) {
  return (
    <Pressable style={[styles.chip, filled ? styles.chipFilled : styles.chipGhost]} disabled>
      <AppText variant="captionStrong" style={{ color: filled ? colors.textOnLime : colors.textOnHero }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm },
  sub: { marginTop: spacing.xs },
  scenes: { marginTop: spacing.lg },
  label: { marginTop: spacing.xl, marginBottom: spacing.sm },
  phone: {
    backgroundColor: colors.heroSurface,
    borderRadius: 28,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.hero,
    borderRadius: 28,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHome: {
    minHeight: 168,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerText: { flex: 1, gap: 3 },
  headline: { letterSpacing: -0.4 },
  camera: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barHit: { height: 14, justifyContent: 'center' },
  track: { height: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.14)' },
  zone: {
    position: 'absolute',
    height: 8,
    borderRadius: 8,
    backgroundColor: colors.lime,
    opacity: 0.28,
  },
  fill: { position: 'absolute', height: 8, borderRadius: 8, backgroundColor: colors.lime, left: 0 },
  tick: { position: 'absolute', width: 2, height: 12, borderRadius: 1, backgroundColor: colors.lime, top: 1 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    flex: 1,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipFilled: { backgroundColor: colors.lime },
  chipGhost: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(247,248,243,0.28)',
  },
});
