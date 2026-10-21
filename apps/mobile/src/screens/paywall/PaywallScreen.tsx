import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { analytics } from '../../analytics';
import { AppText, Button, Icon, Screen, showToast } from '../../components';
import { Wordmark } from '../../components/Brand';
import { appConfig } from '../../config';
import { applySubscriptionStatus, subscriptions, type PaywallPackage } from '../../services/subscriptions';
import { getState, LOCAL_USER_ID, setState, useAppStore } from '../../state/appStore';
import { colors, radii, spacing } from '../../theme';

const BENEFITS = [
  'Your daily protein ring and goal range',
  'AI photo estimates you can review and edit',
  'Lock Screen widgets and gentle reminders',
  'Weekly progress, streaks, and history',
];

type LoadState = 'loading' | 'ready' | 'error';

export function PaywallScreen() {
  const expired = useAppStore(s => !!s.subscription?.hasExpired);
  const [packages, setPackages] = useState<PaywallPackage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [load, setLoad] = useState<LoadState>('loading');
  const [busy, setBusy] = useState<'purchase' | 'restore' | null>(null);

  const loadPackages = useCallback(async () => {
    setLoad('loading');
    try {
      const { userId } = getState();
      await subscriptions.configure(userId === LOCAL_USER_ID ? '' : userId);
      const found = await subscriptions.getPackages();
      setPackages(found);
      setSelectedId(found[0]?.id ?? null);
      setLoad(found.length ? 'ready' : 'error');
    } catch {
      setLoad('error');
    }
  }, []);

  useEffect(() => {
    analytics.track('paywall_viewed', { expired });
    void loadPackages();
  }, [loadPackages, expired]);

  const selected = packages.find(p => p.id === selectedId) ?? null;
  // Lapsed subscribers are generally not eligible for another introductory offer.
  const intro = !expired ? selected?.introOffer ?? null : null;

  const purchase = async () => {
    if (!selected) return;
    setBusy('purchase');
    try {
      const result = await subscriptions.purchase(selected.id);
      applySubscriptionStatus(result.status);
    } catch (error) {
      Alert.alert('Purchase didn’t go through', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const restore = async () => {
    setBusy('restore');
    try {
      const status = await subscriptions.restore();
      applySubscriptionStatus(status);
      analytics.track('purchases_restored', { active: !!status?.isActive });
      if (!status?.isActive) showToast('No active subscription found for this Apple ID.');
    } catch {
      Alert.alert('Restore failed', 'Please check your connection and try again.');
    } finally {
      setBusy(null);
    }
  };

  const terms = selected
    ? intro
      ? `${intro}, then ${selected.priceString}/${selected.period === 'annual' ? 'year' : 'month'}. Cancel anytime in Settings.`
      : `${selected.priceString}/${selected.period === 'annual' ? 'year' : 'month'}. Renews automatically. Cancel anytime in Settings.`
    : '';

  return (
    <Screen
      footer={
        <>
          <Button
            label={intro ? 'Start free trial' : 'Continue'}
            variant="filled"
            onPress={purchase}
            loading={busy === 'purchase'}
            disabled={!selected || !!busy}
            testID="paywall-purchase"
          />
          {terms ? (
            <AppText variant="caption" tone="tertiary" align="center">
              {terms}
            </AppText>
          ) : null}
          <View style={styles.links}>
            <Pressable accessibilityRole="button" onPress={restore} disabled={!!busy} hitSlop={8}>
              <AppText variant="captionStrong" tone="secondary">
                {busy === 'restore' ? 'Restoring…' : 'Restore purchases'}
              </AppText>
            </Pressable>
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(appConfig.termsUrl)} hitSlop={8}>
              <AppText variant="caption" tone="tertiary">
                Terms
              </AppText>
            </Pressable>
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(appConfig.privacyUrl)} hitSlop={8}>
              <AppText variant="caption" tone="tertiary">
                Privacy
              </AppText>
            </Pressable>
          </View>
          {__DEV__ ? (
            <Button
              label="Skip paywall (dev only)"
              variant="ghost"
              size="small"
              onPress={() => setState(s => ({ flags: { ...s.flags, devBypassPaywall: true } }))}
            />
          ) : null}
        </>
      }
    >
      <View style={styles.header}>
        <Wordmark />
      </View>
      <AppText variant="title" accessibilityRole="header" style={styles.title}>
        {expired ? 'Welcome back' : intro ? `Try Jota free for ${intro.replace(/ free$/, '')}` : 'Make protein a daily habit'}
      </AppText>
      <AppText variant="body" tone="secondary" style={styles.sub}>
        {expired
          ? 'Your subscription has ended. Everything you logged is safe. Subscribe to keep tracking.'
          : 'Hit your protein goal without tracking your entire diet.'}
      </AppText>

      <View style={styles.benefits}>
        {BENEFITS.map(b => (
          <View key={b} style={styles.benefit}>
            <View style={styles.check}>
              <Icon name="check" size={14} color={colors.accentText} strokeWidth={2.6} />
            </View>
            <AppText variant="body" style={styles.flex}>
              {b}
            </AppText>
          </View>
        ))}
      </View>

      {load === 'loading' ? (
        <ActivityIndicator color={colors.accent} style={styles.loading} />
      ) : load === 'error' ? (
        <View style={styles.error}>
          <AppText variant="bodyStrong" align="center">
            Plans couldn’t load
          </AppText>
          <AppText variant="caption" tone="secondary" align="center">
            Check your connection and try again.
          </AppText>
          <Button label="Try again" variant="secondary" size="medium" onPress={() => void loadPackages()} />
        </View>
      ) : (
        <View style={styles.plans} accessibilityRole="radiogroup">
          {packages.map(pkg => {
            const isSelected = pkg.id === selectedId;
            return (
              <Pressable
                key={pkg.id}
                onPress={() => setSelectedId(pkg.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                style={[styles.plan, isSelected && styles.planSelected]}
              >
                <View style={[styles.radio, isSelected && styles.radioOn]}>
                  {isSelected ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={styles.flex}>
                  <View style={styles.planTitleRow}>
                    <AppText variant="bodyStrong">{pkg.title}</AppText>
                    {pkg.period === 'annual' && packages.length > 1 ? (
                      <View style={styles.badge}>
                        <AppText variant="captionStrong" tone="accent">
                          Best value
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                  <AppText variant="caption" tone="secondary">
                    {pkg.pricePerMonthString ? `${pkg.pricePerMonthString}/mo, billed yearly` : `${pkg.priceString} per month`}
                  </AppText>
                </View>
                <AppText variant="bodyStrong">{pkg.priceString}</AppText>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingTop: spacing.lg },
  title: { marginTop: spacing.xxl },
  sub: { marginTop: spacing.sm },
  benefits: { gap: spacing.md, marginTop: spacing.xl },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: { marginTop: spacing.xxl },
  error: { marginTop: spacing.xl, gap: spacing.sm },
  plans: { gap: spacing.md, marginTop: spacing.xl },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  planSelected: { borderColor: colors.accent, backgroundColor: colors.accentTint },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: { backgroundColor: colors.surfaceRaised, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  links: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, paddingVertical: spacing.xs },
});
