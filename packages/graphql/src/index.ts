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
import { createTrustedDocumentExecutor } from './trusted-documents.js';
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
  createTrustedDocumentExecutor,
  registerTrustedDocuments,
  TrustedDocumentNotRegisteredError,
  type RegisterTrustedDocumentsOptions,
  type RegisterTrustedDocumentsResult,
  type TrustedDocumentExecutorOptions,
  type TrustedDocumentRegistration
} from './trusted-documents.js';
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
 * Tier-based, opinionated factory matching the setups in our reference
 * projects:
 *
 *   1. **Lean** — `graphql-request` only. Pass only `endpoint`.
 *   2. **TanStack** — adds `graphqlOptions` / `graphqlMutationOptions`.
 *   3. **Full observability** — pass `logger` and `startSpan` to layer in
 *      request/response logging plus instrumented-fetch timings.
 *   4. **Smart Cache + APQ** — set `apq: true`, pass `persistedDocuments`
 *      (codegen output) and a `fetch` implementation.
 *   5. **Trusted Documents** — set `trustedDocuments: true` + `fetch`. Queries
 *      go out as GET-by-id only; documents are expected to be safelisted ahead
 *      of time via `registerTrustedDocuments`. An unknown id is a hard error,
 *      never learned at runtime.
 *
 * Every layer is opt-in. The full toolkit (logging, retry, instrumented
 * fetch, TanStack helpers) works **with or without** a persisted-query
 * transport — neither APQ nor Trusted Documents is an implicit side effect of
 * having persisted documents around.
 *
 * **APQ vs Trusted Documents are different transports — pick one.** APQ learns
 * documents at runtime (register-on-miss POST); Trusted Documents requires
 * them to be safelisted ahead of time and refuses unknown ids. Enabling both
 * is a configuration error and throws.
 *
 * **APQ is off unless you ask for it.** It turns on only when `apq: true`
 * **and** `persistedDocuments` is provided (and a `fetch` is supplied for the
 * APQ GET/POST calls). Omit `apq` — or pass `apq: false` — to keep everything
 * else and route every operation over the standard POST transport. This lets
 * you wire up `persistedDocuments` for codegen/tooling without forcing the APQ
 * transport on, and lets you disable APQ at runtime without unwiring codegen.
 *
 * **This package never calls Node's global `fetch` on its own.** APQ routing
 * and the instrumented-fetch middleware both need a `fetch` — pass
 * `globalThis.fetch` if you're happy with the built-in, or your own wrapper
 * (e.g. `withRetryFetch`) otherwise. graphql-request's own transport falls
 * back to its built-in `fetch` when you don't override it.
 */
export const createWpGraphql = ({
  apq = false,
  captureException,
  debug = false,
  endpoint,
  fetch: fetchImpl,
  logger,
  options,
  persistedDocuments,
  plugins = [],
  startSpan,
  trustedDocuments = false
}: {
  /**
   * Opt into APQ routing (learn-at-runtime). When `true` **and**
   * `persistedDocuments` is set, queries route through WPGraphQL Smart Cache's
   * APQ GET transport (with a one-off register POST for documents the server
   * hasn't seen). Defaults to `false`. Requires `fetch` when enabled. Mutually
   * exclusive with `trustedDocuments`.
   */
  apq?: boolean;
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
   * `fetch` implementation. Required when `apq` is enabled (the APQ executor
   * needs it for its POST/GET calls) or when `logger` / `startSpan` is set
   * (the instrumented-fetch middleware wraps it). When none of those are in
   * use, the client falls back to graphql-request's built-in fetch.
   */
  fetch?: typeof fetch;
  /** Optional structured logger (Sentry, console, pino…). */
  logger?: GraphqlLogger;
  /** Extra `graphql-request` options merged after all plugins. */
  options?: GraphqlClientOptions;
  /**
   * Hash → printed-query map from codegen. Required to enable APQ (alongside
   * `apq: true`). Harmless to provide without `apq: true` — it's simply
   * ignored by the transport in that case.
   */
  persistedDocuments?: Record<string, string>;
  /** Extra plugins layered before the built-in logger/fetch instrumentation. */
  plugins?: GraphqlClientPlugin[];
  /** Optional Sentry-style `startSpan` for tracing fetch + executor calls. */
  startSpan?: StartSpanFn;
  /**
   * Opt into the Trusted Documents (safelisting) transport. When `true`,
   * queries are sent as a persisted-query GET by id and nothing else —
   * documents must be safelisted ahead of time with `registerTrustedDocuments`
   * (e.g. at deploy time); an unknown id throws `TrustedDocumentNotRegisteredError`
   * rather than being learned at runtime. Defaults to `false`. Requires
   * `fetch` when enabled. Mutually exclusive with `apq`.
   */
  trustedDocuments?: boolean;
}): WpGraphqlBundle => {
  if (apq && trustedDocuments) {
    throw new Error(
      '@perimetre/graphql: `apq` and `trustedDocuments` are mutually exclusive transports — enable one, not both.'
    );
  }
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

  // The persisted-query transports are opt-in and distinct:
  //   - APQ (learn-at-runtime) turns on with `apq: true` + `persistedDocuments`.
  //   - Trusted Documents (safelist) turns on with `trustedDocuments: true`;
  //     it reads `__meta__.hash` off the document and GETs by id only, so it
  //     doesn't need the `persistedDocuments` map at runtime.
  // Both make raw GET/POST calls, so both require a `fetch`.
  if (apq && persistedDocuments && !fetchImpl) {
    throw new Error(
      '@perimetre/graphql: createWpGraphql requires `fetch` when `apq` is enabled (the APQ executor uses it for POST/GET calls).'
    );
  }
  if (trustedDocuments && !fetchImpl) {
    throw new Error(
      '@perimetre/graphql: createWpGraphql requires `fetch` when `trustedDocuments` is enabled (the executor uses it for GET calls).'
    );
  }

  let executeGraphqlRequest: ExecuteGraphqlRequest;
  if (trustedDocuments && fetchImpl) {
    executeGraphqlRequest = createTrustedDocumentExecutor({
      endpoint,
      client,
      fetch: fetchImpl,
      logger,
      startSpan
    });
  } else if (apq && persistedDocuments && fetchImpl) {
    executeGraphqlRequest = createApqExecutor({
      endpoint,
      client,
      persistedDocuments,
      fetch: fetchImpl,
      logger,
      startSpan
    });
  } else {
    executeGraphqlRequest = createPassthroughExecutor(client);
  }

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
