import type { GraphQLClient } from 'graphql-request';
import {
  createApqExecutor,
  createPassthroughExecutor,
  type ApqPostFallback,
  type GraphqlExecutor,
  type GraphqlRequestPlugin,
  type PostFallback
} from './apq.js';
import {
  createGraphqlClient,
  type GraphqlClientOptions,
  type GraphqlClientPlugin
} from './client.js';
import {
  createTimeoutFetch,
  withInstrumentedFetch,
  withRequestLogger,
  withResponseLogger,
  type StartSpanFn,
  type TimeoutFetchOptions
} from './middlewares.js';
import { createGraphqlTanstack, type GraphqlTanstack } from './tanstack.js';
import { createTrustedDocumentExecutor } from './trusted-documents.js';
import type { GraphqlLogger } from './utils.js';

// Re-exports of the core API. Consumers can also import from the dedicated
// subpaths (`@perimetre/graphql/middlewares`, `/apq`, `/tanstack`, `/codegen`)
// when they want a narrower import surface, but everything is reachable from
// here too.
export {
  applyEdgeCacheParam,
  contextFromDocument,
  createApqExecutor,
  createExecutor,
  createPassthroughExecutor,
  errorResponseMeta,
  notifyResponse,
  postViaClient,
  resolveRequestOptions,
  type ApqExecutorOptions,
  type ApqPostFallback,
  type ExecuteGraphqlRequest,
  type ExecuteGraphqlRequestWithMeta,
  type GraphqlExecuteResult,
  type GraphqlExecutor,
  type GraphqlRequestContext,
  type GraphqlRequestOptions,
  type GraphqlRequestPlugin,
  type GraphqlResponseMeta,
  type GraphqlResponseOutcome,
  type GraphqlTransport,
  type GraphqlTransportArgs,
  type GraphqlTransportResult,
  type PostFallback
} from './apq.js';
export {
  createGraphqlClient,
  GraphQLClient,
  type GraphqlClientOptions,
  type GraphqlClientPlugin
} from './client.js';
export {
  collapseGraphqlKeys,
  decodeRelayId,
  entryGraphqlKeys,
  GRAPHQL_KEYS_HEADER,
  GRAPHQL_UNKNOWN_DEPENDENCIES,
  hasGraphqlNodeKeys,
  parseGraphqlKeys,
  type CollapseGraphqlKeysOptions,
  type GraphqlKeys
} from './keys.js';
export {
  isEmptyGraphqlAnswer,
  stableStringify,
  withLastGood,
  type LastGoodClock,
  type LastGoodExecutor,
  type LastGoodFallback,
  type LastGoodOptions,
  type LastGoodResult,
  type LastGoodStore
} from './last-good.js';
export {
  createTimeoutFetch,
  RequestTimeoutError,
  type TimeoutFetchOptions
} from './middlewares.js';
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
 * passthrough otherwise; `.withMeta` for response headers), and the TanStack
 * helpers.
 */
export type WpGraphqlBundle = {
  client: GraphQLClient;
  /**
   * Data-only executor, callable as before. Also exposes
   * `.withMeta(document, variables, options)` which resolves to
   * `{ data, headers, transport, durationMs }` for the final response — the
   * per-call way to read e.g. WPGraphQL's `X-GraphQL-Keys` header.
   */
  executeGraphqlRequest: GraphqlExecutor;
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
  apqPostFallback,
  captureException,
  debug = false,
  endpoint,
  fetch: callerFetch,
  logger,
  options,
  persistedDocuments,
  plugins = [],
  requestPlugins,
  requestTimeout,
  requestTimeoutMs,
  startSpan,
  trustedDocuments = false,
  trustedDocumentsPostFallback
}: {
  /**
   * Opt into APQ routing (learn-at-runtime). When `true` **and**
   * `persistedDocuments` is set, queries route through WPGraphQL Smart Cache's
   * APQ GET transport (with a one-off register POST for documents the server
   * hasn't seen). Defaults to `false`. Requires `fetch` when enabled. Mutually
   * exclusive with `trustedDocuments`.
   */
  apq?: boolean;
  /**
   * When a failed APQ GET is re-sent as a POST. `'get-specific'` (default):
   * only for a 414 / 405, the failures a POST actually fixes; a timeout, a
   * network error, 401/403/429/5xx and GraphQL errors are rethrown. `'any'`
   * restores the pre-0.6 "POST on any failure", which doubles the load on a
   * CMS that is already failing — see {@link ApqPostFallback}.
   */
  apqPostFallback?: ApqPostFallback;
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
  /**
   * Per-request transport plugins with `onRequest` / `onResponse` hooks (see
   * {@link GraphqlRequestPlugin}). These run on **every request** and, unlike
   * `plugins` (which configure the `graphql-request` POST client once), can
   * shape the {@link GraphqlRequestOptions} that drive the cacheable GET URL —
   * e.g. inject an `edgeCache` TTL for build-time requests only. Threaded into
   * the active executor (APQ / Trusted Documents) and the TanStack helper.
   */
  requestPlugins?: GraphqlRequestPlugin[];
  /**
   * Tunes `requestTimeoutMs`: `enabled` (evaluated per request — e.g. off
   * during `next build`) and `messagePrefix` (default `'CMS request'`).
   */
  requestTimeout?: Pick<TimeoutFetchOptions, 'enabled' | 'messagePrefix'>;
  /**
   * A hard per-request limit, in ms, on every request this bundle sends
   * (persisted-query GET, register POST, client POST). Server-only — ignored
   * in the browser. On expiry the request rejects with a
   * `RequestTimeoutError` reading `CMS request timed out after <ms>ms (no
   * response)`, not the platform's abort text, which Sentry's
   * cancelled-request filters would drop. Composed with the caller's
   * `signal`; a caller abort still rejects as an abort. Requires `fetch`.
   * See `createTimeoutFetch`.
   */
  requestTimeoutMs?: number;
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
  /**
   * When a failed Trusted Documents GET is re-sent as a POST. `'get-specific'`
   * (default): only a 414 / 405, re-sent as a POST **by id** (no document
   * text, so the safelist holds); everything else is rethrown. `'any'`
   * restores the pre-0.6 "POST the document text on any failure". See
   * {@link PostFallback}.
   */
  trustedDocumentsPostFallback?: PostFallback;
}): WpGraphqlBundle => {
  if (apq && trustedDocuments) {
    throw new Error(
      '@perimetre/graphql: `apq` and `trustedDocuments` are mutually exclusive transports — enable one, not both.'
    );
  }
  if (requestTimeoutMs !== undefined && !callerFetch) {
    throw new Error(
      '@perimetre/graphql: createWpGraphql requires `fetch` when `requestTimeoutMs` is set (the timeout wraps it).'
    );
  }
  // Every transport below — the client's POST and the persisted-query GETs —
  // goes through the timed fetch, so no CMS request can outlive the limit.
  const fetchImpl =
    callerFetch && requestTimeoutMs !== undefined
      ? createTimeoutFetch({
          ...requestTimeout,
          fetch: callerFetch,
          timeoutMs: requestTimeoutMs
        })
      : callerFetch;

  const stack: GraphqlClientPlugin[] = [...plugins];
  if (logger) {
    stack.push(
      withRequestLogger({ logger, debug, endpoint }),
      withResponseLogger({ logger, captureException })
    );
  }
  if ((logger || startSpan) && fetchImpl) {
    stack.push(withInstrumentedFetch({ fetch: fetchImpl, logger, startSpan }));
  } else if (fetchImpl && fetchImpl !== callerFetch) {
    // No instrumentation to carry it: install the timed fetch on its own.
    stack.push(() => ({ fetch: fetchImpl }));
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

  let executeGraphqlRequest: GraphqlExecutor;
  if (trustedDocuments && fetchImpl) {
    executeGraphqlRequest = createTrustedDocumentExecutor({
      endpoint,
      client,
      fetch: fetchImpl,
      logger,
      postFallback: trustedDocumentsPostFallback,
      requestPlugins,
      startSpan
    });
  } else if (apq && persistedDocuments && fetchImpl) {
    executeGraphqlRequest = createApqExecutor({
      endpoint,
      client,
      persistedDocuments,
      fetch: fetchImpl,
      logger,
      postFallback: apqPostFallback,
      requestPlugins,
      startSpan
    });
  } else {
    executeGraphqlRequest = createPassthroughExecutor(client);
  }

  const tanstack = createGraphqlTanstack({
    client,
    executor: executeGraphqlRequest,
    requestPlugins,
    startSpan
  });

  return {
    client,
    executeGraphqlRequest,
    ...tanstack
  };
};
