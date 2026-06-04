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
 * Because the codegen hash matches the server's normalized persisted-query
 * id, the executor issues an APQ **GET** first. On the rare
 * `PersistedQueryNotFound` (the document was never registered on this server),
 * it registers the document with one POST and retries the GET, so subsequent
 * callers stay on the cacheable GET fast path.
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
   * returns the executed response in the same round trip. Sends both `query`
   * and `queryId` so the server saves the document under the *same* id the
   * client already uses — no second identifier to track. Returns `null` when
   * there's no persisted-documents entry for the hash (callers fall through
   * to the regular client).
   */
  const registerViaApqPost = async (
    hash: string,
    operationName: string,
    variables: unknown
  ): Promise<ApqResponse | null> => {
    const query = persistedDocuments[hash];
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
        queryId: hash,
        variables: variables ?? {}
      })
    });

    if (!res.ok) {
      throw new Error(`APQ POST returned HTTP ${String(res.status)}`);
    }

    return (await res.json()) as ApqResponse;
  };

  /**
   * Registers the document via POST and returns its response data, falling
   * back to the regular client if registration has no entry or fails. Used
   * when an APQ GET misses because the document was never registered on this
   * server.
   */
  const registerAndExecute = async <TResult, TVariables>(
    hash: string,
    operationName: string,
    document: TypedDocumentNode<TResult, TVariables>,
    variables?: TVariables
  ): Promise<TResult> => {
    return wrapSpan(
      `graphql.apq.register.${operationName}`,
      'graphql.query',
      { operationName, hash, transport: 'apq-register-post' },
      async () => {
        try {
          const registered = await registerViaApqPost(
            hash,
            operationName,
            variables
          );

          if (
            registered &&
            !registered.errors &&
            registered.data !== undefined
          ) {
            return registered.data as TResult;
          }

          logger?.warn('graphql.apq.register_failed', {
            operationName,
            hash,
            hadErrors: !!registered?.errors
          });
        } catch (error) {
          logger?.warn('graphql.apq.register_threw', {
            operationName,
            hash,
            message: error instanceof Error ? error.message : String(error)
          });
        }

        return client.request(document, variables as object | undefined);
      }
    );
  };

  /**
   * Executes a GraphQL operation. Queries with a codegen-embedded hash route
   * through APQ — GET first, and a one-off register POST then GET if the
   * server reports `PersistedQueryNotFound`. Everything else (mutations,
   * subscriptions, unhashed documents) falls back to the supplied client.
   */
  async function execute<TResult, TVariables>(
    document: TypedDocumentNode<TResult, TVariables>,
    variables?: TVariables
  ): Promise<TResult> {
    const { hash, operationKind } = apqMetaFromDocument(document);
    const operationName = operationNameFromDocument(document);

    if (operationKind !== 'query' || !hash) {
      return client.request(document, variables as object | undefined);
    }

    const apqUrl = buildApqGetUrl(
      endpoint,
      hash,
      operationName,
      variables ?? {}
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
              variables
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
