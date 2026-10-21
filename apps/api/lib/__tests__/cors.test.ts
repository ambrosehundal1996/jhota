import { afterEach, describe, expect, it } from 'vitest';
import { handle, json, preflight } from '../http.js';

const request = (origin?: string) =>
  new Request('https://api.example.com/api/foods/search', { headers: origin ? { origin } : {} });

describe('CORS for the web build', () => {
  afterEach(() => {
    delete process.env.WEB_ALLOWED_ORIGINS;
  });

  it('allows only configured origins', async () => {
    process.env.WEB_ALLOWED_ORIGINS = 'http://localhost:8080, https://app.jota.app/';
    const ok = await handle(async () => json({ ok: true }))(request('https://app.jota.app'));
    expect(ok.headers.get('access-control-allow-origin')).toBe('https://app.jota.app');

    const blocked = await handle(async () => json({ ok: true }))(request('https://evil.example'));
    expect(blocked.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('sends no CORS headers when no origins are configured', async () => {
    const response = await preflight(request('http://localhost:8080'));
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('adds CORS headers to error responses too', async () => {
    process.env.WEB_ALLOWED_ORIGINS = 'http://localhost:8080';
    const response = await handle(async () => {
      throw new Error('boom');
    })(request('http://localhost:8080'));
    expect(response.status).toBe(500);
    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:8080');
  });
});
