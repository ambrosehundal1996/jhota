import { requireUser } from '../lib/auth.js';
import { HttpError } from '../lib/env.js';
import { feedbackRequestSchema } from '../lib/feedback.js';
import { handle, json, preflight, readJson } from '../lib/http.js';
import { rateLimit } from '../lib/rateLimit.js';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export const POST = handle(async request => {
  const body = feedbackRequestSchema.parse(await readJson(request));
  const userId = await optionalUserId(request);
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  rateLimit(`feedback:${userId ?? ip}`, 8, 60 * 60_000);

  const { error } = await supabaseAdmin().from('beta_feedback').insert({
    user_id: userId,
    display_name: body.displayName?.trim() || null,
    message: body.message,
  });
  if (error) {
    console.error('[feedback] insert failed', error.message);
    throw new HttpError(502, 'feedback_failed', 'Could not save that just now. Please try again.');
  }
  return json({ ok: true });
});

export const OPTIONS = preflight;

async function optionalUserId(request: Request): Promise<string | null> {
  try {
    return (await requireUser(request)).userId;
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) return null;
    throw error;
  }
}
