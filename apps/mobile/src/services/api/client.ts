import { appConfig } from '../../config';
import { getAccessToken } from '../supabase/client';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }

  get isOffline() {
    return this.code === 'offline';
  }
}

export async function apiFetch<T>(
  path: string,
  init: { method?: 'GET' | 'POST'; body?: unknown; timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<T> {
  if (!appConfig.apiBaseUrl) throw new ApiError(0, 'not_configured', 'This feature is not configured yet.');
  const token = await getAccessToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init.timeoutMs ?? 15_000);
  init.signal?.addEventListener('abort', () => controller.abort());

  let response: Response;
  try {
    response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: controller.signal,
    });
  } catch {
    if (init.signal?.aborted) throw new ApiError(0, 'cancelled', 'Cancelled.');
    const timedOut = controller.signal.aborted;
    throw new ApiError(
      0,
      timedOut ? 'timeout' : 'offline',
      timedOut ? 'This is taking longer than usual. Please try again.' : 'You appear to be offline.',
    );
  } finally {
    clearTimeout(timeout);
  }

  const body = (await response.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
  if (!response.ok) {
    throw new ApiError(
      response.status,
      body?.error?.code ?? 'http_error',
      body?.error?.message ?? 'Something went wrong. Please try again.',
    );
  }
  return body as T;
}
