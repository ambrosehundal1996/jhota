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

export function analyzeMealPhoto(storagePath: string, userContext?: string): Promise<AnalyzePhotoResponse> {
  return apiFetch<AnalyzePhotoResponse>('/api/ai/analyze-photo', {
    method: 'POST',
    body: { storagePath, userContext: userContext?.trim() || undefined },
    timeoutMs: 60_000,
  });
}
