import type { AnalyzePhotoResponse } from '@jota/domain';
import { apiFetch, ApiError } from '../api/client';
import { getSupabase } from '../supabase/client';
import { uuid } from '../../utils/id';

function uploadFailureMessage(detail: string): string {
  if (/bucket not found/i.test(detail)) return 'Photo storage is not set up yet. Run the meal-photos storage migration.';
  if (/row-level security|unauthorized|403|42501/i.test(detail)) {
    return 'Could not save the photo for this account. Close the app and try again.';
  }
  if (/mime|not allowed/i.test(detail)) return 'That photo format is not supported. Try another one.';
  return 'The photo upload failed. Please retry.';
}

export async function uploadMealPhoto(localUri: string, userId: string): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError(0, 'not_configured', 'Photo logging is not configured yet.');
  let bytes: ArrayBuffer;
  try {
    bytes = await (await fetch(localUri)).arrayBuffer();
  } catch {
    throw new ApiError(0, 'photo_unreadable', 'We could not read that photo. Please choose another.');
  }
  const path = `${userId}/${new Date().toISOString().slice(0, 10)}/${uuid()}.jpg`;
  const { error } = await supabase.storage.from('meal-photos').upload(path, bytes, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) {
    if (__DEV__) console.warn('[photo] upload failed', error.message, error);
    const offline = /network|fetch/i.test(error.message);
    throw new ApiError(0, offline ? 'offline' : 'upload_failed', offline ? 'You appear to be offline.' : uploadFailureMessage(error.message));
  }
  return path;
}

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/** Hour-long signed URL for a private meal photo. Cached so list rows don’t refetch. */
export async function mealPhotoSignedUrl(storagePath: string): Promise<string | null> {
  const cached = signedUrlCache.get(storagePath);
  if (cached && cached.expiresAt > Date.now() + 15_000) return cached.url;
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from('meal-photos').createSignedUrl(storagePath, 3600);
  if (error || !data?.signedUrl) return null;
  signedUrlCache.set(storagePath, { url: data.signedUrl, expiresAt: Date.now() + 3_500_000 });
  return data.signedUrl;
}

export function analyzeMealPhoto(
  storagePath: string,
  userContext?: string,
  signal?: AbortSignal,
): Promise<AnalyzePhotoResponse> {
  return apiFetch<AnalyzePhotoResponse>('/api/ai/analyze-photo', {
    method: 'POST',
    body: { storagePath, userContext: userContext?.trim() || undefined },
    timeoutMs: 60_000,
    signal,
  });
}
