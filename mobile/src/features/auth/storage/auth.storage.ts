import { UserProfile } from '../models/auth.model';

export interface KeyValueStore {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  remove?(key: string): unknown;
  delete?(key: string): unknown;
}

export class AuthStorageService {
  private store: KeyValueStore | null = null;
  private keyUser = 'auth_current_user';
  private keyToken = 'auth_session_token';

  constructor(customStore?: KeyValueStore) {
    if (customStore) {
      this.store = customStore;
    }
  }

  private getStore(): KeyValueStore {
    if (this.store) return this.store;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { storage } = require('@/core/storage/mmkv');
      if (storage && typeof storage.getString === 'function') {
        this.store = storage;
        return storage;
      }
    } catch {
      // ignore
    }
    const fallback: KeyValueStore = {
      getString: () => undefined,
      set: () => {},
      remove: () => {},
      delete: () => {},
    };
    this.store = fallback;
    return fallback;
  }

  public getCurrentUser(): UserProfile | null {
    const raw = this.getStore().getString(this.keyUser);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public saveUser(user: UserProfile): void {
    this.getStore().set(this.keyUser, JSON.stringify(user));
    this.getStore().set(this.keyToken, `token_${user.id}_${Date.now()}`);
  }

  public clearSession(): void {
    const s = this.getStore() as any;
    if (typeof s.remove === 'function') {
      s.remove(this.keyUser);
      s.remove(this.keyToken);
    } else if (typeof s.delete === 'function') {
      s.delete(this.keyUser);
      s.delete(this.keyToken);
    }
  }
}

export const authStorage = new AuthStorageService();
