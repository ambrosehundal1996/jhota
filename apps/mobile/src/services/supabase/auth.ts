import { analytics } from '../../analytics';
import { setState, type AppData } from '../../state/appStore';
import { requestAppleIdToken } from './appleSignIn';
import { getSupabase } from './client';

export { AppleSignInCancelled, isAppleSignInAvailable } from './appleSignIn';

/**
 * Rewrites ownership of every local row (and queued write) to the real user id. Used when the
 * first anonymous session is created after offline use, and when signing in to an existing
 * Apple-linked account so data logged on this device is merged rather than lost.
 */
export function adoptUserId(nextUserId: string, opts: { isAnonymous: boolean; appleLinked?: boolean }): void {
  setState(state => {
    const retag = <T extends { user_id: string }>(rows: Record<string, T>) =>
      Object.fromEntries(Object.entries(rows).map(([id, row]) => [id, { ...row, user_id: nextUserId }]));
    const changed = state.userId !== nextUserId;
    const patch: Partial<AppData> = {
      userId: nextUserId,
      isAnonymous: opts.isAnonymous,
      appleLinked: opts.appleLinked ?? state.appleLinked,
    };
    if (!changed) return patch;
    return {
      ...patch,
      profile: state.profile ? { ...state.profile, id: nextUserId } : null,
      logs: retag(state.logs),
      overrides: retag(state.overrides),
      favorites: retag(state.favorites),
      customFoods: retag(state.customFoods),
      savedMeals: retag(state.savedMeals),
      savedMealItems: retag(state.savedMealItems),
      notificationPrefs: { ...state.notificationPrefs, user_id: nextUserId },
      outbox: state.outbox.map(item => {
        if (item.op !== 'upsert') return item;
        const row = { ...item.row };
        if ('user_id' in row) row.user_id = nextUserId;
        if (item.table === 'protein_tracker_profiles') row.id = nextUserId;
        return { ...item, row, rowId: item.table === 'protein_tracker_profiles' ? nextUserId : item.rowId };
      }),
      lastPulledAt: {},
    };
  });
}

/** Ensures there is a Supabase session, creating an anonymous user on first launch. */
export async function ensureSession(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  let user = data.session?.user ?? null;
  if (!user) {
    const { data: signIn, error } = await supabase.auth.signInAnonymously();
    if (error || !signIn.user) return null;
    user = signIn.user;
  }
  const appleLinked = (user.identities ?? []).some(i => i.provider === 'apple');
  adoptUserId(user.id, { isAnonymous: user.is_anonymous ?? false, appleLinked });
  return user.id;
}

export interface AppleAuthResult {
  userId: string;
  /** True when Apple was already linked to another account and we switched to it. */
  switchedAccount: boolean;
  fullName: string | null;
}

/**
 * Upgrades the anonymous user by linking an Apple identity (same user id, so data and the
 * RevenueCat subscription carry over). If that Apple ID already belongs to an account, signs
 * in to it instead and merges this device's local data into it.
 */
export async function continueWithApple(): Promise<AppleAuthResult> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Accounts are not configured in this build.');
  const { token, nonce, fullName } = await requestAppleIdToken();

  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session) {
    const { data, error } = await supabase.auth.linkIdentity({ provider: 'apple', token, nonce });
    if (!error && data.user) {
      adoptUserId(data.user.id, { isAnonymous: false, appleLinked: true });
      analytics.track('apple_account_linked', { switched: false });
      return { userId: data.user.id, switchedAccount: false, fullName };
    }
    const alreadyLinked = error && /already|exists/i.test(`${error.code ?? ''} ${error.message}`);
    if (error && !alreadyLinked) throw error;
  }

  const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token, nonce });
  if (error || !data.user) throw error ?? new Error('Sign in with Apple failed.');
  adoptUserId(data.user.id, { isAnonymous: false, appleLinked: true });
  analytics.track('apple_account_linked', { switched: true });
  return { userId: data.user.id, switchedAccount: true, fullName };
}