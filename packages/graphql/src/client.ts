import {
  GraphQLClient,
  type RequestMiddleware,
  type ResponseMiddleware
} from 'graphql-request';

/**
 * Options for `graphql-request`'s `GraphQLClient` constructor. Re-exported as
 * a named type so consumers don't need to import from `graphql-request`
 * directly.
 */
export type GraphqlClientOptions = ConstructorParameters<
  typeof GraphQLClient
>[1];

/**
 * Composable layer for a `GraphQLClient`. A plugin can mix in headers,
 * swap in the `fetch` implementation a consumer supplied, chain
 * `requestMiddleware`, or chain `responseMiddleware`. Plugins are applied
 * left-to-right; later plugins layer on top of earlier ones.
 */
export type GraphqlClientPlugin = (
  options: GraphqlClientOptions
) => GraphqlClientOptions;

/**
 * Chains two `requestMiddleware` functions. The outer middleware runs first
 * and its result is passed into the inner middleware so layered plugins can
 * each see (and mutate) the in-flight request.
 */
const chainRequestMiddleware = (
  outer: RequestMiddleware | undefined,
  inner: RequestMiddleware | undefined
): RequestMiddleware | undefined => {
  if (!outer) return inner;
  if (!inner) return outer;
  return async (request) => {
    const next = await outer(request);
    return inner(next);
  };
};

/**
 * Chains two `responseMiddleware` functions. Both run on every response so
 * each plugin sees the response shape it expects (graphql-request invokes
 * the middleware imperatively without expecting a return value).
 */
const chainResponseMiddleware = (
  outer: ResponseMiddleware | undefined,
  inner: ResponseMiddleware | undefined
): ResponseMiddleware | undefined => {
  if (!outer) return inner;
  if (!inner) return outer;
  return async (response, request) => {
    await outer(response, request);
    await inner(response, request);
  };
};

/**
 * Merges plugin options into an accumulated options bag, chaining middlewares
 * and merging headers so each plugin layers on top of the previous one
 * rather than replacing it.
 */
const mergeOptions = (
  base: GraphqlClientOptions,
  next: GraphqlClientOptions
): GraphqlClientOptions => ({
  ...base,
  ...next,
  headers: {
    ...(base?.headers as Record<string, string> | undefined),
    ...(next?.headers as Record<string, string> | undefined)
  },
  // Inner plugin's fetch overrides earlier ones if both define one. This is
  // the natural composition order: later plugins wrap earlier behavior.
  fetch: next?.fetch ?? base?.fetch,
  requestMiddleware: chainRequestMiddleware(
    base?.requestMiddleware,
    next?.requestMiddleware
  ),
  responseMiddleware: chainResponseMiddleware(
    base?.responseMiddleware,
    next?.responseMiddleware
  )
});

/**
 * Creates a `graphql-request` client with optional plugin composition. This
 * package never calls `fetch` on its own — if you don't pass a `fetch`
 * implementation (via `options` or a plugin), graphql-request falls back to
 * its built-in default. Consumers wanting retries, instrumentation, or any
 * other behavior must supply their own `fetch`.
 * @example Minimal
 * ```ts
 * const client = createGraphqlClient({
 *   endpoint: process.env.WORDPRESS_GRAPHQL_ENDPOINT!
 * });
 * ```
 * @example Composed
 * ```ts
 * const client = createGraphqlClient({
 *   endpoint: process.env.WORDPRESS_GRAPHQL_ENDPOINT!,
 *   options: { errorPolicy: 'all' },
 *   plugins: [
 *     withRequestLogger({ logger: console }),
 *     withResponseLogger({ logger: console })
 *   ]
 * });
 * ```
 */
export const createGraphqlClient = ({
  endpoint,
  options,
  plugins = []
}: {
  endpoint: string;
  options?: GraphqlClientOptions;
  plugins?: GraphqlClientPlugin[];
}): GraphQLClient => {
  const finalOptions = plugins.reduce<GraphqlClientOptions>(
    (acc, plugin) => mergeOptions(acc, plugin(acc)),
    options ?? {}
  );
  return new GraphQLClient(endpoint, finalOptions);
};

export { GraphQLClient };
