import type { StateStorage } from 'zustand/middleware';

interface WebStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
declare const window: { localStorage: WebStorage } | undefined;

const PREFIX = 'jota:';

function local(): WebStorage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export const storage = {
  getString: (key: string): string | undefined => local()?.getItem(PREFIX + key) ?? undefined,
  set: (key: string, value: string) => local()?.setItem(PREFIX + key, value),
  remove: (key: string) => local()?.removeItem(PREFIX + key),
};

export const zustandStorage: StateStorage = {
  getItem: name => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: name => {
    storage.remove(name);
  },
};

/** Storage adapter for the Supabase auth session. */
export const authStorage = {
  getItem: (key: string) => storage.getString(`auth:${key}`) ?? null,
  setItem: (key: string, value: string) => storage.set(`auth:${key}`, value),
  removeItem: (key: string) => {
    storage.remove(`auth:${key}`);
  },
};
