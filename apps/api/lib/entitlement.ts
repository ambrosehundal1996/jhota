import { HttpError } from './env.js';
import { supabaseAdmin } from './supabaseAdmin.js';

/**
 * Server-side gate for paid features. A missing row means the webhook has not arrived yet
 * (e.g. a trial that just started), so access is allowed; an explicitly expired row is not.
 */
export async function requireActiveEntitlement(userId: string): Promise<void> {
  const { data, error } = await supabaseAdmin()
    .from('subscription_status')
    .select('is_active, expires_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.warn('[entitlement] lookup failed; allowing request', error.message);
    return;
  }
  if (!data) return;
  const expired = data.expires_at ? new Date(data.expires_at).getTime() < Date.now() : false;
  if (!data.is_active && expired) {
    throw new HttpError(402, 'subscription_required', 'Your subscription has ended.');
  }
}
