import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { GraphQLClient } from 'graphql-request';
import type { ExecuteGraphqlRequest } from './apq.js';
import type { GraphqlSpan, StartSpanFn } from './middlewares.js';
import { OPERATION_DEFINITION_KIND, type GraphqlLogger } from './utils.js';

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
 * Reads the codegen-emitted persisted-query hash and the operation kind off a
 * `TypedDocumentNode`. Only queries can ride the GET transport — mutations and
 * subscriptions always POST.
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
 * Pulls the persisted-query hash, operation kind, and operation name off a
 * codegen-generated `TypedDocumentNode` (`__meta__.hash` + the operation
 * definition). Used to decide whether a request can ride the GET-by-id path.
 */
const metaFromDocument = (
  document: unknown
): {
  hash?: string;
  operationKind: 'mutation' | 'query' | 'subscription';
  operationName: string;
} => {
  const doc = document as DocumentWithHash;
  const opDef = doc.definitions?.find(
    (d) => d.kind === OPERATION_DEFINITION_KIND
  );

  let operationKind: 'mutation' | 'query' | 'subscription' = 'query';
  if (opDef?.operation === 'mutation') operationKind = 'mutation';
  else if (opDef?.operation === 'subscription') operationKind = 'subscription';

  return {
    hash: doc.__meta__?.hash,
    operationKind,
    operationName: opDef?.name?.value ?? 'AnonymousOperation'
  };
};

/**
 * Builds the persisted-query GET URL — `queryId` + `operationName` +
 * serialized `variables` — the same shape WPGraphQL Smart Cache's network
 * cache keys on.
 */
const buildGetUrl = (
  endpoint: string,
  id: string,
  operationName: string,
  variables: unknown
): string => {
  const url = new URL(endpoint);
  url.searchParams.set('queryId', id);
  url.searchParams.set('operationName', operationName);
  if (variables && Object.keys(variables as object).length > 0) {
    url.searchParams.set('variables', JSON.stringify(variables));
  }
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
  /** Optional Sentry-style span wrapper. */
  startSpan?: StartSpanFn;
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
 *   - **other GraphQL errors / transport failures** → surfaced to the caller
 *     (transport failures fall back to a POST so a flaky GET edge doesn't take
 *     the request down, but a missing-from-safelist id always throws).
 *
 * This is intentionally distinct from {@link createApqExecutor}; pick one
 * transport per client.
 */
export const createTrustedDocumentExecutor = ({
  client,
  endpoint,
  fetch: fetchImpl,
  logger,
  startSpan
}: TrustedDocumentExecutorOptions): ExecuteGraphqlRequest => {
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
   * Executes one operation under the trusted-documents contract: hashed
   * queries go out as a GET by id (throwing on an unknown id); everything
   * else falls back to the supplied client's POST transport.
   */
  async function execute<TResult, TVariables>(
    document: TypedDocumentNode<TResult, TVariables>,
    variables?: TVariables
  ): Promise<TResult> {
    const { hash, operationKind, operationName } = metaFromDocument(document);

    if (operationKind !== 'query' || !hash) {
      return client.request(document, variables as object | undefined);
    }

    const url = buildGetUrl(endpoint, hash, operationName, variables ?? {});
    return wrapSpan(
      `graphql.trusted.${operationName}`,
      { operationName, id: hash, transport: 'trusted-get' },
      async (span) => {
        let body: { data?: unknown; errors?: { message: string }[] };
        try {
          const res = await fetchImpl(url, {
            method: 'GET',
            headers: { Accept: 'application/json' }
          });
          if (!res.ok) {
            throw new Error(
              `Trusted document GET returned HTTP ${String(res.status)}`
            );
          }
          body = (await res.json()) as typeof body;
        } catch (error) {
          // A transport-level failure (network blip, edge 5xx) shouldn't take
          // the request down when the document IS on the safelist — fall back
          // to a normal POST. A missing-from-safelist id, by contrast, comes
          // back as a 200 with a PersistedQueryNotFound error and is handled
          // below as a hard error.
          logger?.warn('graphql.trusted.transport_failed', {
            operationName,
            id: hash,
            message: error instanceof Error ? error.message : String(error)
          });
          return client.request(document, variables as object | undefined);
        }

        const notRegistered = body.errors?.some(
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

        if (body.errors && body.errors.length > 0) {
          // Genuine GraphQL errors (validation, resolver) — return them to the
          // caller's error handling via the client, which throws ClientError
          // with the full payload.
          logger?.warn('graphql.trusted.errors', {
            operationName,
            id: hash,
            errorCount: body.errors.length
          });
          return client.request(document, variables as object | undefined);
        }

        return body.data as TResult;
      }
    );
  }

  return execute;
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
