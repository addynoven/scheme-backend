export const localStore = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback
    try {
      const item = localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : fallback
    } catch {
      return fallback
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.warn(`Failed to set localStore key ${key}:`, e)
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(key)
    } catch (e) {
      console.warn(`Failed to remove localStore key ${key}:`, e)
    }
  },
}
