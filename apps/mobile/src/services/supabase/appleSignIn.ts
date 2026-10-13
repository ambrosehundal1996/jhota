import { appleAuth } from '@invertase/react-native-apple-authentication';
import { uuid } from '../../utils/id';

export class AppleSignInCancelled extends Error {}

export async function requestAppleIdToken(): Promise<{ token: string; nonce: string; fullName: string | null }> {
  // The library SHA-256 hashes the nonce for Apple; Supabase needs the raw value to verify.
  const rawNonce = uuid();
  try {
    const response = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      nonce: rawNonce,
    });
    if (!response.identityToken) throw new Error('Apple did not return an identity token.');
    const name = [response.fullName?.givenName, response.fullName?.familyName].filter(Boolean).join(' ');
    return { token: response.identityToken, nonce: rawNonce, fullName: name || null };
  } catch (error) {
    if ((error as { code?: string }).code === appleAuth.Error.CANCELED) throw new AppleSignInCancelled();
    throw error;
  }
}

export const isAppleSignInAvailable = () => appleAuth.isSupported;
