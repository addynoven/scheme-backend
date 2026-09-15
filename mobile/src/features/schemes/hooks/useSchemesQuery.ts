import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { schemeKeys } from '../keys';
import { PaginatedSchemes, SchemeFilter, SchemeItem } from '../models/schemes.model';
import { schemesApi } from '../repositories/schemes.api';

/**
 * Hook to fetch schemes from FastAPI backend with TanStack Query caching.
 * Follows blueprint §5.3: Server state via TanStack Query.
 */
export function useSchemesQuery(filter?: Partial<SchemeFilter>) {
  return useQuery<SchemeItem[], Error>({
    queryKey: schemeKeys.list(filter as unknown as Record<string, unknown>),
    queryFn: async () => {
      const result = await schemesApi.getSchemes(filter);
      if (!result.ok) {
        throw result.error;
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes fresh
  });
}

/**
 * Infinite query hook for paginated scheme loading and real-time backend search.
 * Loads 50 schemes per page and triggers fetchNextPage on scroll.
 */
export function useInfiniteSchemesQuery(filter?: Partial<SchemeFilter>, pageSize: number = 50) {
  return useInfiniteQuery<PaginatedSchemes, Error>({
    queryKey: schemeKeys.infinite(filter as unknown as Record<string, unknown>),
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const result = await schemesApi.getSchemesPaginated(filter, pageParam as number, pageSize);
      if (!result.ok) {
        throw result.error;
      }
      return result.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.skip + lastPage.items.length : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single scheme's full details and requirements.
 */
export function useSchemeDetailQuery(idOrSlug: string) {
  return useQuery<SchemeItem, Error>({
    queryKey: schemeKeys.detail(idOrSlug),
    queryFn: async () => {
      const result = await schemesApi.getSchemeById(idOrSlug);
      if (!result.ok) {
        throw result.error;
      }
      return result.data;
    },
    staleTime: 10 * 60 * 1000,
    enabled: Boolean(idOrSlug),
  });
}

/**
 * Hook to fetch live categories with scheme counts.
 */
export function useCategoriesQuery() {
  return useQuery<Array<{ category: string; count: number }>, Error>({
    queryKey: schemeKeys.categories(),
    queryFn: async () => {
      const result = await schemesApi.getCategories();
      if (!result.ok) {
        throw result.error;
      }
      return result.data;
    },
    staleTime: 15 * 60 * 1000,
  });
}
