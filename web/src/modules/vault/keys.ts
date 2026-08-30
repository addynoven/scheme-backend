export const vaultKeys = {
  all: ['vault'] as const,
  documents: (memberId?: number | null) => [...vaultKeys.all, 'documents', memberId] as const,
  readiness: (schemeId?: number | null) => [...vaultKeys.all, 'readiness', schemeId] as const,
  popularSchemes: () => [...vaultKeys.all, 'popular-schemes'] as const,
}
