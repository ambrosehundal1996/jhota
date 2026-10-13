import type { AnalyzePhotoResponse } from '@steady/domain';
import { apiFetch, ApiError } from '../api/client';
import { getSupabase } from '../supabase/client';
import { uuid } from '../../utils/id';

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
    const offline = /network|fetch/i.test(error.message);
    throw new ApiError(0, offline ? 'offline' : 'upload_failed', offline ? 'You appear to be offline.' : 'The photo upload failed. Please retry.');
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
