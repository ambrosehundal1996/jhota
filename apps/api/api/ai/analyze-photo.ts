import { analyzePhotoRequestSchema, type AnalyzePhotoResponse } from '@jota/domain';
import { analyzeMealPhoto, PROTEIN_PHOTO_PROMPT_VERSION } from '../../lib/ai/analyzeMealPhoto.js';
import { requireUser } from '../../lib/auth.js';
import { requireActiveEntitlement } from '../../lib/entitlement.js';
import { HttpError, optionalEnv } from '../../lib/env.js';
import { handle, json, preflight, readJson } from '../../lib/http.js';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

export const POST = handle(async request => {
  const { userId } = await requireUser(request);
  const { storagePath, userContext } = analyzePhotoRequestSchema.parse(await readJson(request));
  if (!storagePath.startsWith(`${userId}/`) || storagePath.includes('..')) {
    throw new HttpError(403, 'forbidden', 'That photo does not belong to this account.');
  }
  await requireActiveEntitlement(userId);

  const db = supabaseAdmin();
  const hourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
  const { count } = await db
    .from('ai_photo_analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', hourAgo);
  if ((count ?? 0) >= Number(optionalEnv('AI_ANALYSES_PER_HOUR', '30'))) {
    throw new HttpError(429, 'rate_limited', 'You’ve analyzed a lot of photos this hour. Try Quick Add for now.');
  }

  const { data: row, error: insertError } = await db
    .from('ai_photo_analyses')
    .insert({ user_id: userId, storage_path: storagePath, user_context: userContext ?? null, status: 'pending' })
    .select('id')
    .single();
  if (insertError || !row) throw new HttpError(500, 'db_error', 'Could not start the analysis.');

  try {
    const { data: signed, error: signError } = await db.storage
      .from('meal-photos')
      .createSignedUrl(storagePath, 300);
    if (signError || !signed) throw new HttpError(404, 'photo_missing', 'The photo upload did not finish. Please retry.');

    const { estimate, raw, model } = await analyzeMealPhoto({ imageUrl: signed.signedUrl, userContext });
    const { error: saveError } = await db
      .from('ai_photo_analyses')
      .update({
        status: 'completed',
        model,
        prompt_version: PROTEIN_PHOTO_PROMPT_VERSION,
        raw_response: raw,
        raw_total_g: estimate.total_protein_g,
        estimate,
        overall_confidence: estimate.overall_confidence,
        review_notes: estimate.review_notes,
        needs_clarification: estimate.needs_clarification,
      })
      .eq('id', row.id);
    if (saveError) console.error('[ai] failed to persist estimate', saveError.message);

    const body: AnalyzePhotoResponse = { analysisId: row.id, estimate, model };
    return json(body);
  } catch (error) {
    await db
      .from('ai_photo_analyses')
      .update({ status: 'failed', error: error instanceof Error ? error.message.slice(0, 300) : 'unknown' })
      .eq('id', row.id);
    throw error;
  }
});

export const OPTIONS = preflight;
