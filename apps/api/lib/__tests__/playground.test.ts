import { afterEach, describe, expect, it } from 'vitest';
import { HttpError } from '../env.js';
import { requirePlayground } from '../playground.js';

const request = (url: string, headers?: Record<string, string>) => new Request(url, { headers });

afterEach(() => {
  delete process.env.PLAYGROUND_SECRET;
  delete process.env.VERCEL_ENV;
});

describe('requirePlayground', () => {
  it('allows local vercel dev when no secret is set', () => {
    process.env.VERCEL_ENV = 'development';
    expect(() => requirePlayground(request('http://localhost:3000/api/dev/search?q=eggs'))).not.toThrow();
  });

  it('hides the endpoint in production without a secret', () => {
    process.env.VERCEL_ENV = 'production';
    expect(() => requirePlayground(request('https://jhota.vercel.app/api/dev/search?q=eggs'))).toThrow(HttpError);
  });

  it('accepts the secret via query or header', () => {
    process.env.VERCEL_ENV = 'production';
    process.env.PLAYGROUND_SECRET = 'test-key';
    expect(() => requirePlayground(request('https://jhota.vercel.app/api/dev/search?q=eggs&key=test-key'))).not.toThrow();
    expect(() =>
      requirePlayground(request('https://jhota.vercel.app/api/dev/search?q=eggs', { 'x-playground-key': 'test-key' })),
    ).not.toThrow();
    expect(() => requirePlayground(request('https://jhota.vercel.app/api/dev/search?q=eggs&key=nope'))).toThrow(HttpError);
  });
});
