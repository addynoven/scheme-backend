type Listener = () => void;

/**
 * Simple event emitter for auth session expiry.
 * When the backend returns 401, this fires so the app can
 * clear stale state and redirect to the login screen.
 *
 * Using a plain emitter avoids circular deps between httpClient and auth store.
 */
class AuthSessionExpired {
  private listeners: Set<Listener> = new Set();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  /** Subscribe to session-expired events. Returns unsubscribe function. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Emit session-expired. Debounced to prevent multiple rapid 401s from firing many times. */
  emit(): void {
    if (this.debounceTimer) return;
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
    }, 2000);

    console.log('[Auth] Session expired — 401 received, forcing re-login');
    this.listeners.forEach((fn) => fn());
  }
}

export const authSessionExpired = new AuthSessionExpired();
