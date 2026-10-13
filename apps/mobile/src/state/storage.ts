import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

export const storage = createMMKV({ id: 'steady' });

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
