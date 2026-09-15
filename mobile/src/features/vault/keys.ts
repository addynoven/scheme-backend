/**
 * Query key factories for Vault TanStack Query caching.
 * Follows blueprint §3: Structured query keys.
 */
export const vaultKeys = {
  all: ['vault'] as const,
  documents: () => [...vaultKeys.all, 'documents'] as const,
  readiness: (schemeId: string | number) => [...vaultKeys.all, 'readiness', String(schemeId)] as const,
};
