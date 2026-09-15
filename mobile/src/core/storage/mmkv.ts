import type { StateStorage } from 'zustand/middleware';

/**
 * MMKV fast synchronous key-value storage.
 * Used for client state persistence, search history, and offline caches.
 */
let mmkvInstance: any = null;
const memoryStorage = new Map<string, string>();

function getStorage(): any {
  if (!mmkvInstance) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { createMMKV } = require('react-native-mmkv');
      mmkvInstance = createMMKV({ id: 'scheme-app-storage' });
    } catch {
      mmkvInstance = {
        set: (key: string, value: any) => memoryStorage.set(key, String(value)),
        getString: (key: string) => memoryStorage.get(key),
        getBoolean: (key: string) => memoryStorage.get(key) === 'true',
        remove: (key: string) => memoryStorage.delete(key),
        delete: (key: string) => memoryStorage.delete(key),
      };
    }
  }
  return mmkvInstance;
}

export const storage = {
  set: (key: string, value: any) => getStorage().set(key, value),
  getString: (key: string) => getStorage().getString(key),
  getBoolean: (key: string) => getStorage().getBoolean(key),
  remove: (key: string) => getStorage().remove(key),
  delete: (key: string) => getStorage().delete(key),
};

export const mmkvStorage = storage;

/**
 * Zustand storage adapter for MMKV persistence.
 */
export const mmkvStorageAdapter: StateStorage = {
  setItem: (name: string, value: string): void => {
    storage.set(name, value);
  },
  getItem: (name: string): string | null => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name: string): void => {
    storage.remove(name);
  },
};
