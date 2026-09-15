import { ok, err, type Result } from '../errors/result';
import { AppError } from '../errors/error-handler';

/**
 * Hardware-encrypted storage (iOS Keychain / Android Keystore) for tokens.
 * Follows blueprint §5.5.
 */

// Memory fallback for Node.js / unit-test environments
const memoryFallback = new Map<string, string>();

function getSecureStore(): typeof import('expo-secure-store') | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-secure-store');
  } catch {
    return null;
  }
}

export const secureStorage = {
  async get(key: string): Promise<Result<string | null, AppError>> {
    try {
      const store = getSecureStore();
      if (store) {
        const value = await store.getItemAsync(key);
        return ok(value);
      }
      return ok(memoryFallback.get(key) ?? null);
    } catch (error) {
      return err(
        new AppError(`Failed to retrieve secure item: ${key}`, {
          code: 'SECURE_STORAGE_READ_ERROR',
          cause: error,
        })
      );
    }
  },

  async set(key: string, value: string): Promise<Result<void, AppError>> {
    try {
      const store = getSecureStore();
      if (store) {
        await store.setItemAsync(key, value);
      } else {
        memoryFallback.set(key, value);
      }
      return ok(undefined);
    } catch (error) {
      return err(
        new AppError(`Failed to store secure item: ${key}`, {
          code: 'SECURE_STORAGE_WRITE_ERROR',
          cause: error,
        })
      );
    }
  },

  async remove(key: string): Promise<Result<void, AppError>> {
    try {
      const store = getSecureStore();
      if (store) {
        await store.deleteItemAsync(key);
      } else {
        memoryFallback.delete(key);
      }
      return ok(undefined);
    } catch (error) {
      return err(
        new AppError(`Failed to delete secure item: ${key}`, {
          code: 'SECURE_STORAGE_DELETE_ERROR',
          cause: error,
        })
      );
    }
  },
};
