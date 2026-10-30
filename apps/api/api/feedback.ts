import { requireUser } from '../lib/auth.js';
import { HttpError } from '../lib/env.js';
import { feedbackRequestSchema, sendFeedbackEmail } from '../lib/feedback.js';
import { handle, json, preflight, readJson } from '../lib/http.js';
import { rateLimit } from '../lib/rateLimit.js';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export const POST = handle(async request => {
  const body = feedbackRequestSchema.parse(await readJson(request));
  const userId = await optionalUserId(request);
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  rateLimit(`feedback:${userId ?? ip}`, 8, 60 * 60_000);

  const displayName = body.displayName?.trim() || null;
  let stored = false;
  try {
    const { error } = await supabaseAdmin().from('beta_feedback').insert({
      user_id: userId,
      display_name: displayName,
      message: body.message,
    });
    stored = !error;
    if (error) console.error('[feedback] insert failed', error.message);
  } catch (error) {
    console.error('[feedback] insert failed', error);
  }

  const emailed = await sendFeedbackEmail({
    message: body.message,
    displayName,
    userId,
  }).catch(error => {
    console.error('[feedback] email failed', error);
    return false;
  });

  if (!stored && !emailed) {
    throw new HttpError(502, 'feedback_failed', 'Could not send that just now. Please try again.');
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
