export const schemesKeys = {
  all: ['schemes'] as const,
  detail: (slug: string) => [...schemesKeys.all, 'detail', slug] as const,
  readiness: (schemeId: number) => [...schemesKeys.all, 'readiness', schemeId] as const,
  search: (filters: Record<string, any>) => [...schemesKeys.all, 'search', filters] as const,
}
