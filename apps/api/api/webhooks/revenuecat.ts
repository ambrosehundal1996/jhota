import { timingSafeEqual } from 'node:crypto';
import { requireEnv } from '../../lib/env.js';
import { errorResponse, handle, json, readJson } from '../../lib/http.js';
import { eventToSubscriptionRow, type RevenueCatEvent } from '../../lib/revenuecat.js';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

function authorized(header: string | null): boolean {
  const expected = Buffer.from(requireEnv('REVENUECAT_WEBHOOK_AUTH'));
  const actual = Buffer.from((header ?? '').replace(/^Bearer\s+/i, ''));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export const POST = handle(async request => {
  if (!authorized(request.headers.get('authorization'))) {
    return errorResponse(401, 'unauthorized', 'Invalid webhook authorization.');
  }
  const body = (await readJson(request)) as { event?: RevenueCatEvent };
  if (!body.event?.type) return errorResponse(400, 'invalid_event', 'Missing event.');

  const row = eventToSubscriptionRow(body.event);
  if (!row) return json({ ok: true, skipped: true });

  const { error } = await supabaseAdmin().from('subscription_status').upsert(row, { onConflict: 'user_id' });
  if (error) {
    console.error('[revenuecat] upsert failed', error.message);
    return errorResponse(500, 'db_error', 'Could not store subscription state.');
  }
  return json({ ok: true });
});
