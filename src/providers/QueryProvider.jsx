import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Context for useQueryClient hook
const ReactQueryContext = React.createContext(null);

/**
 * QueryClient configuration with security-aware defaults
 * 
 * Security considerations:
 * - cacheTime: Controls how long data stays in cache after being removed
 * - staleTime: How long until data is considered stale and refetched
 * - retry: When to retry failed requests
 * - refetchOnWindowFocus: Auto-refetch when user returns to app (security: clears old data)
 */
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Security-sensitive queries should use cacheTime: 0
      cacheTime: 1000 * 60 * 5, // 5 minutes for general queries
      staleTime: 1000 * 60,     // 1 minute until stale (auto-refetch)
      
      // Network behavior
      retry: (failureCount, error) => {
        // Don't retry on 401/403/404
        if (error?.status === 401 || error?.status === 403 || error?.status === 404) {
          return false;
        }
        // Retry up to 2 times for network errors
        return failureCount < 2;
      },
      
      // Automatic refetching behavior
      refetchOnWindowFocus: true,  // Security: refreshes data when user returns
      refetchOnReconnect: true,    // Refresh on network reconnect
      refetchOnMount: true,        // Refresh when component mounts
      
      // Optimization
      keepPreviousData: true,      // Keep previous data while fetching
      structuralSharing: true,      // Prevent unnecessary re-renders
    },
    mutations: {
      retry: 0, // Never retry mutations (user should retry manually)
      onError: (error) => {
        console.error('Mutation error:', error);
        // Global mutation error handling would go here
      },
    },
  },
});

export function QueryProvider({ children }) {
  const [queryClient] = React.useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development for security */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          panelProps={{ style: { height: '400px' } }}
        />
      )}
    </QueryClientProvider>
  );
}

export default QueryProvider;
