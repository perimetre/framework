import { graphqlClient } from '@/server/graphql';
import { createPassthroughExecutor } from '@perimetre/graphql';
import { createGraphqlTanstack } from '@perimetre/graphql/tanstack';

/**
 * Project-wide TanStack helpers bound to our `graphqlClient`. Use the
 * passthrough executor since this example doesn't use WPGraphQL Smart
 * Cache / APQ — for a project that does, swap in `createApqExecutor` and
 * a `persistedDocuments` JSON map.
 *
 * The returned helpers have the same shape as plain `queryOptions` /
 * `mutationOptions`, so callers can spread them and override `staleTime`,
 * `enabled`, `onMutate`, etc.
 */
export const { graphqlOptions, graphqlMutationOptions } = createGraphqlTanstack(
  {
    client: graphqlClient,
    executor: createPassthroughExecutor(graphqlClient)
  }
);
