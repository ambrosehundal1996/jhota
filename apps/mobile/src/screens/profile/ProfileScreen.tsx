import { useNavigation } from '@react-navigation/native';
import type { WeightUnit } from '@jota/domain';
import React, { useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { AppText, ListGroup, ListRow, Screen, SectionLabel, SegmentedControl, showToast } from '../../components';
import { appConfig } from '../../config';
import { goalTitle } from '../../features/goalTypes';
import { setDisplayName, setWeightUnit, updateNotificationPrefs } from '../../features/profile/actions';
import { requestPermission, getPermissionStatus, remindersSupported } from '../../services/notifications/reminders';
import { applySubscriptionStatus, subscriptions } from '../../services/subscriptions';
import { AppleSignInCancelled, continueWithApple, isAppleSignInAvailable } from '../../services/supabase/auth';
import { syncNow } from '../../services/sync/syncEngine';
import { setState, useAppStore } from '../../state/appStore';
import { colors, spacing } from '../../theme';
import { initials, rangeLabel } from '../../utils/format';
import { analytics } from '../../analytics';

const UNIT_OPTIONS = [
  { value: 'lb', label: 'lb' },
  { value: 'kg', label: 'kg' },
] as const;

function memberSince(createdAt: string | undefined): string {
  if (!createdAt) return 'Getting started';
  return `Logging since ${new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
}

function subscriptionLabel(sub: ReturnType<typeof useAppStore.getState>['subscription']): string {
  if (!sub) return 'Checking…';
  const date = sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;
  if (sub.isActive && sub.isTrial) return date ? `Free trial · ends ${date}` : 'Free trial';
  if (sub.isActive) return sub.willRenew === false && date ? `Active · ends ${date}` : 'Active';
  return sub.hasExpired ? 'Expired' : 'Not subscribed';
}

export function ProfileScreen() {
  const navigation = useNavigation();
  const profile = useAppStore(s => s.profile);
  const prefs = useAppStore(s => s.notificationPrefs);
  const subscription = useAppStore(s => s.subscription);
  const appleLinked = useAppStore(s => s.appleLinked);
  const [busy, setBusy] = useState<string | null>(null);

  if (!profile) return null;
  const billing = subscriptions.isConfigured();
  const range = { min: profile.protein_goal_min ?? 0, max: profile.protein_goal_max ?? 0 };

  const toggleNotifications = async (enabled: boolean) => {
    if (enabled && (await getPermissionStatus()) !== 'granted') {
      const result = await requestPermission();
      if (result !== 'granted') {
        Alert.alert('Notifications are off', 'Turn on notifications for Jota in Settings to get reminders.', [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]);
        return;
      }
    }
    updateNotificationPrefs({ enabled });
  };

  const linkApple = async () => {
    setBusy('apple');
    try {
      const result = await continueWithApple();
      if (result.fullName) setDisplayName(result.fullName);
      await syncNow();
      showToast(result.switchedAccount ? 'Signed in. Your data is merged.' : 'Your data is now backed up.');
    } catch (error) {
      if (!(error instanceof AppleSignInCancelled)) Alert.alert('Couldn’t sign in', 'Please try again.');
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
      showToast(status?.isActive ? 'Purchases restored.' : 'No active subscription found.');
    } catch {
      Alert.alert('Restore failed', 'Please check your connection and try again.');
    } finally {
      setBusy(null);
    }
  };

  const name = profile.display_name;

  return (
    <Screen edges={['top']}>
      <AppText variant="title" accessibilityRole="header" style={styles.title}>
        Profile
      </AppText>
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <AppText variant="bodyStrong" tone="secondary">
            {initials(name) || 'You'}
          </AppText>
        </View>
        <View style={styles.identityText}>
          <AppText variant="h3">{name || 'Your plan'}</AppText>
          <AppText variant="caption" tone="tertiary">
            {memberSince(profile.created_at)}
          </AppText>
        </View>
      </View>

      <SectionLabel>Your plan</SectionLabel>
      <ListGroup>
        <ListRow
          title="Daily protein goal"
          subtitle={profile.protein_goal_is_custom ? 'Custom range' : 'Suggested from body weight'}
          value={rangeLabel(range)}
          valueTone="accent"
          onPress={() => navigation.navigate('ProteinGoal')}
        />
        <ListRow title="Primary goal" value={goalTitle(profile.goal_type)} onPress={() => navigation.navigate('GoalTypeSettings')} />
        <ListRow
          title="Body weight"
          value={profile.weight_value ? `${profile.weight_value} ${profile.weight_unit}` : 'Not set'}
          onPress={() => navigation.navigate('BodyWeight')}
          last
        />
      </ListGroup>

      <SectionLabel>Preferences</SectionLabel>
      <ListGroup>
        <ListRow
          title="Units"
          right={
            <SegmentedControl
              size="compact"
              options={UNIT_OPTIONS}
              value={profile.weight_unit}
              onChange={(u: WeightUnit) => setWeightUnit(u)}
              accessibilityLabel="Weight units"
            />
          }
          last={!remindersSupported}
        />
        {remindersSupported ? (
          <>
            <ListRow
              title="Notifications"
              subtitle="A gentle nudge at 2 PM if nothing’s logged"
              toggle={{ value: prefs.enabled, onChange: toggleNotifications }}
            />
            <ListRow title="Reminder settings" onPress={() => navigation.navigate('NotificationSettings')} last />
          </>
        ) : null}
      </ListGroup>

      {billing ? (
        <>
          <SectionLabel>Subscription</SectionLabel>
          <ListGroup>
            <ListRow title="Jota" value={subscriptionLabel(subscription)} />
            <ListRow title={busy === 'restore' ? 'Restoring…' : 'Restore purchases'} onPress={restore} />
            <ListRow title="Manage subscription" onPress={() => Linking.openURL(subscriptions.manageSubscriptionsUrl())} last />
          </ListGroup>
        </>
      ) : null}

      <SectionLabel>Account</SectionLabel>
      <ListGroup>
        {appleLinked ? (
          <ListRow title="Signed in with Apple" subtitle="Your data is backed up" />
        ) : isAppleSignInAvailable() ? (
          <ListRow
            title={busy === 'apple' ? 'Signing in…' : 'Sign in with Apple'}
            subtitle="Back up your data and use it on a new phone"
            onPress={linkApple}
          />
        ) : null}
        <ListRow title="Help & feedback" onPress={() => Linking.openURL(`mailto:${appConfig.supportEmail}?subject=Jota%20feedback`)} />
        <ListRow title="Privacy policy" onPress={() => Linking.openURL(appConfig.privacyUrl)} />
        <ListRow title="Terms of use" onPress={() => Linking.openURL(appConfig.termsUrl)} />
        <ListRow
          title="Food data sources"
          onPress={() =>
            Alert.alert(
              'Food data',
              'Food search uses USDA FoodData Central (public domain). Barcode data comes from Open Food Facts (ODbL), a community database. AI photo estimates are approximate.',
            )
          }
          last
        />
      </ListGroup>

      {__DEV__ && billing ? (
        <>
          <SectionLabel>Developer</SectionLabel>
          <ListGroup>
            <ListRow
              title="Bypass paywall"
              toggle={{ value: useAppStore.getState().flags.devBypassPaywall, onChange: v => setState(s => ({ flags: { ...s.flags, devBypassPaywall: v } })) }}
              last
            />
          </ListGroup>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.xl },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: { gap: 2 },
});
