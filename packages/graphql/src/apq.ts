import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { print } from 'graphql';
import { ClientError, type GraphQLClient } from 'graphql-request';
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
  /**
   * The caller's abort signal, handed to every `fetch` the request makes (the
   * persisted-query GET, the register POST, the client POST). An aborted
   * request is never re-sent over another transport: the caller gave up.
   */
  signal?: AbortSignal;
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
 * was received — including on a GraphQL error or non-2xx thrown as a
 * `ClientError` — and absent only when the request failed before any response
 * arrived (a timeout, an abort, a network error).
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
  extensions?: unknown;
};

/**
 * The error a persisted-query GET throws for a non-2xx or a GraphQL-errors
 * response: the same graphql-request `ClientError` the client's POST throws
 * for that response (`response.status`, `response.headers`, `response.body`,
 * plus `errors` / `data` when the body was GraphQL JSON), tagged `'apq-get'`
 * for {@link errorResponseMeta}. Catch sites and `onResponse` observers can't
 * tell the transports apart by the error's shape.
 */
const apqClientError = (
  res: Response,
  text: string,
  body: ApqResponse | undefined,
  document: unknown,
  variables: unknown
): ClientError =>
  tagErrorTransport(
    new ClientError(
      {
        ...body,
        body: text,
        data: body?.data,
        headers: res.headers,
        status: res.status
      } as ConstructorParameters<typeof ClientError>[0],
      {
        query: print(document as TypedDocumentNode),
        variables: variables as Record<string, unknown> | undefined
      }
    ),
    'apq-get'
  );

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
  /**
   * When a failed APQ GET is re-sent as a POST through `client` (see
   * {@link ApqPostFallback}). Defaults to `'get-specific'`.
   */
  postFallback?: ApqPostFallback;
  /** Per-request before/after hooks (see {@link GraphqlRequestPlugin}). */
  requestPlugins?: GraphqlRequestPlugin[];
  /** Optional Sentry-style span wrapper. */
  startSpan?: StartSpanFn;
};

/**
 * When the APQ executor re-sends a failed persisted-query GET as a POST.
 *
 * - `'get-specific'` (default): only when the failure is about the GET itself
 *   — HTTP 414 (URL too long) or 405 (GET not allowed). Everything else is
 *   rethrown as is: a timeout, an abort, a network error, 401/403/429/5xx, or
 *   GraphQL `errors` in the body. A POST would hit the same sick server, wait
 *   out the same timeout, and skip Smart Cache's network cache on the way.
 * - `'any'`: the pre-0.6 behaviour — any failure is re-sent as a POST. During
 *   an outage this doubles the load on the CMS and every read's latency, and
 *   keeps POSTing into a WAF that already answers 403. Only for a server whose
 *   GETs fail while POSTs work (a proxy that mangles query strings).
 *
 * `PersistedQueryNotFound` is not a failure: it always registers the document
 * with one POST, whatever this says. A caller abort never falls back.
 */
export type ApqPostFallback = 'any' | 'get-specific';

/** Statuses that mean "this server won't take the request as a GET". */
const GET_REJECTED_STATUSES = new Set([405, 414]);

/**
 * The transport each response-carrying error came from, so `onResponse` (and a
 * `.withMeta` caller, through {@link errorResponseMeta}) can tell a GET's
 * error from a POST's. Only errors raised from a received response are tagged:
 * a timeout or a network error has no transport to report.
 */
const errorTransports = new WeakMap<object, GraphqlTransport>();

/** Records which transport produced `error`'s response; returns `error`. */
const tagErrorTransport = <T>(error: T, transport: GraphqlTransport): T => {
  if (typeof error === 'object' && error !== null) {
    errorTransports.set(error, transport);
  }
  return error;
};

/**
 * The response metadata a thrown executor error carries: the headers of the
 * response that failed (a graphql-request `ClientError`'s
 * `response.headers`) and the transport it came back on. Both are absent when
 * the request failed before any response arrived.
 * @example Read `X-GraphQL-Keys` off a failed request
 * ```ts
 * try {
 *   await executeGraphqlRequest.withMeta(GetPageDocument, { uri });
 * } catch (error) {
 *   const { headers, transport } = errorResponseMeta(error);
 * }
 * ```
 */
export const errorResponseMeta = (
  error: unknown
): { headers?: Headers; transport?: GraphqlTransport } => ({
  headers: headersFromError(error),
  transport:
    typeof error === 'object' && error !== null
      ? errorTransports.get(error)
      : undefined
});

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
 * executor's POST fallback. A thrown `ClientError` is tagged `'post'` for
 * {@link errorResponseMeta}.
 */
export const postViaClient = async <TResult, TVariables>(
  client: GraphQLClient,
  document: TypedDocumentNode<TResult, TVariables>,
  variables: TVariables | undefined,
  signal?: AbortSignal
): Promise<GraphqlTransportResult<TResult>> => {
  try {
    const response = await client.rawRequest<TResult>({
      query: print(document),
      signal,
      variables: variables as object | undefined
    });
    return {
      data: response.data,
      headers: response.headers,
      transport: 'post'
    };
  } catch (error) {
    if (error instanceof ClientError) tagErrorTransport(error, 'post');
    throw error;
  }
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
        ...errorResponseMeta(error)
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
 * present, and uses the supplied client's POST transport for mutations,
 * unhashed documents, and GETs the server refuses as GETs (414 / 405 — see
 * {@link ApqPostFallback}; any other failure is rethrown, not re-sent).
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
  postFallback = 'get-specific',
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
    edgeCache?: number,
    signal?: AbortSignal
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
      }),
      signal
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
    edgeCache?: number,
    signal?: AbortSignal
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
            edgeCache,
            signal
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
          // The caller gave up: nothing to re-send.
          if (signal?.aborted) throw error;
          logger?.warn('graphql.apq.register_threw', {
            operationName,
            hash,
            message: error instanceof Error ? error.message : String(error)
          });
        }

        return postViaClient(client, document, variables, signal);
      }
    );
  };

  /**
   * A failed APQ GET: rethrown, or — only under `postFallback: 'any'`, and
   * never after a caller abort — re-sent as a POST through the client.
   */
  const failGet = async <TResult, TVariables>(
    error: unknown,
    {
      document,
      operationName,
      signal,
      status,
      variables
    }: {
      document: TypedDocumentNode<TResult, TVariables>;
      operationName: string;
      signal?: AbortSignal;
      status?: number;
      variables: TVariables | undefined;
    }
  ): Promise<GraphqlTransportResult<TResult>> => {
    const fallback = postFallback === 'any' && !signal?.aborted;
    logger?.warn('graphql.apq.transport_failed', {
      operationName,
      ...(status === undefined ? {} : { status }),
      fallback: fallback ? 'post' : 'none',
      message: error instanceof Error ? error.message : String(error)
    });
    if (!fallback) throw error;
    return postViaClient(client, document, variables, signal);
  };

  /**
   * The APQ transport: queries with a codegen-embedded hash go out as an APQ
   * GET — with a one-off register POST then GET if the server reports
   * `PersistedQueryNotFound`. Everything else (mutations, subscriptions,
   * unhashed documents) uses the supplied client's POST.
   *
   * A GET that fails is NOT re-sent as a POST unless the failure is about the
   * GET itself (414 / 405): see {@link ApqPostFallback}. A timeout, a 5xx or a
   * WAF 403 says the server is sick, and a POST only doubles the load on it.
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
    const { edgeCache, signal } = options;

    if (operationKind !== 'query' || !hash) {
      return postViaClient(client, document, variables, signal);
    }

    const apqUrl = buildApqGetUrl(
      endpoint,
      hash,
      operationName,
      variables ?? {},
      edgeCache
    );
    const failure = { document, operationName, signal, variables };
    return wrapSpan(
      `graphql.apq.${operationName}`,
      'graphql.query',
      { operationName, hash, transport: 'apq-get' },
      async (span) => {
        let res: Response;
        let text: string;
        try {
          res = await fetchImpl(apqUrl, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal
          });

          if (GET_REJECTED_STATUSES.has(res.status)) {
            // The server (or a proxy in front of it) won't take this as a GET:
            // the URL is too long, or GET isn't allowed. The POST is the fix.
            span?.setAttribute('graphql.apq.get_rejected', res.status);
            logger?.warn('graphql.apq.get_rejected_fallback_post', {
              operationName,
              status: res.status
            });
            return await postViaClient(client, document, variables, signal);
          }

          text = await res.text();
        } catch (error) {
          return await failGet(error, failure);
        }

        let body: ApqResponse | undefined;
        try {
          body = JSON.parse(text) as ApqResponse;
        } catch (error) {
          // A 2xx that isn't JSON (a WAF challenge page) is a failure; a non-2xx
          // that isn't JSON is reported by its status below.
          if (res.ok) return await failGet(error, failure);
        }

        if (!res.ok) {
          return await failGet(
            apqClientError(res, text, body, document, variables),
            { ...failure, status: res.status }
          );
        }

        const apqMiss = body?.errors?.some(
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
            edgeCache,
            signal
          );
        }

        if (body?.errors && body.errors.length > 0) {
          if (postFallback === 'any' && !signal?.aborted) {
            logger?.warn('graphql.apq.errors_fallback_post', {
              operationName,
              errorCount: body.errors.length
            });
            return await postViaClient(client, document, variables, signal);
          }

          logger?.warn('graphql.apq.errors', {
            operationName,
            errorCount: body.errors.length
          });
          // What the client's POST would do with the same body: throw a
          // `ClientError` under `errorPolicy: 'none'` (the default), hand back
          // the data under `'all'` / `'ignore'`.
          if ((client.requestConfig.errorPolicy ?? 'none') === 'none') {
            throw apqClientError(res, text, body, document, variables);
          }
        }

        return {
          data: body?.data as TResult,
          headers: res.headers,
          transport: 'apq-get'
        };
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
