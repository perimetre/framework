import {
  defaultShouldDehydrateQuery,
  QueryClient
} from '@tanstack/react-query';
import superjson from 'superjson';

export const transformer = superjson;

/**
 * Make sure to create a new QueryClient for each request
 */
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      dehydrate: {
        serializeData: transformer.serialize,
        /**
         * include pending queries in dehydration, this allows us to prefetch in RSC and send promises over the RSC boundary
         */
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending'
      },
      hydrate: {
        deserializeData: transformer.deserialize
      },
      queries: {
        // Since queries are prefetched on the server, we set a stale time so that
        // queries aren't immediately refetched on the client
        staleTime: 1000 /* * 30 */
      }
    }
  });

let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Get a query client
 */
export const getQueryClient = () => {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return createQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    browserQueryClient ??= createQueryClient();
    return browserQueryClient;
  }
};
