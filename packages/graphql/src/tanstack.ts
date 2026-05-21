import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { mutationOptions, queryOptions } from '@tanstack/react-query';
import type { GraphQLClient } from 'graphql-request';
import type { ExecuteGraphqlRequest } from './apq.js';
import type { GraphqlSpan, StartSpanFn } from './middlewares.js';
import { getOperationName } from './utils.js';

/**
 * Wraps `fn` in a tracer span when `startSpan` is provided; runs it bare
 * otherwise. Lets the helpers be observability-aware without taking a hard
 * dependency on Sentry.
 */
const wrapSpan = async <T>(
  startSpan: StartSpanFn | undefined,
  ctx: {
    attributes?: Record<string, boolean | number | string>;
    name: string;
    op?: string;
  },
  fn: (span?: GraphqlSpan) => Promise<T>
): Promise<T> => {
  if (!startSpan) return fn();
  return startSpan(ctx, (span) => fn(span));
};

/**
 * Creates `graphqlOptions` / `graphqlMutationOptions` helpers bound to a
 * specific executor and client. The executor is used for queries (so APQ
 * routing kicks in when enabled) and the client is used for mutations.
 *
 * The returned helpers have the same shape as plain `queryOptions` /
 * `mutationOptions`, so consumers can spread them and override fields:
 *
 * ```ts
 * useQuery({ ...graphqlOptions(GetHomepageDocument), staleTime: 60_000 });
 * ```
 * @example Minimal (no APQ, no Sentry)
 * ```ts
 * import { createPassthroughExecutor } from '@perimetre/graphql';
 *
 * const client = createGraphqlClient({ endpoint });
 * export const { graphqlOptions, graphqlMutationOptions } =
 *   createGraphqlTanstack({
 *     client,
 *     executor: createPassthroughExecutor(client)
 *   });
 * ```
 * @example Full WPGraphQL Smart Cache + Sentry
 * ```ts
 * const client = createGraphqlClient({ endpoint, plugins: [...] });
 * const executor = createApqExecutor({ endpoint, client, persistedDocuments, fetch });
 * export const { graphqlOptions, graphqlMutationOptions } =
 *   createGraphqlTanstack({
 *     client,
 *     executor,
 *     startSpan: Sentry.startSpan
 *   });
 * ```
 */
export const createGraphqlTanstack = ({
  client,
  executor,
  startSpan
}: {
  client: GraphQLClient;
  executor: ExecuteGraphqlRequest;
  startSpan?: StartSpanFn;
}) => {
  /**
   * Builds a TanStack `queryOptions` bag for a GraphQL document. Spread
   * the result into `useQuery` / `prefetchQuery` to add staleTime, enabled,
   * select, etc.
   */
  function graphqlOptions<TResult, TVariables>(
    document: TypedDocumentNode<TResult, TVariables>,
    ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
  ) {
    const operationName = getOperationName(document);
    return queryOptions({
      /** Runs the GraphQL operation via the supplied executor. */
      queryFn: async () =>
        wrapSpan(
          startSpan,
          {
            name: `graphql.query.${operationName}`,
            op: 'graphql.query',
            attributes: { operationName }
          },
          async () => executor(document, variables as TVariables)
        ),
      queryKey: [document, variables] as const
    });
  }

  /**
   * Builds a TanStack `mutationOptions` bag for a GraphQL document.
   * Mutations always use the standard POST transport via `client.request`.
   */
  function graphqlMutationOptions<TResult, TVariables>(
    document: TypedDocumentNode<TResult, TVariables>
  ) {
    const operationName = getOperationName(document);
    return mutationOptions({
      /** Runs the GraphQL mutation via the standard POST transport. */
      mutationFn: async (variables: TVariables) =>
        wrapSpan(
          startSpan,
          {
            name: `graphql.mutation.${operationName}`,
            op: 'graphql.mutation',
            attributes: { operationName }
          },
          async () => client.request(document, variables as object | undefined)
        ),
      mutationKey: [operationName]
    });
  }

  return { graphqlOptions, graphqlMutationOptions };
};

export type GraphqlTanstack = ReturnType<typeof createGraphqlTanstack>;
