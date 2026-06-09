import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { mutationOptions, queryOptions } from '@tanstack/react-query';
import type { GraphQLClient } from 'graphql-request';
import {
  contextFromDocument,
  resolveRequestOptions,
  type ExecuteGraphqlRequest,
  type GraphqlRequestOptions,
  type GraphqlRequestPlugin
} from './apq.js';
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
  requestPlugins,
  startSpan
}: {
  client: GraphQLClient;
  executor: ExecuteGraphqlRequest;
  /**
   * Per-request before-hooks (see {@link GraphqlRequestPlugin}). Resolved here
   * only to fold the effective `edgeCache` into the query key so the same
   * operation cached under different resolved TTLs (e.g. build vs runtime)
   * doesn't collide. The executor re-resolves and runs the hooks for real, so
   * the hooks must be pure.
   */
  requestPlugins?: GraphqlRequestPlugin[];
  startSpan?: StartSpanFn;
}) => {
  /**
   * Builds a TanStack `queryOptions` bag for a GraphQL document. Spread
   * the result into `useQuery` / `prefetchQuery` to add staleTime, enabled,
   * select, etc.
   *
   * Pass a third `options` argument to tune the transport for this query —
   * most notably `edgeCache` (TTL in seconds), which adds an `edgeCache=<ttl>`
   * query param so the WPGraphQL Smart Cache server emits a matching
   * `Cache-Control` header and nginx caches the GET at the edge. Only effective
   * on the cacheable GET transport (APQ / Trusted Documents); ignored otherwise.
   *
   * `options` always comes after `variables`. For a query that takes no
   * variables, pass `undefined` in the variables slot.
   * @example Edge-cache a query for 60–300s
   * ```ts
   * // with variables — options is the third argument
   * useQuery(graphqlOptions(GetPostDocument, { slug }, { edgeCache: 300 }));
   * // no variables — pass `undefined` first
   * useQuery(graphqlOptions(GetHomepageDocument, undefined, { edgeCache: 60 }));
   * ```
   */
  function graphqlOptions<TResult, TVariables>(
    document: TypedDocumentNode<TResult, TVariables>,
    ...[variables, options]: TVariables extends Record<string, never>
      ? [variables?: undefined, options?: GraphqlRequestOptions]
      : [variables: TVariables, options?: GraphqlRequestOptions]
  ) {
    const operationName = getOperationName(document);
    // Resolve the effective transport options through the request plugins so the
    // query key reflects what will actually be sent (e.g. a build-only
    // `edgeCache` default). The executor re-resolves on its own request path —
    // we only peek here, and pass the caller's original `options` through
    // unchanged so the executor stays the single authority.
    const resolved = resolveRequestOptions(
      requestPlugins,
      contextFromDocument(document),
      options
    );
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
          async () => executor(document, variables, options)
        ),
      // Fold the resolved `edgeCache` into the key so the same operation+variables
      // cached under different effective TTLs (e.g. build vs runtime) don't
      // collide in TanStack's client-side cache.
      queryKey: [document, variables, resolved.edgeCache] as const
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
