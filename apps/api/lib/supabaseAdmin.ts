import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireEnv } from './env.js';

let client: SupabaseClient | null = null;

/** Service-role client. Server-only; bypasses RLS, so every query must scope by user id. */
export function supabaseAdmin(): SupabaseClient {
  if (!client) {
    client = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
