export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new HttpError(500, 'server_misconfigured', `Missing server configuration: ${name}`);
  return value;
}

export function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
