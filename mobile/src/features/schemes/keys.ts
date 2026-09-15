/**
 * Query key factories for TanStack Query caching.
 * Follows blueprint §3: Structured query keys for invalidation & caching.
 */
export const schemeKeys = {
  all: ['schemes'] as const,
  lists: () => [...schemeKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...schemeKeys.lists(), filters ?? {}] as const,
  infinite: (filters?: Record<string, unknown>) => [...schemeKeys.all, 'infinite', filters ?? {}] as const,
  categories: () => [...schemeKeys.all, 'categories'] as const,
  details: () => [...schemeKeys.all, 'detail'] as const,
  detail: (idOrSlug: string | number) => [...schemeKeys.details(), String(idOrSlug)] as const,
};
