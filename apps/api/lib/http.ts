import { ZodError } from 'zod';
import { HttpError } from './env.js';

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers },
  });
}

export function errorResponse(status: number, code: string, message: string): Response {
  return json({ error: { code, message } }, status);
}

type Handler = (request: Request) => Promise<Response>;

/** Uniform error envelope: { error: { code, message } }. Never leaks internals. */
export function handle(handler: Handler): Handler {
  return async request => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof HttpError) return errorResponse(error.status, error.code, error.message);
      if (error instanceof ZodError) return errorResponse(400, 'invalid_request', 'The request was not valid.');
      console.error('[api] unhandled error', error);
      return errorResponse(500, 'internal_error', 'Something went wrong. Please try again.');
    }
  };
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, 'invalid_json', 'Request body must be JSON.');
  }
}
