import { HttpError } from './env.js';

function providedKey(request: Request): string {
  return request.headers.get('x-playground-key') ?? new URL(request.url).searchParams.get('key') ?? '';
}

/** Unlisted playground: secret in prod/preview; open on local `vercel dev` when unset. */
export function requirePlayground(request: Request): void {
  const secret = process.env.PLAYGROUND_SECRET ?? '';
  const env = process.env.VERCEL_ENV ?? '';
  if (secret) {
    if (providedKey(request) !== secret) throw new HttpError(404, 'not_found', 'Not found.');
    return;
  }
  if (env === 'production' || env === 'preview') {
    throw new HttpError(404, 'not_found', 'Not found.');
  }
}
