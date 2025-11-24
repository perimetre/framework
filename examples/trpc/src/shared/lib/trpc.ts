import {
  defaultShouldDehydrateQuery,
  QueryClient
} from '@tanstack/react-query';
import superjson from 'superjson';

export const transformer = superjson;

/**
 * Get the full tRPC endpoint URL
 */
export function getUrl() {
  return getBaseUrl() + '/api/trpc';
}

/**
 * Get the base URL for the application
 * Handles different environments (local, Vercel, custom)
 */
function getBaseUrl() {
  if (typeof window !== 'undefined') return ''; // Browser: use relative URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // Vercel
  if (process.env.BASE_URL) return process.env.BASE_URL; // Custom base URL
  return 'http://localhost:3000'; // Default to localhost
}

/**
 * Create a new QueryClient instance
 * This should be created once per request on the server
 * and once per session in the browser
 */
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Since queries are prefetched on the server, we set a stale time
        // so that queries aren't immediately refetched on the client
        staleTime: 1000 * 30 // 30 seconds
      },
      dehydrate: {
        serializeData: transformer.serialize,
        // Include pending queries in dehydration
        // This allows us to prefetch in RSC and send promises over the RSC boundary
        /**
         *
         */
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending'
      },
      hydrate: {
        deserializeData: transformer.deserialize
      }
    }
  });
