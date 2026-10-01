import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { print } from 'graphql';
import type { GraphQLClient } from 'graphql-request';
import type { GraphqlSpan, StartSpanFn } from './middlewares.js';
import { OPERATION_DEFINITION_KIND, type GraphqlLogger } from './utils.js';

/**
 * Document with the codegen-emitted persisted-query hash attached under
 * `__meta__.hash`. `@graphql-codegen/client-preset` with
 * `persistedDocuments: { mode: 'embedHashInDocument' }` writes this onto
 * every generated `DocumentNode`.
 */
type DocumentWithHash = {
  __meta__?: { hash?: string };
  definitions?: readonly {
    kind: string;
    name?: { value?: string };
    operation?: string;
  }[];
};

/**
 * Reads the codegen-emitted persisted-query hash and the operation kind
 * (query / mutation / subscription) off a `TypedDocumentNode`. Only
 * queries get the APQ GET fast path — mutations and subscriptions always
 * use the standard POST transport.
 */
const apqMetaFromDocument = (
  document: unknown
): { hash?: string; operationKind: 'mutation' | 'query' | 'subscription' } => {
  const doc = document as DocumentWithHash;
  const hash = doc.__meta__?.hash;

  let operationKind: 'mutation' | 'query' | 'subscription' = 'query';
  const opDef = doc.definitions?.find(
    (d) => d.kind === OPERATION_DEFINITION_KIND
  );
  if (opDef?.operation === 'mutation') operationKind = 'mutation';
  else if (opDef?.operation === 'subscription') operationKind = 'subscription';

  return { hash, operationKind };
};

/**
 * Extracts the operation name from a parsed document so we can use it as
 * the `operationName` URL/body parameter when sending APQ requests. Falls
 * back to `'AnonymousOperation'` for hand-built documents with no name.
 */
const operationNameFromDocument = (document: unknown): string => {
  const doc = document as DocumentWithHash;
  const opDef = doc.definitions?.find(
    (d) => d.kind === OPERATION_DEFINITION_KIND
  );
  return opDef?.name?.value ?? 'AnonymousOperation';
};

/**
 * WPGraphQL Smart Cache only caches **GET** requests at the network layer.
 * To stay under the URL length limit (most edge proxies cap around 8 KB),
 * we use the Apollo Automatic Persisted Queries (APQ) protocol: send only
 * the sha256 hash of the query (the `queryId`), plus variables and
 * operationName. Smart Cache resolves the hash to the saved document and
 * executes it.
 *
 * ## Hashes now match — GET-first, POST-fallback
 *
 * The codegen hasher ({@link hashOperationForWpGraphqlSmartCache}) prints the
 * document the same way `graphql-php` does, so the embedded `queryId` equals
 * the id the server stores the persisted document under. That means the
 * **first** request for a hash can go straight out as an APQ **GET** and hit
 * the document — no POST-to-register round trip, no per-cold-start re-warm,
 * no tracking of a separate "server hash".
 *
 * The only time a GET misses is when the document has *never* been registered
 * on this server (e.g. a freshly-deployed query the CMS has not seen yet). In
 * that case Smart Cache replies with `PersistedQueryNotFound`; we register the
 * document with a single POST (which sends both `query` and `queryId`, so the
 * server saves it under the id we already use) and then resume GETs. Because
 * the hashes match, that POST happens at most once per *document lifetime per
 * server*, not once per process.
 *
 * Mutations and subscriptions never use the GET path — they always POST.
 */
const APQ_NOT_FOUND_ERROR = 'PersistedQueryNotFound';

/**
 * What `executeGraphqlRequest.withMeta()` resolves to: the operation's data
 * plus the response metadata.
 */
export type GraphqlExecuteResult<TResult> = {
  data: TResult;
} & GraphqlResponseMeta;

/**
 * Read-only metadata about the operation a {@link GraphqlRequestPlugin} is
 * acting on. Derived from the document — never the GraphQL inputs themselves
 * (those are the operation's concern, not the transport's). Both `onRequest`
 * and `onResponse` receive it.
 */
export type GraphqlRequestContext = {
  /** The codegen persisted-query hash, when the document carries one. */
  hash?: string;
  /** `query` rides the cacheable GET transport; the others always POST. */
  operationKind: 'mutation' | 'query' | 'subscription';
  /** The operation name (`'AnonymousOperation'` for unnamed documents). */
  operationName: string;
};

/**
 * Per-request options that callers can attach to a single GraphQL operation
 * (alongside its variables). These are transport hints, not GraphQL inputs —
 * they tune *how* the request is sent, not *what* it asks for.
 */
export type GraphqlRequestOptions = {
  /**
   * Edge-cache TTL as a non-negative integer number of **seconds**. When set,
   * the request is sent with an `?edgeCache=<seconds>` query var; the server
   * responds with a matching `Cache-Control: max-age` and the request becomes
   * cacheable at the edge for that long. Without the var, responses stay
   * uncacheable (the global default is `max-age=0`), so opting in is per-call.
   *
   * Only takes effect on the cacheable GET transport (a hashed query under APQ
   * / Trusted Documents) — it's ignored for mutations, subscriptions, unhashed
   * documents, and the passthrough POST transport.
   *
   * **Invalidation is TTL-only** — the edge cannot purge by tag, so a cached
   * response can serve stale up to its TTL after the content changes. Keep TTLs
   * short (≈30–60s) for anything where staleness is user-visible. A
   * non-integer / negative TTL is dropped (the var stays part of the edge cache
   * key, so it must stay byte-stable).
   */
  edgeCache?: number;
};

/**
 * Metadata about the HTTP response that produced a result: the **final**
 * response's headers (after any APQ register / POST fallback), which
 * transport delivered it, and how long the whole request took.
 */
export type GraphqlResponseMeta = {
  /** Wall-clock time from just before the request to its settlement. */
  durationMs: number;
  /**
   * The raw fetch `Response.headers` of the response that produced `data`.
   * For WPGraphQL this is where `X-GraphQL-Keys` lives — see
   * `parseGraphqlKeys` in `@perimetre/graphql/keys`.
   */
  headers: Headers;
  /** Which wire path produced the response. */
  transport: GraphqlTransport;
};

/**
 * The outcome handed to a plugin's `onResponse` hook. `data` and `error` are
 * mutually exclusive. `headers` / `transport` are present whenever a response
 * was received — including on a GraphQL error thrown as a `ClientError` —
 * and absent only when the request failed before any response arrived.
 */
export type GraphqlResponseOutcome = {
  data?: unknown;
  durationMs: number;
  error?: unknown;
  headers?: Headers;
  transport?: GraphqlTransport;
};

/**
 * Which wire path a response came back on. Useful to assert (in tests and
 * logs) that the headers you're reading belong to the response that actually
 * produced the data — e.g. after an APQ miss, `'apq-register-post'` or
 * `'post'` rather than the GET that missed.
 */
export type GraphqlTransport =
  | 'apq-get'
  | 'apq-register-post'
  | 'post'
  | 'trusted-get';

/**
 * Builds the {@link GraphqlRequestContext} for a document — the single place
 * that reads `__meta__.hash` and the operation definition. Shared by every
 * executor and the TanStack helper so they all hand plugins the same context
 * for a given document (the helper needs it to resolve options for the query
 * key with the same inputs the executor will use).
 */
export const contextFromDocument = (
  document: unknown
): GraphqlRequestContext => ({
  ...apqMetaFromDocument(document),
  operationName: operationNameFromDocument(document)
});

/**
 * A per-request transport plugin with before/after hooks. Registered on
 * `createWpGraphql` via `requestPlugins`; the hooks run on **every request**.
 *
 * Unlike {@link GraphqlClientPlugin} (which configures the `graphql-request`
 * POST client once, at construction), an `onRequest` hook shapes the transport
 * hints ({@link GraphqlRequestOptions}) that control the cacheable GET URL —
 * the one layer a client plugin can't reach. Use it for cross-cutting rules
 * like "edge-cache everything during the static build" without touching call
 * sites. `onResponse` is the symmetric after-hook for timing/observation.
 *
 * (Distinct from graphql-request's `RequestMiddleware`/`ResponseMiddleware`,
 * which wrap the raw HTTP POST inside `client.request` — they never see the
 * persisted-query GET path these hooks exist to influence.)
 */
export type GraphqlRequestPlugin = {
  /**
   * Runs **before** the request. Given the operation context and the options
   * resolved so far, return the options to use (or `void` / the same object to
   * leave them unchanged). Across `requestPlugins`, `onRequest` hooks run
   * left-to-right, each receiving the previous one's output; the caller's own
   * per-call `options` are the chain's initial input — so a plugin that only
   * supplies a *default* should leave a field it finds already set untouched.
   *
   * **Must be pure.** It can be invoked more than once for a single logical
   * request (the TanStack helper resolves options once to build the query key,
   * then the executor resolves them again to send), so it must be a pure
   * function of `(context, options)` with no side effects.
   */
  onRequest?: (
    context: GraphqlRequestContext,
    options: GraphqlRequestOptions
  ) => GraphqlRequestOptions | undefined;
  /**
   * Runs **after** the request settles, with the operation context and the
   * outcome: `data` on success, `error` on failure (mutually exclusive), plus
   * `durationMs` measured from just before the request, and — whenever a
   * response was received — the final response's `headers` and `transport`.
   * Observation only — the return value is ignored and it must not throw (a
   * throw is swallowed so it can't mask the real result). Only invoked on the
   * executor's request path, not when the TanStack helper resolves options for
   * the query key.
   */
  onResponse?: (
    context: GraphqlRequestContext,
    result: GraphqlResponseOutcome
  ) => void;
};

/**
 * Folds the per-call `options` through every plugin's `onRequest` hook
 * left-to-right and returns the resolved transport options. Shared by the
 * executors and the TanStack helper so resolution is identical everywhere. With
 * no plugins the caller's options pass through unchanged. A hook returning
 * `void` (or a falsy value) is treated as "no change".
 */
export const resolveRequestOptions = (
  plugins: GraphqlRequestPlugin[] | undefined,
  context: GraphqlRequestContext,
  options: GraphqlRequestOptions | undefined
): GraphqlRequestOptions => {
  let resolved: GraphqlRequestOptions = options ?? {};
  if (plugins) {
    for (const plugin of plugins) {
      if (!plugin.onRequest) continue;
      resolved = plugin.onRequest(context, resolved) ?? resolved;
    }
  }
  return resolved;
};

/**
 * Notifies every plugin's `onResponse` hook that a request settled. Swallows
 * hook errors so a misbehaving observer can't change the request's outcome.
 */
export const notifyResponse = (
  plugins: GraphqlRequestPlugin[] | undefined,
  context: GraphqlRequestContext,
  result: GraphqlResponseOutcome
): void => {
  if (!plugins) return;
  for (const plugin of plugins) {
    if (!plugin.onResponse) continue;
    try {
      plugin.onResponse(context, result);
    } catch {
      // An observation hook must never take down the request it's observing.
    }
  }
};

type ApqResponse = {
  data?: unknown;
  errors?: { message: string }[];
};

/**
 * Appends the shared edge-cache query param to a persisted-query URL when a
 * TTL is supplied. Shared by the APQ and Trusted Documents transports so the
 * param shape stays identical across both.
 *
 * The TTL is required to be a non-negative **integer** number of seconds and
 * is emitted in its canonical decimal form. Varnish keys its cache on
 * `hash_data(req.url)`, so the param's exact text is part of the cache key —
 * normalizing to an integer keeps `{ edgeCache: 300 }` from fragmenting into
 * separate entries for `300`, `300.0`, etc. (and a fractional `max-age` is
 * meaningless anyway). A non-integer, non-finite, or negative TTL is dropped
 * rather than written as a bad cache directive.
 */
export const applyEdgeCacheParam = (
  url: URL,
  edgeCache: number | undefined
): void => {
  if (
    typeof edgeCache === 'number' &&
    Number.isInteger(edgeCache) &&
    edgeCache >= 0
  ) {
    url.searchParams.set('edgeCache', String(edgeCache));
  }
};

/**
 * Builds the APQ GET URL with `queryId`, `operationName`, and serialized
 * `variables` query params. Splitting the params this way keeps every
 * variant of the same operation on a single URL key, which is what Smart
 * Cache's network cache uses for its lookup. A caller-supplied `edgeCache`
 * TTL is appended as the `edgeCache` param so the server can set
 * `Cache-Control` and the edge cache can store the GET.
 */
const buildApqGetUrl = (
  endpoint: string,
  hash: string,
  operationName: string,
  variables: unknown,
  edgeCache?: number
): string => {
  const url = new URL(endpoint);
  url.searchParams.set('queryId', hash);
  url.searchParams.set('operationName', operationName);
  if (variables && Object.keys(variables as object).length > 0) {
    url.searchParams.set('variables', JSON.stringify(variables));
  }
  applyEdgeCacheParam(url, edgeCache);
  return url.href;
};

/**
 * Options for `createApqExecutor`. `fetch` is required so the executor never
 * reaches for Node's global `fetch` on its own — pass `globalThis.fetch` if
 * you're happy with the built-in, or your instrumented/retrying wrapper.
 */
export type ApqExecutorOptions = {
  /** Fallback `graphql-request` client for mutations and unhashed documents. */
  client: GraphQLClient;
  /** The WPGraphQL endpoint URL. */
  endpoint: string;
  /**
   * The `fetch` implementation used for APQ POST registration and APQ GET
   * requests. Required — pass `globalThis.fetch` or a wrapped version.
   */
  fetch: typeof fetch;
  /** Optional logger. Sentry's logger or `console` both work. */
  logger?: GraphqlLogger;
  /** The hash → printed query string map from codegen. */
  persistedDocuments: Record<string, string>;
  /** Per-request before/after hooks (see {@link GraphqlRequestPlugin}). */
  requestPlugins?: GraphqlRequestPlugin[];
  /** Optional Sentry-style span wrapper. */
  startSpan?: StartSpanFn;
};

/**
 * The data-only execute signature. Resolves to the operation's `data`, the
 * same shape `client.request` returns — what `graphqlOptions` feeds TanStack.
 */
export type ExecuteGraphqlRequest = <TResult, TVariables>(
  document: TypedDocumentNode<TResult, TVariables>,
  variables?: TVariables,
  options?: GraphqlRequestOptions
) => Promise<TResult>;

/**
 * The metadata-returning execute signature: same inputs as
 * {@link ExecuteGraphqlRequest}, resolves to `{ data, headers, transport,
 * durationMs }` for the **final** response (after any APQ register or POST
 * fallback). This is the per-call way to read response headers — e.g.
 * WPGraphQL's `X-GraphQL-Keys` — without a global hook.
 */
export type ExecuteGraphqlRequestWithMeta = <TResult, TVariables>(
  document: TypedDocumentNode<TResult, TVariables>,
  variables?: TVariables,
  options?: GraphqlRequestOptions
) => Promise<GraphqlExecuteResult<TResult>>;

/**
 * What every executor factory returns: callable as a plain
 * {@link ExecuteGraphqlRequest} (data only, unchanged), with a `.withMeta`
 * variant that also returns the response headers. Anything typed as
 * `ExecuteGraphqlRequest` accepts a `GraphqlExecutor`, so existing call sites
 * and custom executors keep compiling.
 */
export type GraphqlExecutor = {
  withMeta: ExecuteGraphqlRequestWithMeta;
} & ExecuteGraphqlRequest;

/** Inputs to a transport runner, resolved by the executor shell. */
export type GraphqlTransportArgs<TResult, TVariables> = {
  /** The operation context derived from the document. */
  context: GraphqlRequestContext;
  document: TypedDocumentNode<TResult, TVariables>;
  /** Transport options after the `onRequest` plugin chain has run. */
  options: GraphqlRequestOptions;
  variables: TVariables | undefined;
};

/**
 * What a transport hands back to the executor shell before timing is
 * attached: the data, the headers of the response it came from, and which
 * wire path delivered it.
 */
export type GraphqlTransportResult<TResult> = {
  data: TResult;
  headers: Headers;
  transport: GraphqlTransport;
};

/** The transport logic an executor plugs into {@link createExecutor}. */
type TransportRunner = <TResult, TVariables>(
  args: GraphqlTransportArgs<TResult, TVariables>
) => Promise<GraphqlTransportResult<TResult>>;

/**
 * Pulls the response headers off a thrown error when it carries them.
 * graphql-request's `ClientError` exposes `error.response.headers` for a
 * GraphQL-error or non-2xx response, so `onResponse` observers can still read
 * e.g. `X-GraphQL-Keys` on a failed request. Duck-typed on purpose so it works
 * across duplicated `graphql-request` copies.
 */
const headersFromError = (error: unknown): Headers | undefined => {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }
  const response = (error as { response?: unknown }).response;
  if (
    typeof response !== 'object' ||
    response === null ||
    !('headers' in response)
  ) {
    return undefined;
  }
  const headers = (response as { headers?: unknown }).headers;
  return headers instanceof Headers ? headers : undefined;
};

/**
 * Sends an operation over the standard POST transport via the supplied
 * `graphql-request` client and returns its data **with** the response headers.
 * Uses `client.rawRequest` (which runs the same request/response middlewares
 * and `errorPolicy` as `client.request`, but keeps `headers`/`status`) so the
 * POST path can surface headers like the GET paths do. Shared by every
 * executor's POST fallback.
 */
export const postViaClient = async <TResult, TVariables>(
  client: GraphQLClient,
  document: TypedDocumentNode<TResult, TVariables>,
  variables: TVariables | undefined
): Promise<GraphqlTransportResult<TResult>> => {
  const response = await client.rawRequest<TResult>(
    print(document),
    variables as object | undefined
  );
  return { data: response.data, headers: response.headers, transport: 'post' };
};

/**
 * Builds a {@link GraphqlExecutor} around a transport runner. Owns everything
 * the transports share: deriving the operation context, folding per-call
 * options through the `onRequest` plugin chain, timing the request, notifying
 * `onResponse` once it settles either way (with the final response's headers
 * when there are any), and exposing both the data-only call and `.withMeta`.
 */
export const createExecutor = ({
  requestPlugins,
  run
}: {
  requestPlugins?: GraphqlRequestPlugin[];
  run: TransportRunner;
}): GraphqlExecutor => {
  /** Runs the transport and returns data plus the final response's metadata. */
  const withMeta: ExecuteGraphqlRequestWithMeta = async (
    document,
    variables,
    options
  ) => {
    const context = contextFromDocument(document);
    const resolved = resolveRequestOptions(requestPlugins, context, options);
    const startedAt = Date.now();

    try {
      const result = await run({
        context,
        document,
        options: resolved,
        variables
      });
      const durationMs = Date.now() - startedAt;
      notifyResponse(requestPlugins, context, {
        data: result.data,
        durationMs,
        headers: result.headers,
        transport: result.transport
      });
      return { ...result, durationMs };
    } catch (error) {
      notifyResponse(requestPlugins, context, {
        durationMs: Date.now() - startedAt,
        error,
        headers: headersFromError(error)
      });
      throw error;
    }
  };

  /** The data-only call — `withMeta` minus the metadata. */
  const execute: ExecuteGraphqlRequest = async (document, variables, options) =>
    (await withMeta(document, variables, options)).data;

  return Object.assign(execute, { withMeta });
};

/**
 * Creates an `executeGraphqlRequest` helper that routes queries through
 * WPGraphQL Smart Cache's APQ flow when the codegen-embedded hash is
 * present, and falls back to the supplied client's POST transport for
 * mutations, unhashed documents, or any APQ transport failure.
 *
 * Because the codegen hash matches the server's normalized persisted-query
 * id, the executor issues an APQ **GET** first. On the rare
 * `PersistedQueryNotFound` (the document was never registered on this server),
 * it registers the document with one POST and retries the GET, so subsequent
 * callers stay on the cacheable GET fast path.
 *
 * The returned executor also exposes `.withMeta(document, variables, options)`
 * which resolves to `{ data, headers, transport, durationMs }` — the headers
 * are always those of the response that produced `data`, so after a miss you
 * get the register POST's (or the fallback POST's) headers, not the GET's.
 */
export const createApqExecutor = ({
  client,
  endpoint,
  fetch: fetchImpl,
  logger,
  persistedDocuments,
  requestPlugins,
  startSpan
}: ApqExecutorOptions): GraphqlExecutor => {
  /**
   * Wraps `fn` in a span when `startSpan` is configured; runs it bare
   * otherwise. Lets the executor be tracer-agnostic.
   */
  const wrapSpan = async <T>(
    name: string,
    op: string,
    attributes: Record<string, boolean | number | string>,
    fn: (span?: GraphqlSpan) => Promise<T>
  ): Promise<T> => {
    if (!startSpan) return fn();
    return startSpan({ name, op, attributes }, (span) => fn(span));
  };

  /**
   * Registers a persisted query on the WPGraphQL Smart Cache server and
   * returns the executed response (body + headers) in the same round trip.
   * Sends both `query` and `queryId` so the server saves the document under
   * the *same* id the client already uses — no second identifier to track.
   * Returns `null` when there's no persisted-documents entry for the hash
   * (callers fall through to the regular client).
   */
  const registerViaApqPost = async (
    hash: string,
    operationName: string,
    variables: unknown,
    edgeCache?: number
  ): Promise<{ body: ApqResponse; headers: Headers } | null> => {
    const query = persistedDocuments[hash];
    if (!query) return null;

    // The register POST primes the server with the document; carry the same
    // `edgeCache` TTL on its URL so the server can set `Cache-Control` on this
    // response too (the next caller stays on the cacheable GET fast path).
    const postUrl = new URL(endpoint);
    applyEdgeCacheParam(postUrl, edgeCache);

    const res = await fetchImpl(postUrl.href, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        operationName,
        query,
        queryId: hash,
        variables: variables ?? {}
      })
    });

    if (!res.ok) {
      throw new Error(`APQ POST returned HTTP ${String(res.status)}`);
    }

    return { body: (await res.json()) as ApqResponse, headers: res.headers };
  };

  /**
   * Registers the document via POST and returns its response, falling back to
   * the regular client if registration has no entry or fails. Used when an APQ
   * GET misses because the document was never registered on this server.
   */
  const registerAndExecute = async <TResult, TVariables>(
    hash: string,
    operationName: string,
    document: TypedDocumentNode<TResult, TVariables>,
    variables?: TVariables,
    edgeCache?: number
  ): Promise<GraphqlTransportResult<TResult>> => {
    return wrapSpan(
      `graphql.apq.register.${operationName}`,
      'graphql.query',
      { operationName, hash, transport: 'apq-register-post' },
      async () => {
        try {
          const registered = await registerViaApqPost(
            hash,
            operationName,
            variables,
            edgeCache
          );

          if (
            registered &&
            !registered.body.errors &&
            registered.body.data !== undefined
          ) {
            return {
              data: registered.body.data as TResult,
              headers: registered.headers,
              transport: 'apq-register-post'
            };
          }

          logger?.warn('graphql.apq.register_failed', {
            operationName,
            hash,
            hadErrors: !!registered?.body.errors
          });
        } catch (error) {
          logger?.warn('graphql.apq.register_threw', {
            operationName,
            hash,
            message: error instanceof Error ? error.message : String(error)
          });
        }

        return postViaClient(client, document, variables);
      }
    );
  };

  /**
   * The APQ transport: queries with a codegen-embedded hash go out as an APQ
   * GET — with a one-off register POST then GET if the server reports
   * `PersistedQueryNotFound`. Everything else (mutations, subscriptions,
   * unhashed documents) falls back to the supplied client's POST.
   */
  const run: TransportRunner = async <TResult, TVariables>({
    context,
    document,
    options,
    variables
  }: GraphqlTransportArgs<TResult, TVariables>): Promise<
    GraphqlTransportResult<TResult>
  > => {
    const { hash, operationKind, operationName } = context;
    const edgeCache = options.edgeCache;

    if (operationKind !== 'query' || !hash) {
      return postViaClient(client, document, variables);
    }

    const apqUrl = buildApqGetUrl(
      endpoint,
      hash,
      operationName,
      variables ?? {},
      edgeCache
    );
    return wrapSpan(
      `graphql.apq.${operationName}`,
      'graphql.query',
      { operationName, hash, transport: 'apq-get' },
      async (span) => {
        try {
          const res = await fetchImpl(apqUrl, {
            method: 'GET',
            headers: { Accept: 'application/json' }
          });

          if (!res.ok) {
            throw new Error(`APQ GET returned HTTP ${String(res.status)}`);
          }

          const body = (await res.json()) as ApqResponse;

          const apqMiss = body.errors?.some(
            (err) => err.message === APQ_NOT_FOUND_ERROR
          );
          if (apqMiss) {
            span?.setAttribute('graphql.apq.miss', true);
            logger?.info('graphql.apq.miss_register', {
              operationName,
              hash
            });
            // The document was never registered on this server. Register it
            // with one POST (same id we already use) and execute in the same
            // round trip; the next caller for this hash gets the GET fast path.
            return await registerAndExecute(
              hash,
              operationName,
              document,
              variables,
              edgeCache
            );
          }

          if (body.errors && body.errors.length > 0) {
            logger?.warn('graphql.apq.errors_fallback_post', {
              operationName,
              errorCount: body.errors.length
            });
            return await postViaClient(client, document, variables);
          }

          return {
            data: body.data as TResult,
            headers: res.headers,
            transport: 'apq-get'
          };
        } catch (error) {
          logger?.warn('graphql.apq.transport_failed', {
            operationName,
            message: error instanceof Error ? error.message : String(error)
          });
          return await postViaClient(client, document, variables);
        }
      }
    );
  };

  return createExecutor({ requestPlugins, run });
};

/**
 * Default executor that bypasses APQ and uses the standard POST transport.
 * Use this when you want a single uniform `executeGraphqlRequest` import
 * shape across projects, regardless of whether APQ is enabled.
 *
 * The third `options` argument (e.g. `edgeCache`) is accepted for signature
 * compatibility but ignored — POSTs aren't edge-cached, so there's no URL to
 * attach the param to. `.withMeta` works here too, so a project can read
 * response headers before it opts into a persisted-query transport.
 */
export const createPassthroughExecutor = (
  client: GraphQLClient
): GraphqlExecutor =>
  createExecutor({
    /** Always POST via the client; headers come from `rawRequest`. */
    run: async <TResult, TVariables>({
      document,
      variables
    }: GraphqlTransportArgs<TResult, TVariables>) =>
      postViaClient(client, document, variables)
  });
