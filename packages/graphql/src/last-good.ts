import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import {
  contextFromDocument,
  type ExecuteGraphqlRequest,
  type GraphqlExecuteResult,
  type GraphqlExecutor,
  type GraphqlRequestOptions,
  type GraphqlTransport
} from './apq.js';
import { GRAPHQL_KEYS_HEADER, hasGraphqlNodeKeys } from './keys.js';
import type { GraphqlLogger } from './utils.js';

/**
 * # Stale-if-error for CMS reads
 *
 * `'use cache'` has no stale-if-error. An entry flushed by a webhook
 * (`revalidateTag(tag, { expire: 0 })`), past its `expire`, evicted, or made
 * by an older deployment (remote entries are keyed by build) is DISCARDED
 * before the function runs, and a stale entry regenerated during the route's
 * own refresh is a miss too. If the CMS throws on that miss (an expired
 * certificate, a WAF 403, a timeout), nothing is left to serve.
 *
 * `withLastGood` stores every successful query response in a store of the
 * caller's choosing (the Vercel Runtime Cache, untagged, so no flush reaches
 * it) and answers from that copy when the CMS fails or is too slow.
 *
 * - **Keyed by the persisted-query hash** (+ operation + variables). Codegen
 *   derives the hash from the full document, fragments included, so a deploy
 *   that changes what a query selects never meets a copy of the old shape,
 *   while a deploy that changes nothing reads the copies the previous one
 *   stored — exactly when they matter, since a new deployment starts with a
 *   cold remote cache.
 * - **The raw response**, before any mapper runs, so a mapper change can't
 *   meet a stale shape either.
 * - **Only hashed queries.** Mutations and unhashed documents pass through.
 */

/** The time source, injectable for tests. */
export type LastGoodClock = {
  clearTimeout: (handle: unknown) => void;
  now: () => number;
  setTimeout: (callback: () => void, ms: number) => unknown;
};

/** The executor `withLastGood` returns: `.withMeta` also reports `stale`. */
export type LastGoodExecutor = {
  withMeta: <TResult, TVariables>(
    document: TypedDocumentNode<TResult, TVariables>,
    variables?: TVariables,
    options?: GraphqlRequestOptions
  ) => Promise<LastGoodResult<TResult>>;
} & ExecuteGraphqlRequest;

/** Why a read was answered from its copy, handed to `onFallback`. */
export type LastGoodFallback = {
  /** The CMS's failure, when `reason` is `'error'`. */
  error?: unknown;
  operationName: string;
  /** `'error'`: the CMS failed. `'slow'`: it missed the soft deadline. */
  reason: 'error' | 'slow';
  variables: unknown;
};

/** Options for {@link withLastGood}. */
export type LastGoodOptions = {
  /** Time source. Defaults to `Date.now` and the global timers. */
  clock?: LastGoodClock;
  /**
   * Keeps background work (the store write, the live request a copy stood in
   * for) alive past the response. Pass `waitUntil` from `@vercel/functions`.
   * Defaults to fire-and-forget. Never handed a promise that rejects.
   */
  defer?: (promise: Promise<unknown>) => void;
  /**
   * Evaluated per read; `false` passes the read straight through, with no
   * store read or write. Turn it off during `next build`: no copy is served
   * there (a build waits for the CMS), and the Runtime Cache's build client
   * only times out.
   */
  enabled?: () => boolean;
  /**
   * Whether a successful answer is "nothing" and must not be stored (it would
   * replace a good copy). Default: {@link isEmptyGraphqlAnswer} — no data, or
   * every root field `null` (an unknown slug or id). A stricter app (under
   * `errorPolicy: 'all'` a `null` root can be a resolver error) can refuse any
   * `null` root.
   */
  isEmptyAnswer?: (data: unknown) => boolean;
  /** Logs store failures and skipped writes. */
  logger?: GraphqlLogger;
  /**
   * Largest copy written, in bytes of JSON. Vercel's Runtime Cache drops items
   * over 2 MB without an error. Default `1_900_000`.
   */
  maxBytes?: number;
  /**
   * Called when a read is answered from its copy. Where a Next.js app lowers
   * the enclosing scope's `cacheLife` (so the copy isn't pinned and the next
   * visit retries the CMS) and logs. A throw is swallowed.
   */
  onFallback?: (event: LastGoodFallback) => void;
  /** The soft deadline inside {@link LastGoodOptions.slowWindowMs}. Default `500`. */
  slowSoftTimeoutMs?: number;
  /** How long a read past a failure or a slow answer keeps the short deadline. Default `30_000`. */
  slowWindowMs?: number;
  /**
   * How long a read that HAS a copy waits for the CMS before answering from
   * it. Default `3000`. Tune from the CMS's normal tail latency (p99.9 of the
   * request spans) plus padding: a deadline below it serves copies for no
   * reason.
   */
  softTimeoutMs?: number;
  /** Where copies live (see {@link LastGoodStore}). */
  store: LastGoodStore;
  /**
   * How long a copy survives with no successful read rewriting it, in
   * seconds. Default one year: every success rewrites its copy, so this only
   * bounds how long one nobody reads any more lingers.
   */
  ttlSeconds?: number;
};

/** A response, and whether it is a stored copy standing in for the CMS. */
export type LastGoodResult<TResult> = {
  stale: boolean;
} & GraphqlExecuteResult<TResult>;

/**
 * Where copies live. The Vercel Runtime Cache (`getCache()` from
 * `@vercel/functions`) fits as is; tests pass a map. It must be a store no
 * cache-tag flush reaches.
 */
export type LastGoodStore = {
  get: (key: string) => Promise<unknown>;
  set: (
    key: string,
    value: unknown,
    options: { name?: string; ttl: number }
  ) => Promise<unknown>;
};

/** A stored response: its data, and the keys and transport it came with. */
type LastGood<TResult> = {
  data: TResult;
  keys: null | string;
  transport: GraphqlTransport;
};

/** The live read's outcome by the soft deadline. */
type Outcome<TResult> =
  | { error: unknown; kind: 'error' }
  | { kind: 'ok'; result: GraphqlExecuteResult<TResult> }
  | { kind: 'slow' };

const DEFAULT_CLOCK: LastGoodClock = {
  /** Clears a global timer. */
  clearTimeout: (handle) => {
    clearTimeout(handle as ReturnType<typeof setTimeout>);
  },
  /** `Date.now()`. */
  now: () => Date.now(),
  /** A global timer. */
  setTimeout: (callback, ms) => setTimeout(callback, ms)
};

/** Swallows a rejection, so deferred work never rejects unhandled. */
const settle = (work: Promise<unknown>): Promise<unknown> =>
  work.then(
    () => undefined,
    () => undefined
  );

/**
 * Whether a response answered nothing: no data, or every root field `null`
 * (an unknown slug or id). The default `isEmptyAnswer`: such an answer is
 * returned but never stored, so a bot walking `/<random>` mints no copies.
 */
export const isEmptyGraphqlAnswer = (data: unknown): boolean =>
  data == null ||
  typeof data !== 'object' ||
  Object.values(data).every((value) => value == null);

/** `JSON.stringify` with sorted object keys, so key order never splits a key. */
export const stableStringify = (value: unknown): string =>
  JSON.stringify(value, (_key, inner: unknown) =>
    inner && typeof inner === 'object' && !Array.isArray(inner)
      ? Object.fromEntries(
          Object.entries(inner as Record<string, unknown>).sort(([a], [b]) =>
            a < b ? -1 : a > b ? 1 : 0
          )
        )
      : inner
  );

/**
 * Wraps an executor with stale-if-error: every successful query response is
 * stored, and a later read of the same document + variables answers from that
 * copy when the CMS fails, or hasn't answered by a soft deadline.
 *
 * - **A failure**, with a copy: the copy, flagged `stale`, and
 *   `onFallback({ reason: 'error' })`. With no copy: the original error,
 *   unchanged. A response with no `data` at all (a query the CMS's schema
 *   rejects, under `errorPolicy: 'all'`) counts as a failure.
 * - **A slow CMS**, with a copy: the live request races `softTimeoutMs`
 *   (3 s; `slowSoftTimeoutMs`, 500 ms, for `slowWindowMs` after this wrapper
 *   saw the CMS fail or miss a deadline). Past it the copy answers
 *   (`onFallback({ reason: 'slow' })`) and the live request finishes in the
 *   background (`defer`) to refresh the copy. With NO copy the read awaits
 *   the live request — there is nothing else to serve; the hard limit is the
 *   transport's (`requestTimeoutMs`).
 * - **Object-cache hits keep their keys.** A Smart Cache object-cache hit's
 *   `X-GraphQL-Keys` names no node; it is lent the keys stored with the last
 *   response that did, so a keyed read doesn't lose its tags.
 * - **Writes never block the read** (`defer`), never store an empty answer
 *   (`isEmptyAnswer`) or one over `maxBytes`, and a store failure costs the
 *   fallback, never the read.
 *
 * Deliberately **no circuit breaker**: a breaker is modal — while open, every
 * read without a copy fails instead of waiting, and it adds recovery time.
 * The soft deadline only changes how long a read WITH a copy waits; every read
 * still asks the CMS, and since the fallback runs whenever the CMS is merely
 * slow, it is exercised continuously rather than discovered broken in an
 * outage. Load on a sick CMS stays bounded without one: only cache misses read
 * it, and a scope answered from a copy retries on its shortened life.
 *
 * Readers must let errors THROW out of their cached scope: when a copy exists
 * the reader never sees the error; when none does, a `catch { return null }`
 * would cache the failure as content for the scope's whole life.
 * @example Next.js on Vercel
 * ```ts
 * import { getCache, waitUntil } from '@vercel/functions';
 * import { cacheLife } from 'next/cache';
 * import { createHash } from 'node:crypto';
 *
 * export const cmsQuery = withLastGood(executeGraphqlRequest, {
 *   store: getCache({
 *     namespace: 'cms-last-good',
 *     // The default hash is 32-bit: a collision serves one page on another's URL.
 *     keyHashFunction: (key) => createHash('sha256').update(key).digest('hex')
 *   }),
 *   defer: waitUntil,
 *   enabled: () => process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD,
 *   onFallback: ({ reason, operationName }) => {
 *     // Lower the scope's life so the copy isn't pinned. `expire` stays: one
 *     // under 5 minutes drops the scope from the static shell.
 *     try {
 *       cacheLife({ revalidate: 60 });
 *     } catch {
 *       // Not inside a 'use cache' scope.
 *     }
 *     Sentry.logger.warn(`cms.stale_on_${reason}`, { operationName });
 *   }
 * });
 * ```
 */
export const withLastGood = (
  execute: GraphqlExecutor,
  {
    clock = DEFAULT_CLOCK,
    defer = (promise) => void promise,
    enabled,
    isEmptyAnswer = isEmptyGraphqlAnswer,
    logger,
    maxBytes = 1_900_000,
    onFallback,
    slowSoftTimeoutMs = 500,
    slowWindowMs = 30_000,
    softTimeoutMs = 3000,
    store,
    ttlSeconds = 31_536_000
  }: LastGoodOptions
): LastGoodExecutor => {
  /** Until when this wrapper treats the CMS as slow. */
  let slowUntil = 0;

  /** Runs background work without ever letting it reject unhandled. */
  const keepAlive = (work: Promise<unknown>) => {
    try {
      defer(settle(work));
    } catch {
      // No request context (e.g. `waitUntil` outside a request): it runs alone.
    }
  };

  /** The copy for `key`, or `null` (also when the store fails). */
  const recall = async <TResult>(
    key: string
  ): Promise<LastGood<TResult> | null> => {
    try {
      return ((await store.get(key)) as LastGood<TResult> | null) ?? null;
    } catch {
      return null;
    }
  };

  /** Stores a copy. Never throws: a failed write only costs the fallback. */
  const remember = async (
    key: string,
    operationName: string,
    value: LastGood<unknown>
  ) => {
    try {
      const bytes = new TextEncoder().encode(JSON.stringify(value)).length;
      if (bytes > maxBytes) {
        logger?.info('graphql.last_good.too_large', {
          bytes,
          maxBytes,
          operationName
        });
        return;
      }
      await store.set(key, value, { name: operationName, ttl: ttlSeconds });
    } catch (error) {
      logger?.error('graphql.last_good.write_failed', {
        message: error instanceof Error ? error.message : String(error),
        operationName
      });
    }
  };

  /**
   * The `X-GraphQL-Keys` a successful response is stored and tagged with: its
   * own when they name a node, else those of the stored copy. A Smart Cache
   * object-cache hit names no node, but proves none of the response's nodes
   * changed since it last ran (Smart Cache evicts it by those keys), so the
   * keys of the last response that did run still hold. Worst case a read
   * carries an extra key: flushed more often, never less.
   */
  const keysFor = async (
    stored: Promise<LastGood<unknown> | null>,
    header: null | string
  ) => {
    if (hasGraphqlNodeKeys(header)) return header;
    const copy = await stored;
    return copy && hasGraphqlNodeKeys(copy.keys) ? copy.keys : header;
  };

  /** Waits for `live`, but no longer than `deadlineMs`. */
  const raceSoftDeadline = async <TResult>(
    live: Promise<GraphqlExecuteResult<TResult>>,
    deadlineMs: number
  ): Promise<Outcome<TResult>> => {
    const settled = live.then(
      (result): Outcome<TResult> => ({ kind: 'ok', result }),
      (error: unknown): Outcome<TResult> => ({ error, kind: 'error' })
    );
    let timer: unknown;
    const slow = new Promise<Outcome<TResult>>((resolve) => {
      timer = clock.setTimeout(() => {
        resolve({ kind: 'slow' });
      }, deadlineMs);
    });
    try {
      return await Promise.race([settled, slow]);
    } finally {
      clock.clearTimeout(timer);
    }
  };

  /** A copy as the read's answer, reported to `onFallback`. */
  const answerFromCopy = <TResult>(
    copy: LastGood<TResult>,
    fallback: LastGoodFallback
  ): LastGoodResult<TResult> => {
    try {
      onFallback?.(fallback);
    } catch {
      // An observer must never take down the read it observes.
    }
    // The copy answers with the keys it was read with, so the scope it fills
    // keeps its node tags and a webhook flush still reaches it.
    return {
      data: copy.data,
      durationMs: 0,
      headers: new Headers(
        copy.keys ? { [GRAPHQL_KEYS_HEADER]: copy.keys } : undefined
      ),
      stale: true,
      transport: copy.transport
    };
  };

  /** `.withMeta`, with the fallback: every call goes through it. */
  const withMeta = async <TResult, TVariables>(
    document: TypedDocumentNode<TResult, TVariables>,
    variables?: TVariables,
    options?: GraphqlRequestOptions
  ): Promise<LastGoodResult<TResult>> => {
    const { hash, operationKind, operationName } =
      contextFromDocument(document);

    if (operationKind !== 'query' || !hash || (enabled && !enabled())) {
      return {
        ...(await execute.withMeta(document, variables, options)),
        stale: false
      };
    }

    const key = `${hash}:${operationName}:${stableStringify(variables ?? {})}`;

    // Both start now: the copy is read in parallel, so having one costs the
    // live read no latency.
    const stored = recall<TResult>(key);
    const live = execute
      .withMeta(document, variables, options)
      .then(async (result) => {
        // `TResult` claims data, but a document the schema rejects answers
        // `errors` and no `data` under `errorPolicy: 'all'`: no answer.
        if ((result.data as null | TResult | undefined) == null) {
          throw new Error(`${operationName}: the CMS answered no data`);
        }

        const header = result.headers.get(GRAPHQL_KEYS_HEADER);
        const keys = await keysFor(stored, header);
        if (!isEmptyAnswer(result.data)) {
          keepAlive(
            remember(key, operationName, {
              data: result.data,
              keys,
              transport: result.transport
            })
          );
        }
        if (keys === header) return result;

        const headers = new Headers(result.headers);
        headers.set(GRAPHQL_KEYS_HEADER, keys ?? '');
        return { ...result, headers };
      });

    const deadlineMs =
      clock.now() < slowUntil ? slowSoftTimeoutMs : softTimeoutMs;
    const first = await raceSoftDeadline(live, deadlineMs);

    if (first.kind === 'ok') return { ...first.result, stale: false };

    slowUntil = clock.now() + slowWindowMs;
    const copy = await stored;

    if (first.kind === 'error') {
      if (!copy) throw first.error;
      return answerFromCopy(copy, {
        error: first.error,
        operationName,
        reason: 'error',
        variables
      });
    }

    if (copy) {
      // The live request keeps running and refreshes the copy when it lands;
      // nobody waits for it, and its failure is the next read's concern.
      keepAlive(live);
      return answerFromCopy(copy, { operationName, reason: 'slow', variables });
    }

    // Nothing to answer with: wait for the CMS, up to the transport's limit.
    return { ...(await live), stale: false };
  };

  /** The data-only call, over `withMeta`. */
  const executeData: ExecuteGraphqlRequest = async (
    document,
    variables,
    options
  ) => (await withMeta(document, variables, options)).data;

  return Object.assign(executeData, { withMeta });
};
