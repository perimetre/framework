import type { GraphQLClient } from 'graphql-request';
import {
  createApqExecutor,
  createPassthroughExecutor,
  type ExecuteGraphqlRequest
} from './apq.js';
import {
  createGraphqlClient,
  type GraphqlClientOptions,
  type GraphqlClientPlugin
} from './client.js';
import {
  withInstrumentedFetch,
  withRequestLogger,
  withResponseLogger,
  type StartSpanFn
} from './middlewares.js';
import { createGraphqlTanstack, type GraphqlTanstack } from './tanstack.js';
import type { GraphqlLogger } from './utils.js';

// Re-exports of the core API. Consumers can also import from the dedicated
// subpaths (`@perimetre/graphql/middlewares`, `/apq`, `/tanstack`, `/codegen`)
// when they want a narrower import surface, but everything is reachable from
// here too.
export {
  createApqExecutor,
  createPassthroughExecutor,
  type ApqExecutorOptions,
  type ExecuteGraphqlRequest
} from './apq.js';
export {
  createGraphqlClient,
  GraphQLClient,
  type GraphqlClientOptions,
  type GraphqlClientPlugin
} from './client.js';
export {
  getOperationName,
  hostFromUrl,
  parseOperationName,
  type GraphqlLogger,
  type GraphqlRequestBody
} from './utils.js';

/**
 * Result of `createWpGraphql` — a one-shot, batteries-included setup that
 * returns everything a Perimetre WordPress project needs: the underlying
 * client, the request executor (APQ-routed if persisted docs are provided,
 * passthrough otherwise), and the TanStack helpers.
 */
export type WpGraphqlBundle = {
  client: GraphQLClient;
  executeGraphqlRequest: ExecuteGraphqlRequest;
} & GraphqlTanstack;

/**
 * Tier-based, opinionated factory matching the three setups in our reference
 * projects:
 *
 *   1. **Lean** — `graphql-request` only. Pass only `endpoint`.
 *   2. **TanStack** — adds `graphqlOptions` / `graphqlMutationOptions`.
 *   3. **Smart Cache + APQ** — pass `persistedDocuments` (codegen output)
 *      and a `fetch` implementation.
 *   4. **Full observability** — pass `logger` and `startSpan` to layer in
 *      request/response logging plus instrumented-fetch timings.
 *
 * Every layer is opt-in via the absence/presence of its option, so you can
 * dial features up and down per project without changing import shapes.
 *
 * **This package never calls Node's global `fetch` on its own.** APQ
 * routing and the instrumented-fetch middleware both need a `fetch` —
 * pass `globalThis.fetch` if you're happy with the built-in, or your own
 * wrapper (e.g. `withRetryFetch`) otherwise. graphql-request's own
 * transport falls back to its built-in `fetch` when you don't override it.
 */
export const createWpGraphql = ({
  captureException,
  debug = false,
  endpoint,
  fetch: fetchImpl,
  logger,
  options,
  persistedDocuments,
  plugins = [],
  startSpan
}: {
  /** Optional `Sentry.captureException` for hard errors. */
  captureException?: (
    error: unknown,
    context?: { tags?: Record<string, string> }
  ) => void;
  /** If true, also dump query/variables at debug level. */
  debug?: boolean;
  /** WPGraphQL endpoint URL (required). */
  endpoint: string;
  /**
   * `fetch` implementation. Required when `persistedDocuments` is set
   * (APQ executor needs it for its POST/GET calls) or when `logger` /
   * `startSpan` is set (the instrumented-fetch middleware wraps it). When
   * none of those are in use, the client falls back to graphql-request's
   * built-in fetch.
   */
  fetch?: typeof fetch;
  /** Optional structured logger (Sentry, console, pino…). */
  logger?: GraphqlLogger;
  /** Extra `graphql-request` options merged after all plugins. */
  options?: GraphqlClientOptions;
  /**
   * Hash → printed-query map from codegen. When present, queries route
   * through APQ GETs so WPGraphQL Smart Cache can serve them. Absent →
   * standard POST transport for everything.
   */
  persistedDocuments?: Record<string, string>;
  /** Extra plugins layered before the built-in logger/fetch instrumentation. */
  plugins?: GraphqlClientPlugin[];
  /** Optional Sentry-style `startSpan` for tracing fetch + executor calls. */
  startSpan?: StartSpanFn;
}): WpGraphqlBundle => {
  const stack: GraphqlClientPlugin[] = [...plugins];
  if (logger) {
    stack.push(
      withRequestLogger({ logger, debug, endpoint }),
      withResponseLogger({ logger, captureException })
    );
  }
  if ((logger || startSpan) && fetchImpl) {
    stack.push(withInstrumentedFetch({ fetch: fetchImpl, logger, startSpan }));
  }

  const client = createGraphqlClient({ endpoint, options, plugins: stack });

  if (persistedDocuments && !fetchImpl) {
    throw new Error(
      '@perimetre/graphql: createWpGraphql requires `fetch` when `persistedDocuments` is set (the APQ executor uses it for POST/GET calls).'
    );
  }

  const executeGraphqlRequest =
    persistedDocuments && fetchImpl
      ? createApqExecutor({
          endpoint,
          client,
          persistedDocuments,
          fetch: fetchImpl,
          logger,
          startSpan
        })
      : createPassthroughExecutor(client);

  const tanstack = createGraphqlTanstack({
    client,
    executor: executeGraphqlRequest,
    startSpan
  });

  return {
    client,
    executeGraphqlRequest,
    ...tanstack
  };
};
