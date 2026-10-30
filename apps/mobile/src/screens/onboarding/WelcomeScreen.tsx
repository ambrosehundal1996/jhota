import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { analytics } from '../../analytics';
import { AppText, Button, Screen, showToast } from '../../components';
import { HeroRing, Wordmark } from '../../components/Brand';
import type { OnboardingScreenProps } from '../../navigation/types';
import { setOnboardingName } from '../../features/profile/actions';
import { AppleSignInCancelled, continueWithApple, isAppleSignInAvailable } from '../../services/supabase/auth';
import { syncNow } from '../../services/sync/syncEngine';
import { getState } from '../../state/appStore';
import { spacing } from '../../theme';

export function WelcomeScreen({ navigation }: OnboardingScreenProps<'Welcome'>) {
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    analytics.track('onboarding_started', {});
  }, []);

  const signIn = async () => {
    setSigningIn(true);
    try {
      const result = await continueWithApple();
      await syncNow();
      if (result.fullName && !getState().onboarding.displayName && !getState().profile?.display_name) {
        setOnboardingName(result.fullName);
      }
      if (!getState().profile?.onboarding_complete) {
        showToast('Signed in. Let’s set up your goal.');
        navigation.navigate('Name');
      }
    } catch (error) {
      if (!(error instanceof AppleSignInCancelled)) {
        Alert.alert('Couldn’t sign in', 'Please try again, or continue without an account.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <Screen
      scroll={false}
      tone="hero"
      footer={
        <>
          <Button label="Get started" variant="onDark" onPress={() => navigation.navigate('Name')} testID="get-started" />
          {isAppleSignInAvailable() ? (
            <Pressable accessibilityRole="button" onPress={signIn} disabled={signingIn} style={styles.secondary}>
              <AppText variant="bodyStrong" tone="onHeroMuted" align="center">
                {signingIn ? 'Signing in…' : 'I already have an account'}
              </AppText>
            </Pressable>
          ) : null}
        </>
      }
    >
      <View style={styles.header}>
        <Wordmark inverted />
      </View>
      <View style={styles.ring} pointerEvents="none">
        <HeroRing size={420} />
      </View>
      <View style={styles.copy}>
        <AppText variant="headline" tone="onHero" accessibilityRole="header">
          Hit your protein goal. Every day.
        </AppText>
        <AppText variant="body" tone="onHeroMuted" style={styles.sub}>
          Track what you eat, see what’s left, and build consistency without tracking your entire diet.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.lg, zIndex: 1 },
  ring: { position: 'absolute', top: 10, right: -170 },
  copy: { flex: 1, justifyContent: 'flex-end', paddingBottom: spacing.xxl, gap: spacing.md },
  sub: { maxWidth: 320 },
  secondary: { paddingVertical: spacing.md },
});
