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

/** Comma-separated browser origins for the web build, e.g. "http://localhost:8080,https://app.jota.app". */
function allowedOrigins(): string[] {
  return (process.env.WEB_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map(origin => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  if (!origin || !allowedOrigins().includes(origin)) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-max-age': '600',
    vary: 'Origin',
  };
}

/** CORS preflight for routes the web build calls. */
export async function preflight(request: Request): Promise<Response> {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

function withCors(request: Request, response: Response): Response {
  const headers = corsHeaders(request);
  for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
  return response;
}

/** Uniform error envelope: { error: { code, message } }. Never leaks internals. */
export function handle(handler: Handler): Handler {
  return async request => {
    try {
      return withCors(request, await handler(request));
    } catch (error) {
      if (error instanceof HttpError) return withCors(request, errorResponse(error.status, error.code, error.message));
      if (error instanceof ZodError) return withCors(request, errorResponse(400, 'invalid_request', 'The request was not valid.'));
      console.error('[api] unhandled error', error);
      return withCors(request, errorResponse(500, 'internal_error', 'Something went wrong. Please try again.'));
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
