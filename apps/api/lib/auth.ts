import { HttpError } from './env.js';
import { supabaseAdmin } from './supabaseAdmin.js';

export interface AuthedUser {
  userId: string;
  isAnonymous: boolean;
}

/** Verifies the caller's Supabase access token (anonymous sessions included). */
export async function requireUser(request: Request): Promise<AuthedUser> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new HttpError(401, 'unauthorized', 'Sign-in required.');
  const { data, error } = await supabaseAdmin().auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'unauthorized', 'Your session expired. Please reopen the app.');
  return { userId: data.user.id, isAnonymous: data.user.is_anonymous ?? false };
}
