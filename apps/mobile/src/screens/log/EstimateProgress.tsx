import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Card, Icon, ProgressBar } from '../../components';
import { colors, spacing } from '../../theme';
import {
  ESTIMATE_EXPECTED_SECONDS,
  ESTIMATE_STEPS,
  estimateBarProgress,
  estimateStep,
} from './photoEstimateProgress';

export function EstimateProgress({
  status,
  runToken,
}: {
  status: 'uploading' | 'analyzing';
  runToken: number;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(0);
    const start = Date.now();
    const id = setInterval(() => setElapsed((Date.now() - start) / 1000), 80);
    return () => clearInterval(id);
  }, [runToken]);

  const step = estimateStep(status, elapsed);
  const progress = estimateBarProgress(status, elapsed);
  const seconds = Math.max(0, Math.floor(elapsed));

  return (
    <Card tone="mint" style={styles.card} accessibilityLabel={`Estimating. Step ${step + 1} of ${ESTIMATE_STEPS.length}. ${seconds} seconds elapsed.`}>
      <View style={styles.header}>
        <AppText variant="eyebrow" tone="accent">
          Working
        </AppText>
        <AppText variant="caption" tone="secondary">
          {seconds}s · usually about {ESTIMATE_EXPECTED_SECONDS}s
        </AppText>
      </View>
      <ProgressBar progress={progress} height={8} />
      <View style={styles.steps}>
        {ESTIMATE_STEPS.map((item, index) => {
          const done = index < step;
          const current = index === step;
          return (
            <View key={item.id} style={styles.step}>
              <View style={[styles.mark, done && styles.markDone, current && styles.markCurrent]}>
                {done ? <Icon name="check" size={12} color={colors.white} strokeWidth={2.6} /> : null}
              </View>
              <AppText variant={current ? 'captionStrong' : 'caption'} tone={current ? 'primary' : done ? 'secondary' : 'tertiary'}>
                {item.label}
                {current ? '…' : ''}
              </AppText>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  steps: { gap: spacing.sm },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mark: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  markCurrent: { borderColor: colors.accent, backgroundColor: colors.accentTintStrong },
});
