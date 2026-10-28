import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { GraphQLClient } from 'graphql-request';
import {
  applyEdgeCacheParam,
  createExecutor,
  GET_REJECTED_STATUSES,
  persistedQueryClientError,
  postViaClient,
  type GraphqlExecutor,
  type GraphqlRequestPlugin,
  type GraphqlTransportArgs,
  type GraphqlTransportResult,
  type PersistedQueryResponse,
  type PostFallback
} from './apq.js';
import type { GraphqlSpan, StartSpanFn } from './middlewares.js';
import type { GraphqlLogger } from './utils.js';

/**
 * # Trusted Documents (a.k.a. Saved Queries / safelisting)
 *
 * This module implements the **trusted-documents** pattern for WPGraphQL Smart
 * Cache, which is deliberately a **separate path from APQ**:
 *
 * - **APQ** ({@link createApqExecutor}) is *learn-at-runtime*: the first client
 *   to ask for an unknown hash teaches the server the document via a register
 *   POST, then everyone GETs it. It's a bandwidth/caching optimization.
 * - **Trusted Documents** is *safelist-ahead-of-time*: every document the app
 *   can issue is registered on the server **once, at deploy time**
 *   ({@link registerTrustedDocuments}). The runtime executor
 *   ({@link createTrustedDocumentExecutor}) then *only* issues GETs by id and
 *   **never** registers anything — an unknown id is a hard error, not a cue to
 *   learn. That's the security property: the server executes only operations
 *   your developers authored and shipped.
 *
 * Both reference documents by the same id (the `graphql-php`-compatible hash
 * from {@link hashOperationForWpGraphqlSmartCache}), and both ride WPGraphQL
 * Smart Cache's persisted-query GET transport — but they are different
 * contracts and should not be mixed on one client.
 *
 * See: https://benjie.dev/graphql/trusted-documents and
 * https://github.com/wp-graphql/wp-graphql-smart-cache/blob/main/docs/persisted-queries.md
 */

const APQ_NOT_FOUND_ERROR = 'PersistedQueryNotFound';

/**
 * Builds the persisted-query GET URL — `queryId` + `operationName` +
 * serialized `variables` — the same shape WPGraphQL Smart Cache's network
 * cache keys on. A caller-supplied `edgeCache` TTL is appended as the
 * `edgeCache` param so the server can set `Cache-Control` and the edge cache
 * can store the GET.
 */
const buildGetUrl = (
  endpoint: string,
  id: string,
  operationName: string,
  variables: unknown,
  edgeCache?: number
): string => {
  const url = new URL(endpoint);
  url.searchParams.set('queryId', id);
  url.searchParams.set('operationName', operationName);
  if (variables && Object.keys(variables as object).length > 0) {
    url.searchParams.set('variables', JSON.stringify(variables));
  }
  applyEdgeCacheParam(url, edgeCache);
  return url.href;
};

// ---------------------------------------------------------------------------
// Runtime executor — GET-only, never registers
// ---------------------------------------------------------------------------

/**
 * Options for {@link createTrustedDocumentExecutor}.
 */
export type TrustedDocumentExecutorOptions = {
  /** Fallback `graphql-request` client for mutations and unhashed documents. */
  client: GraphQLClient;
  /** The WPGraphQL endpoint URL. */
  endpoint: string;
  /**
   * The `fetch` implementation used for the persisted-query GET calls.
   * Required — pass `globalThis.fetch` or a wrapped (retry/instrumented)
   * version. The package never reaches for the global `fetch` on its own.
   */
  fetch: typeof fetch;
  /** Optional logger. Sentry's logger or `console` both work. */
  logger?: GraphqlLogger;
  /**
   * When a failed GET is re-sent as a POST. `'get-specific'` (default): a
   * 414 / 405 is re-sent as a POST **by id** (no document text); a timeout,
   * a network error, 401/403/429/5xx and GraphQL errors are rethrown. `'any'`:
   * the pre-0.6 behaviour — any other failure is re-sent through the client's
   * POST, with the document text. See {@link PostFallback}.
   */
  postFallback?: PostFallback;
  /** Per-request before/after hooks (see {@link GraphqlRequestPlugin}). */
  requestPlugins?: GraphqlRequestPlugin[];
  /** Optional Sentry-style span wrapper. */
  startSpan?: StartSpanFn;
};

/** What the transport helpers need to know about the request in flight. */
type RequestContext<TResult, TVariables> = {
  document: TypedDocumentNode<TResult, TVariables>;
  hash: string;
  operationName: string;
  signal?: AbortSignal;
  span?: GraphqlSpan;
  variables: TVariables | undefined;
};

/**
 * Raised when a query's id is not on the server's safelist. With trusted
 * documents this is a real error (a document that wasn't registered at deploy
 * time), not a cue to learn it at runtime — so the executor surfaces it rather
 * than POSTing the query text. Inspect `operationName` / `id` to find the
 * document that needs (re-)registering.
 */
export class TrustedDocumentNotRegisteredError extends Error {
  readonly id: string;
  readonly operationName: string;

  /** Builds the error from the offending operation name and its persisted-query id. */
  constructor(operationName: string, id: string) {
    super(
      `@perimetre/graphql: trusted document "${operationName}" (id ${id}) is not registered on the server. ` +
        `Run registerTrustedDocuments() at deploy time to safelist it — the runtime never registers documents on its own.`
    );
    this.name = 'TrustedDocumentNotRegisteredError';
    this.id = id;
    this.operationName = operationName;
  }
}

/**
 * Creates an `executeGraphqlRequest` for the **trusted-documents** contract.
 * Queries with a codegen-embedded hash are sent as a persisted-query **GET**
 * by id and nothing else — there is no register-on-miss POST, because every
 * document is expected to have been safelisted ahead of time via
 * {@link registerTrustedDocuments}.
 *
 * Behavior:
 *   - **query with hash** → GET `?queryId=<hash>`. A `PersistedQueryNotFound`
 *     response throws {@link TrustedDocumentNotRegisteredError} (the safelist
 *     contract: unknown id = error, never learn-at-runtime).
 *   - **mutation / subscription / query without a hash** → standard POST via
 *     the supplied client. (Mutations are never cached; an unhashed query is a
 *     hand-built document outside codegen.)
 *   - **GET refused as a GET** (414 URL too long, 405) → re-sent as a POST
 *     **by id** (`{ queryId, variables }`, no document text), which WPGraphQL
 *     Smart Cache resolves and authorizes exactly like the GET.
 *   - **anything else** — a timeout, an abort, a network error,
 *     401/403/429/5xx, GraphQL errors — is surfaced to the caller as is, with
 *     no second request: re-sending to a sick or blocking server only doubles
 *     the load on it. `postFallback: 'any'` restores the pre-0.6 "POST on any
 *     failure" (see {@link PostFallback}).
 *
 * This is intentionally distinct from {@link createApqExecutor}; pick one
 * transport per client.
 *
 * Like the APQ executor, the result exposes `.withMeta(...)` which resolves to
 * `{ data, headers, transport, durationMs }` for the response that produced
 * the data (the GET's, or the POST's after a 414 / 405).
 */
export const createTrustedDocumentExecutor = ({
  client,
  endpoint,
  fetch: fetchImpl,
  logger,
  postFallback = 'get-specific',
  requestPlugins,
  startSpan
}: TrustedDocumentExecutorOptions): GraphqlExecutor => {
  /**
   * Wraps `fn` in a tracer span when `startSpan` is configured; runs it bare
   * otherwise. Keeps the executor observability-aware without a hard Sentry
   * dependency.
   */
  const wrapSpan = async <T>(
    name: string,
    attributes: Record<string, boolean | number | string>,
    fn: (span?: GraphqlSpan) => Promise<T>
  ): Promise<T> => {
    if (!startSpan) return fn();
    return startSpan({ name, op: 'graphql.query', attributes }, (span) =>
      fn(span)
    );
  };

  /**
   * Turns a persisted-query response body into the executor's result: an
   * unregistered id throws {@link TrustedDocumentNotRegisteredError}; GraphQL
   * errors do what the client's POST would do with the same body (a
   * `ClientError` under `errorPolicy: 'none'`, the data under `'all'` /
   * `'ignore'`) — without sending that POST, unless `postFallback: 'any'`.
   */
  const answer = async <TResult, TVariables>(
    res: Response,
    text: string,
    body: PersistedQueryResponse | undefined,
    transport: 'trusted-get' | 'trusted-post',
    {
      document,
      hash,
      operationName,
      signal,
      span,
      variables
    }: RequestContext<TResult, TVariables>
  ): Promise<GraphqlTransportResult<TResult>> => {
    const notRegistered = body?.errors?.some(
      (err) => err.message === APQ_NOT_FOUND_ERROR
    );
    if (notRegistered) {
      span?.setAttribute('graphql.trusted.not_registered', true);
      logger?.error('graphql.trusted.not_registered', {
        operationName,
        id: hash
      });
      throw new TrustedDocumentNotRegisteredError(operationName, hash);
    }

    if (body?.errors && body.errors.length > 0) {
      if (
        postFallback === 'any' &&
        transport === 'trusted-get' &&
        !signal?.aborted
      ) {
        logger?.warn('graphql.trusted.errors_fallback_post', {
          operationName,
          id: hash,
          errorCount: body.errors.length
        });
        return postViaClient(client, document, variables, signal);
      }

      // Genuine GraphQL errors (validation, resolver, "This query document
      // has been blocked."): the POST would get the same body back.
      logger?.warn('graphql.trusted.errors', {
        operationName,
        id: hash,
        errorCount: body.errors.length
      });
      if ((client.requestConfig.errorPolicy ?? 'none') === 'none') {
        throw persistedQueryClientError(
          res,
          text,
          body,
          document,
          variables,
          transport
        );
      }
    }

    return { data: body?.data as TResult, headers: res.headers, transport };
  };

  /**
   * Sends the persisted query as a POST **by id** — `{ queryId,
   * operationName, variables }`, no document text — for a server that
   * refused the GET as a GET (414 / 405). WPGraphQL Smart Cache resolves
   * `queryId` from a POST body exactly as from a GET (`graphql_request_data`),
   * under the same allow/deny rules, so the safelist contract holds: no
   * operation text leaves the client and nothing is registered (a POST with
   * `query` AND `queryId` would register it). POSTs skip the network cache.
   */
  const postById = async <TResult, TVariables>(
    context: RequestContext<TResult, TVariables>
  ): Promise<GraphqlTransportResult<TResult>> => {
    const { document, hash, operationName, signal, variables } = context;
    const res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        operationName,
        queryId: hash,
        variables: variables ?? {}
      }),
      signal
    });
    const text = await res.text();
    let body: PersistedQueryResponse | undefined;
    try {
      body = JSON.parse(text) as PersistedQueryResponse;
    } catch (error) {
      if (res.ok) throw error;
    }
    if (!res.ok) {
      throw persistedQueryClientError(
        res,
        text,
        body,
        document,
        variables,
        'trusted-post'
      );
    }
    return answer(res, text, body, 'trusted-post', context);
  };

  /**
   * A failed GET: rethrown, or — only under `postFallback: 'any'`, and never
   * after a caller abort — re-sent through the client's POST (the pre-0.6
   * behaviour, which sends the document text).
   */
  const failGet = async <TResult, TVariables>(
    error: unknown,
    {
      document,
      hash,
      operationName,
      signal,
      variables
    }: RequestContext<TResult, TVariables>,
    status?: number
  ): Promise<GraphqlTransportResult<TResult>> => {
    const fallback = postFallback === 'any' && !signal?.aborted;
    logger?.warn('graphql.trusted.transport_failed', {
      operationName,
      id: hash,
      ...(status === undefined ? {} : { status }),
      fallback: fallback ? 'post' : 'none',
      message: error instanceof Error ? error.message : String(error)
    });
    if (!fallback) throw error;
    return postViaClient(client, document, variables, signal);
  };

  return createExecutor({
    requestPlugins,
    /**
     * The trusted-documents transport: hashed queries go out as a GET by id
     * (throwing on an unknown id); everything else uses the supplied client's
     * POST transport. A GET the server refuses as a GET (414 / 405) is re-sent
     * as a POST by id; any other failure is rethrown, not re-sent (see
     * {@link PostFallback}).
     */
    run: async <TResult, TVariables>({
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

      const url = buildGetUrl(
        endpoint,
        hash,
        operationName,
        variables ?? {},
        edgeCache
      );
      return wrapSpan(
        `graphql.trusted.${operationName}`,
        { operationName, id: hash, transport: 'trusted-get' },
        async (span) => {
          const request: RequestContext<TResult, TVariables> = {
            document,
            hash,
            operationName,
            signal,
            span,
            variables
          };

          let res: Response;
          let text: string;
          try {
            res = await fetchImpl(url, {
              method: 'GET',
              headers: { Accept: 'application/json' },
              signal
            });

            if (GET_REJECTED_STATUSES.has(res.status)) {
              span?.setAttribute('graphql.trusted.get_rejected', res.status);
              logger?.warn('graphql.trusted.get_rejected_post_by_id', {
                operationName,
                id: hash,
                status: res.status
              });
              return await postById(request);
            }

            text = await res.text();
          } catch (error) {
            return await failGet(error, request);
          }

          let body: PersistedQueryResponse | undefined;
          try {
            body = JSON.parse(text) as PersistedQueryResponse;
          } catch (error) {
            // A 2xx that isn't JSON (a WAF challenge page) is a failure; a
            // non-2xx that isn't JSON is reported by its status below.
            if (res.ok) return await failGet(error, request);
          }

          if (!res.ok) {
            return await failGet(
              persistedQueryClientError(
                res,
                text,
                body,
                document,
                variables,
                'trusted-get'
              ),
              request,
              res.status
            );
          }

          return answer(res, text, body, 'trusted-get', request);
        }
      );
    }
  });
};

// ---------------------------------------------------------------------------
// Deploy-time registrar — push the safelist to the CMS once
// ---------------------------------------------------------------------------

/**
 * Options for {@link registerTrustedDocuments}.
 */
export type RegisterTrustedDocumentsOptions = {
  /**
   * The authenticated WPGraphQL endpoint. Registration uses the
   * `createGraphqlDocument` mutation, which requires a user with the
   * `create_posts` capability — pass credentials via {@link headers}.
   */
  endpoint: string;
  /**
   * The `fetch` implementation used for the mutation POSTs. Required.
   */
  fetch: typeof fetch;
  /**
   * Optional allow/deny `grant` applied to each document (maps to the Smart
   * Cache "Saved Queries" allow/deny rule). `'allow'` marks the document as
   * explicitly permitted; `'deny'` blocks it; `'noeg'` / omitted leaves it to
   * the endpoint-wide default.
   */
  grant?: 'allow' | 'deny';
  /**
   * Auth headers for the mutation. Typically an Application Password
   * (`{ Authorization: 'Basic ' + base64('user:app-password') }`) or a JWT
   * (`{ Authorization: 'Bearer <token>' }`). Merged into every request.
   */
  headers: Record<string, string>;
  /** Optional logger for progress/errors. */
  logger?: GraphqlLogger;
  /**
   * Optional per-document `Cache-Control: max-age` (seconds) written to the
   * `maxAgeHeader` field.
   */
  maxAgeSeconds?: number;
  /**
   * The hash → printed-query map from codegen
   * (`__generated__/persisted-documents.json`). Each entry is safelisted under
   * its hash.
   */
  persistedDocuments: Record<string, string>;
};

/** Aggregate result of a {@link registerTrustedDocuments} run. */
export type RegisterTrustedDocumentsResult = {
  created: number;
  failed: number;
  registrations: TrustedDocumentRegistration[];
  skipped: number;
};

/** Outcome of registering a single document. */
export type TrustedDocumentRegistration = {
  /** Populated when `status === 'failed'`. */
  error?: string;
  /** The codegen hash / persisted-query id the document is safelisted under. */
  id: string;
  /** Operation name parsed from the query string (best effort). */
  operationName: string;
  /** What happened: freshly created, already present (idempotent), or failed. */
  status: 'created' | 'failed' | 'skipped';
};

/** Best-effort operation-name extraction from a raw query string. */
const operationNameFromQuery = (query: string): string => {
  const match = /\b(?:query|mutation|subscription)\s+([A-Za-z_]\w*)/.exec(
    query
  );
  return match?.[1] ?? 'AnonymousOperation';
};

const CREATE_DOCUMENT_MUTATION = `
  mutation RegisterTrustedDocument($input: CreateGraphqlDocumentInput!) {
    createGraphqlDocument(input: $input) {
      graphqlDocument { id databaseId alias }
    }
  }
`;

/**
 * Registers (safelists) every persisted document on a WPGraphQL Smart Cache
 * server **ahead of time**, so the runtime never has to learn them. This is
 * the deploy-time half of the trusted-documents pattern — call it from a CI /
 * deploy step (e.g. a `prebuild` script or a release job) after codegen has
 * produced `persisted-documents.json`.
 *
 * It pushes each `hash → query` pair via the `createGraphqlDocument` mutation,
 * setting the codegen hash as the document's `alias`. Because the codegen hash
 * already equals the server's normalized id (see
 * {@link hashOperationForWpGraphqlSmartCache}), the runtime
 * {@link createTrustedDocumentExecutor} can then GET `?queryId=<hash>` and get
 * an immediate hit.
 *
 * **Idempotent.** Re-registering a document that already exists is treated as
 * `skipped`, not an error — the server rejects a duplicate alias/normalized
 * hash with a "already associated" message, which this function recognizes. So
 * it's safe to run on every deploy.
 *
 * Returns an error-as-values summary (never throws for per-document failures);
 * inspect `result.failed` / `result.registrations` to decide whether to fail
 * the deploy.
 * @example
 * ```ts
 * // scripts/register-trusted-documents.ts (run in CI, after codegen)
 * import { registerTrustedDocuments } from '@perimetre/graphql/trusted-documents';
 * import persistedDocuments from '../src/server/graphql/__generated__/persisted-documents.json';
 *
 * const result = await registerTrustedDocuments({
 *   endpoint: process.env.WORDPRESS_GRAPHQL_ENDPOINT!,
 *   fetch: globalThis.fetch,
 *   headers: {
 *     Authorization: `Basic ${Buffer.from(`${process.env.WP_USER}:${process.env.WP_APP_PASSWORD}`).toString('base64')}`
 *   },
 *   persistedDocuments: persistedDocuments as Record<string, string>,
 *   grant: 'allow'
 * });
 * if (result.failed > 0) process.exit(1);
 * console.log(`safelisted ${result.created} new, ${result.skipped} existing`);
 * ```
 */
export const registerTrustedDocuments = async ({
  endpoint,
  fetch: fetchImpl,
  grant,
  headers,
  logger,
  maxAgeSeconds,
  persistedDocuments
}: RegisterTrustedDocumentsOptions): Promise<RegisterTrustedDocumentsResult> => {
  const entries = Object.entries(persistedDocuments);
  const registrations: TrustedDocumentRegistration[] = [];

  for (const [id, query] of entries) {
    const operationName = operationNameFromQuery(query);
    const input: Record<string, unknown> = {
      alias: [id],
      content: query,
      status: 'PUBLISH',
      title: operationName
    };
    if (grant) input.grant = grant;
    if (typeof maxAgeSeconds === 'number') input.maxAgeHeader = maxAgeSeconds;

    try {
      const res = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          query: CREATE_DOCUMENT_MUTATION,
          variables: { input }
        })
      });

      const payload = (await res.json()) as {
        data?: { createGraphqlDocument?: { graphqlDocument?: unknown } };
        errors?: { message: string }[];
      };

      if (payload.errors && payload.errors.length > 0) {
        // The server rejects an existing document with an "already associated
        // with another query" / "already in use" message — that means it's
        // already safelisted, so treat it as an idempotent skip rather than a
        // failure.
        const alreadyExists = payload.errors.some((e) =>
          /already (?:in use|been associated|associated)/i.test(e.message)
        );
        if (alreadyExists) {
          logger?.debug('graphql.trusted.register.skipped', {
            id,
            operationName
          });
          registrations.push({ id, operationName, status: 'skipped' });
          continue;
        }
        const message = payload.errors.map((e) => e.message).join('; ');
        logger?.error('graphql.trusted.register.failed', {
          id,
          operationName,
          message
        });
        registrations.push({
          id,
          operationName,
          status: 'failed',
          error: message
        });
        continue;
      }

      if (!res.ok) {
        const message = `HTTP ${String(res.status)}`;
        logger?.error('graphql.trusted.register.failed', {
          id,
          operationName,
          message
        });
        registrations.push({
          id,
          operationName,
          status: 'failed',
          error: message
        });
        continue;
      }

      logger?.info('graphql.trusted.register.created', { id, operationName });
      registrations.push({ id, operationName, status: 'created' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger?.error('graphql.trusted.register.threw', {
        id,
        operationName,
        message
      });
      registrations.push({
        id,
        operationName,
        status: 'failed',
        error: message
      });
    }
  }

  return {
    created: registrations.filter((r) => r.status === 'created').length,
    failed: registrations.filter((r) => r.status === 'failed').length,
    skipped: registrations.filter((r) => r.status === 'skipped').length,
    registrations
  };
};
