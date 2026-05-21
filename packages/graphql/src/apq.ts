import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
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
 * the sha256 hash of the printed query, plus variables and operationName.
 * Smart Cache resolves the hash to the saved document and executes it.
 *
 * First request for a given hash: POST with both `query` and `queryId` so
 * Smart Cache stores the alias and returns data in one round trip.
 * Subsequent requests: GET with `queryId` only — served from the network
 * cache when warm.
 *
 * Hash normalization caveat: `graphql-php`'s `Printer::doPrint` doesn't
 * always match `graphql-js`'s `print()` byte-for-byte (descriptions,
 * argument formatting, etc.), so the codegen-embedded hash may not be the
 * hash Smart Cache actually stores the document under. We work around this
 * by reading the `x-graphql-query-id` response header on the register POST
 * — that's the server-assigned hash — and using it for the subsequent
 * APQ GETs.
 */
const APQ_NOT_FOUND_ERROR = 'PersistedQueryNotFound';
const APQ_QUERY_ID_HEADER = 'x-graphql-query-id';

type ApqRegisterResult = {
  response: ApqResponse;
  /**
   * The hash Smart Cache stored the document under, as reported in the
   * `x-graphql-query-id` response header. Falls back to the codegen hash
   * when the header is missing.
   */
  serverHash: string;
};

type ApqResponse = {
  data?: unknown;
  errors?: { message: string }[];
};

/**
 * Builds the APQ GET URL with `queryId`, `operationName`, and serialized
 * `variables` query params. Splitting the params this way keeps every
 * variant of the same operation on a single URL key, which is what Smart
 * Cache's network cache uses for its lookup.
 */
const buildApqGetUrl = (
  endpoint: string,
  hash: string,
  operationName: string,
  variables: unknown
): string => {
  const url = new URL(endpoint);
  url.searchParams.set('queryId', hash);
  url.searchParams.set('operationName', operationName);
  if (variables && Object.keys(variables as object).length > 0) {
    url.searchParams.set('variables', JSON.stringify(variables));
  }
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
  /** Optional Sentry-style span wrapper. */
  startSpan?: StartSpanFn;
};

export type ExecuteGraphqlRequest = <TResult, TVariables>(
  document: TypedDocumentNode<TResult, TVariables>,
  variables?: TVariables
) => Promise<TResult>;

/**
 * Creates an `executeGraphqlRequest` helper that routes queries through
 * WPGraphQL Smart Cache's APQ flow when the codegen-embedded hash is
 * present, and falls back to the supplied `client.request` for mutations,
 * unhashed documents, or any APQ transport failure.
 *
 * The first request for a given hash registers it via APQ POST and
 * records the **server-assigned** hash from the `x-graphql-query-id`
 * response header. Subsequent requests use APQ GET with the server hash
 * so Smart Cache's network cache can serve a HIT. The registration map
 * is kept in process memory — each lambda cold-start re-warms by sending
 * one POST per hash before serving GETs. If Smart Cache later returns
 * `PersistedQueryNotFound` (alias eviction, deployment churn), the
 * executor re-registers via POST and resumes GETs for the new hash.
 */
export const createApqExecutor = ({
  client,
  endpoint,
  fetch: fetchImpl,
  logger,
  persistedDocuments,
  startSpan
}: ApqExecutorOptions): ExecuteGraphqlRequest => {
  /**
   * codegenHash → serverHash. The server hash is the one Smart Cache
   * stored the document under (from the `x-graphql-query-id` response
   * header on the register POST). Subsequent GETs use the server hash so
   * Smart Cache can actually find the document — sending the codegen
   * hash returns `PersistedQueryNotFound` whenever the two normalizers
   * disagree.
   */
  const registeredServerHashes = new Map<string, string>();

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
   * Registers a persisted query alias on the WPGraphQL Smart Cache server
   * and returns the executed response data in a single round trip,
   * alongside the server-assigned hash from the `x-graphql-query-id`
   * response header. Returns `null` when we don't have a persisted
   * documents entry for the codegen hash.
   */
  const registerViaApqPost = async (
    codegenHash: string,
    operationName: string,
    variables: unknown
  ): Promise<ApqRegisterResult | null> => {
    const query = persistedDocuments[codegenHash];
    if (!query) return null;

    const res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        operationName,
        query,
        queryId: codegenHash,
        variables: variables ?? {}
      })
    });

    if (!res.ok) {
      throw new Error(`APQ POST returned HTTP ${String(res.status)}`);
    }

    const response = (await res.json()) as ApqResponse;
    const headerHash = res.headers.get(APQ_QUERY_ID_HEADER)?.trim();
    const serverHash =
      headerHash !== undefined && headerHash.length > 0
        ? headerHash
        : codegenHash;

    return { response, serverHash };
  };

  /**
   * Registers (or re-registers) the document and returns the response
   * payload from the POST. Updates `registeredServerHashes` on success.
   * Returns `null` if there's no persisted-documents entry for the hash
   * — callers should fall through to the regular client.
   */
  const registerAndExecute = async <TResult, TVariables>(
    codegenHash: string,
    operationName: string,
    document: TypedDocumentNode<TResult, TVariables>,
    variables?: TVariables
  ): Promise<{ data: TResult } | null> => {
    return wrapSpan(
      `graphql.apq.register.${operationName}`,
      'graphql.query',
      { operationName, hash: codegenHash, transport: 'apq-register-post' },
      async (span) => {
        try {
          const registered = await registerViaApqPost(
            codegenHash,
            operationName,
            variables
          );

          if (
            registered &&
            !registered.response.errors &&
            registered.response.data !== undefined
          ) {
            const previousServerHash = registeredServerHashes.get(codegenHash);
            registeredServerHashes.set(codegenHash, registered.serverHash);
            if (
              previousServerHash &&
              previousServerHash !== registered.serverHash
            ) {
              logger?.info('graphql.apq.server_hash_rotated', {
                operationName,
                codegenHash,
                previousServerHash,
                serverHash: registered.serverHash
              });
            }
            span?.setAttribute(
              'graphql.apq.server_hash',
              registered.serverHash
            );
            return { data: registered.response.data as TResult };
          }

          registeredServerHashes.delete(codegenHash);
          logger?.warn('graphql.apq.register_failed', {
            operationName,
            hash: codegenHash,
            hadErrors: !!registered?.response.errors
          });
          return {
            data: await client.request(
              document,
              variables as object | undefined
            )
          };
        } catch (error) {
          registeredServerHashes.delete(codegenHash);
          logger?.warn('graphql.apq.register_threw', {
            operationName,
            hash: codegenHash,
            message: error instanceof Error ? error.message : String(error)
          });
          return {
            data: await client.request(
              document,
              variables as object | undefined
            )
          };
        }
      }
    );
  };

  /**
   * Executes a GraphQL operation. Queries with a codegen-embedded hash
   * route through APQ (POST-to-register on the first hit, GET on
   * subsequent hits using the server-assigned hash). Everything else
   * falls back to the supplied client.
   */
  async function execute<TResult, TVariables>(
    document: TypedDocumentNode<TResult, TVariables>,
    variables?: TVariables
  ): Promise<TResult> {
    const { hash: codegenHash, operationKind } = apqMetaFromDocument(document);
    const operationName = operationNameFromDocument(document);

    if (operationKind !== 'query' || !codegenHash) {
      return client.request(document, variables as object | undefined);
    }

    const serverHash = registeredServerHashes.get(codegenHash);
    if (!serverHash) {
      const registered = await registerAndExecute(
        codegenHash,
        operationName,
        document,
        variables
      );
      if (registered) return registered.data;
      // No persisted-documents entry — fall back to the normal client.
      return client.request(document, variables as object | undefined);
    }

    const apqUrl = buildApqGetUrl(
      endpoint,
      serverHash,
      operationName,
      variables ?? {}
    );
    return wrapSpan(
      `graphql.apq.${operationName}`,
      'graphql.query',
      {
        operationName,
        hash: codegenHash,
        serverHash,
        transport: 'apq-get'
      },
      async (span) => {
        try {
          const res = await fetchImpl(apqUrl, {
            method: 'GET',
            headers: { Accept: 'application/json' }
          });

          if (!res.ok) {
            throw new Error(`APQ GET returned HTTP ${String(res.status)}`);
          }

          const body = (await res.json()) as {
            data?: unknown;
            errors?: { message: string }[];
          };

          const apqMiss = body.errors?.some(
            (err) => err.message === APQ_NOT_FOUND_ERROR
          );
          if (apqMiss) {
            span?.setAttribute('graphql.apq.miss', true);
            registeredServerHashes.delete(codegenHash);
            logger?.info('graphql.apq.miss_reregister', {
              operationName,
              codegenHash,
              serverHash
            });
            // The alias was evicted (or never existed). Re-register via
            // POST and execute in the same round trip rather than falling
            // back to an uncached plain POST — that way the next caller
            // for this hash gets to use the GET fast path again.
            const registered = await registerAndExecute(
              codegenHash,
              operationName,
              document,
              variables
            );
            if (registered) return registered.data;
            return await client.request(
              document,
              variables as object | undefined
            );
          }

          if (body.errors && body.errors.length > 0) {
            logger?.warn('graphql.apq.errors_fallback_post', {
              operationName,
              errorCount: body.errors.length
            });
            return await client.request(
              document,
              variables as object | undefined
            );
          }

          return body.data as TResult;
        } catch (error) {
          logger?.warn('graphql.apq.transport_failed', {
            operationName,
            message: error instanceof Error ? error.message : String(error)
          });
          return await client.request(
            document,
            variables as object | undefined
          );
        }
      }
    );
  }

  return execute;
};

/**
 * Default executor that bypasses APQ and uses the standard POST transport.
 * Use this when you want a single uniform `executeGraphqlRequest` import
 * shape across projects, regardless of whether APQ is enabled.
 */
export const createPassthroughExecutor = (
  client: GraphQLClient
): ExecuteGraphqlRequest => {
  return (document, variables) =>
    client.request(document, variables as object | undefined);
};
