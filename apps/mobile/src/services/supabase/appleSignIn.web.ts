export class AppleSignInCancelled extends Error {}

/** Native Sign in with Apple only; the web build keeps its anonymous session. */
export async function requestAppleIdToken(): Promise<{ token: string; nonce: string; fullName: string | null }> {
  throw new Error('Sign in with Apple is available in the Steady iOS app.');
}

export const isAppleSignInAvailable = () => false;
