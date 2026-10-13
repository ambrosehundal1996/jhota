import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { analytics } from '../../analytics';
import { AppText, Button, Screen, showToast } from '../../components';
import { HeroRing, Wordmark } from '../../components/Brand';
import type { OnboardingScreenProps } from '../../navigation/types';
import { AppleSignInCancelled, continueWithApple, isAppleSignInAvailable } from '../../services/supabase/auth';
import { syncNow } from '../../services/sync/syncEngine';
import { getState } from '../../state/appStore';
import { colors, spacing } from '../../theme';

export function WelcomeScreen({ navigation }: OnboardingScreenProps<'Welcome'>) {
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    analytics.track('onboarding_started', {});
  }, []);

  const signIn = async () => {
    setSigningIn(true);
    try {
      await continueWithApple();
      await syncNow();
      if (!getState().profile?.onboarding_complete) {
        showToast('Signed in. Let’s set up your goal.');
        navigation.navigate('Goal');
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
      footer={
        <>
          <Button label="Get started" onPress={() => navigation.navigate('Goal')} testID="get-started" />
          {isAppleSignInAvailable() ? (
            <Pressable accessibilityRole="button" onPress={signIn} disabled={signingIn} style={styles.secondary}>
              <AppText variant="bodyStrong" tone="secondary" align="center">
                {signingIn ? 'Signing in…' : 'I already have an account'}
              </AppText>
            </Pressable>
          ) : null}
        </>
      }
    >
      <View style={styles.header}>
        <Wordmark />
      </View>
      <View style={styles.ring} pointerEvents="none">
        <HeroRing size={420} />
      </View>
      <View style={styles.copy}>
        <AppText variant="headline" accessibilityRole="header">
          Hit your protein goal. Every day.
        </AppText>
        <AppText variant="body" tone="secondary" style={styles.sub}>
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
  sub: { maxWidth: 320, color: colors.textSecondary },
  secondary: { paddingVertical: spacing.md },
});
