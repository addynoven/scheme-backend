import { QueryClient } from '@tanstack/react-query';

/**
 * Global TanStack QueryClient instance.
 * Follows blueprint §5.3: staleTime 5m default.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error) => {
        // Do not retry on 4xx client errors
        const status = (error as { statusCode?: number })?.statusCode;
        if (status && status >= 400 && status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
