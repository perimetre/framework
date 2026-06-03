import { ClientError } from 'graphql-request';
import type { GraphqlClientPlugin } from './client.js';
import {
  hostFromUrl,
  parseOperationName,
  type GraphqlLogger,
  type GraphqlRequestBody
} from './utils.js';

// ---------------------------------------------------------------------------
// Request / response loggers
// ---------------------------------------------------------------------------

/**
 * Internal map keyed by the request object so the response middleware can
 * correlate duration and operation name with the outgoing request. Using a
 * WeakMap avoids mutating the request and handles concurrent in-flight
 * requests independently.
 */
const requestStartTimes = new WeakMap<
  object,
  { operationName: string; startedAt: number }
>();

/**
 * Adds a `requestMiddleware` that captures the start time + operation name
 * for every outgoing request, and (optionally) prints the operation/variables
 * via the provided logger when `debug` is true.
 *
 * Use together with `withResponseLogger` so duration logging works.
 */
export const withRequestLogger = ({
  debug = false,
  endpoint,
  logger
}: {
  debug?: boolean;
  endpoint?: string;
  logger: GraphqlLogger;
}): GraphqlClientPlugin => {
  return () => ({
    /**
     * Captures the start time and operation name and (optionally) prints
     * the query body when `debug` is enabled.
     */
    requestMiddleware: (request) => {
      const operationName =
        'body' in request
          ? parseOperationName(request.body)
          : 'UnknownOperation';

      requestStartTimes.set(request, {
        operationName,
        startedAt: Date.now()
      });

      logger.debug('graphql.request.start', {
        operationName,
        endpoint
      });

      if (debug && 'body' in request && typeof request.body === 'string') {
        try {
          const body = JSON.parse(request.body) as GraphqlRequestBody;
          logger.debug(`graphql.request.body ${operationName}`, {
            operationName,
            variables: body.variables,
            query: body.query
          });
        } catch {
          // Ignore JSON parse errors — already logged at start.
        }
      }

      return request;
    }
  });
};

/**
 * Adds a `responseMiddleware` that classifies the response (transport error,
 * `ClientError`, partial errors under `errorPolicy: 'all'`, or success) and
 * emits a structured log via the provided logger. When `captureException` is
 * supplied, hard errors are also reported through it.
 *
 * Pair with `withRequestLogger` so duration logging works.
 */
export const withResponseLogger = ({
  captureException,
  logger
}: {
  captureException?: (
    error: unknown,
    context?: { tags?: Record<string, string> }
  ) => void;
  logger: GraphqlLogger;
}): GraphqlClientPlugin => {
  return () => ({
    /**
     * Classifies the response (transport error, ClientError, partial errors,
     * success) and emits a structured log via the provided logger.
     */
    responseMiddleware: (response, request) => {
      const entry = requestStartTimes.get(request);
      const operationName = entry?.operationName ?? 'UnknownOperation';
      const durationMs = entry ? Date.now() - entry.startedAt : undefined;
      requestStartTimes.delete(request);

      if (response instanceof ClientError) {
        logger.error('graphql.request.client_error', {
          operationName,
          durationMs,
          status: response.response.status,
          errors: response.response.errors
        });
        captureException?.(response, {
          tags: { operation: operationName, source: 'graphql' }
        });
        return;
      }

      if (response instanceof Error) {
        logger.error('graphql.request.network_error', {
          operationName,
          durationMs,
          message: response.message
        });
        captureException?.(response, {
          tags: { operation: operationName, source: 'graphql' }
        });
        return;
      }

      if (response.errors && response.errors.length > 0) {
        logger.warn('graphql.request.partial_errors', {
          operationName,
          durationMs,
          status: response.status,
          errorCount: response.errors.length,
          errors: response.errors.map((err) => ({
            message: err.message,
            path: err.path
          }))
        });
      } else {
        logger.info('graphql.request.success', {
          operationName,
          durationMs,
          status: response.status
        });
      }
    }
  });
};

// ---------------------------------------------------------------------------
// Instrumented fetch (wraps a provided fetch — never calls global fetch)
// ---------------------------------------------------------------------------

/**
 * Per-request timing checkpoints captured by the instrumented fetch. Coarse,
 * runtime-agnostic timings only — `fetchMs` (request settle), `bodyReadMs`
 * (body drain), and `host`. No undici per-phase breakdown (DNS/connect/TLS):
 * that required `node:diagnostics_channel`, which can't be bundled for
 * browser/Edge and is dropped here.
 */
export type GraphqlFetchTimings = {
  beforeFirstByteMs?: number;
  bodyReadMs?: number;
  fetchMs?: number;
  host?: string;
};

/**
 * Minimal subset of the Sentry tracing API that this middleware needs. Using
 * a structural type lets consumers pass `@sentry/nextjs`, `@sentry/node`, or
 * any compatible tracer without taking a hard dependency.
 */
export type GraphqlSpan = {
  setAttribute: (key: string, value: boolean | number | string) => void;
};

export type StartSpanFn = <T>(
  ctx: {
    attributes?: Record<string, boolean | number | string>;
    name: string;
    op?: string;
  },
  callback: (span: GraphqlSpan) => Promise<T>
) => Promise<T>;

/**
 * Wraps a caller-supplied `fetch` implementation with coarse request timings.
 * When a span tracer is supplied, a `graphql.fetch` span is opened around the
 * call with the timings attached as attributes; the structured log is always
 * emitted.
 *
 * **The package never calls Node's global `fetch` on its own.** You must
 * supply a `fetch` here — pass `globalThis.fetch` if you're happy with the
 * built-in, or your own version (e.g. one wrapped with retries) otherwise.
 */
export const createInstrumentedFetch = ({
  fetch: fetchImpl,
  logger,
  startSpan
}: {
  fetch: typeof fetch;
  logger?: GraphqlLogger;
  startSpan?: StartSpanFn;
}): typeof fetch => {
  /**
   * Executes a single fetch call, recording timings into the per-request
   * `timings` object and (optionally) writing span attributes when called
   * inside a tracer span.
   */
  const run = async (
    input: Parameters<typeof fetch>[0],
    init: Parameters<typeof fetch>[1],
    span?: GraphqlSpan
  ): Promise<Response> => {
    const startedAt = performance.now();
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const host = hostFromUrl(url);
    const method = init?.method ?? 'POST';

    const timings: GraphqlFetchTimings = { host };

    try {
      const response = await fetchImpl(input, init);
      const fetchSettledAt = performance.now();
      timings.fetchMs = fetchSettledAt - startedAt;
      timings.beforeFirstByteMs = fetchSettledAt - startedAt;
      const bodyStartAt = fetchSettledAt;

      const cloned = response.clone();
      void (async () => {
        try {
          const text = await cloned.text();
          timings.bodyReadMs = performance.now() - bodyStartAt;
          span?.setAttribute('http.response.body_bytes', text.length);
        } catch {
          // Body draining for instrumentation can fail quietly.
        }

        if (span) {
          span.setAttribute('http.status_code', response.status);
          if (timings.fetchMs != null)
            span.setAttribute('timing.fetch_ms', timings.fetchMs);
          if (timings.bodyReadMs != null)
            span.setAttribute('timing.body_read_ms', timings.bodyReadMs);
        }

        logger?.info('graphql.fetch.timing', {
          host,
          method,
          url,
          status: response.status,
          ...timings
        });
      })();

      return response;
    } catch (error) {
      timings.fetchMs = performance.now() - startedAt;
      logger?.error('graphql.fetch.error', {
        host,
        method,
        url,
        fetchMs: timings.fetchMs,
        message: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  };

  /**
   * Public `fetch` replacement. Opens a tracer span around the call when
   * `startSpan` is configured, otherwise runs `run` directly.
   */
  const instrumentedFetch: typeof fetch = async (input, init) => {
    if (!startSpan) {
      return run(input, init);
    }
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const host = hostFromUrl(url);
    const method = init?.method ?? 'POST';
    return startSpan(
      {
        name: `graphql.fetch ${method} ${host}`,
        op: 'http.client',
        attributes: {
          'http.url': url,
          'http.method': method,
          'http.host': host
        }
      },
      (span) => run(input, init, span)
    );
  };

  return instrumentedFetch;
};

/**
 * Plugin form of `createInstrumentedFetch`. Pass the consumer's `fetch` (or
 * `globalThis.fetch`) plus optional logger/tracer; the resulting plugin
 * installs the instrumented fetch on the client.
 */
export const withInstrumentedFetch = (params: {
  fetch: typeof fetch;
  logger?: GraphqlLogger;
  startSpan?: StartSpanFn;
}): GraphqlClientPlugin => {
  const fetchImpl = createInstrumentedFetch(params);
  return () => ({ fetch: fetchImpl });
};

// ---------------------------------------------------------------------------
// Retry fetch (wraps a provided fetch — never calls global fetch)
// ---------------------------------------------------------------------------

/**
 * Whether a thrown fetch error looks like a transient socket-level failure
 * (keep-alive reset, DNS hiccup, TLS handshake aborted). Inspects the error
 * AND its `cause`, since Node 18+ wraps `TypeError: fetch failed` around a
 * `SystemError` exposing the underlying code.
 */
const isTransientNetworkError = (err: unknown): boolean => {
  if (!(err instanceof Error)) return false;
  const causes: unknown[] = [err];
  if ('cause' in err && err.cause) causes.push(err.cause);
  return causes.some((e) => {
    if (!(e instanceof Error)) return false;
    const code = (e as NodeJS.ErrnoException).code;
    if (
      code === 'UND_ERR_SOCKET' ||
      code === 'UND_ERR_CONNECT_TIMEOUT' ||
      code === 'ECONNRESET' ||
      code === 'ETIMEDOUT' ||
      code === 'EPIPE' ||
      code === 'ENOTFOUND' ||
      code === 'EAI_AGAIN'
    ) {
      return true;
    }
    const msg = e.message;
    return (
      msg.includes('other side closed') ||
      msg.includes('Client network socket disconnected') ||
      msg.includes('socket hang up')
    );
  });
};

/**
 * Heuristic: a serialized graphql-request body whose `query` starts with the
 * keyword `query` is idempotent and safe to retry.
 */
const isQueryOperation = (body: BodyInit | null | undefined): boolean => {
  if (typeof body !== 'string') return false;
  try {
    const parsed = JSON.parse(body) as { query?: string };
    return typeof parsed.query === 'string'
      ? parsed.query.trimStart().startsWith('query')
      : false;
  } catch {
    return false;
  }
};

/**
 * Parses an RFC 7231 `Retry-After` header (seconds or HTTP-date) into a
 * millisecond delay. Returns `null` when the header is missing or invalid.
 */
const parseRetryAfterMs = (header: null | string): null | number => {
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const date = Date.parse(header);
  if (!Number.isNaN(date)) return Math.max(date - Date.now(), 0);
  return null;
};

/** Sleeps for `ms` milliseconds. */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wraps a caller-supplied `fetch` implementation with bounded retry on
 * transient failures:
 *   - network-level errors on idempotent (query) operations;
 *   - HTTP 429 with exponential backoff (or `Retry-After`);
 *   - HTTP 502/503/504 with exponential backoff (request didn't execute).
 *
 * Mutations are never retried on body-level errors because the server may
 * have already executed them. Query-only retries assume idempotency.
 *
 * **The package never calls Node's global `fetch` on its own.** Pass a
 * `fetch` here — usually `globalThis.fetch`.
 */
export const createRetryFetch = ({
  fetch: fetchImpl,
  logger,
  maxRetries = 4,
  maxThrottleWaitMs = 10_000,
  maxUpstreamWaitMs = 4_000
}: {
  fetch: typeof fetch;
  logger?: GraphqlLogger;
  maxRetries?: number;
  maxThrottleWaitMs?: number;
  maxUpstreamWaitMs?: number;
}): typeof fetch => {
  return async (input, init) => {
    const isQuery = isQueryOperation(init?.body);
    const signal = init?.signal;
    let attempt = 0;
    for (;;) {
      if (signal?.aborted) throw signal.reason ?? new Error('Aborted');

      let response: Response;
      try {
        response = await fetchImpl(input, init);
      } catch (err) {
        if (!isTransientNetworkError(err)) throw err;
        if (!isQuery) throw err;
        if (attempt >= maxRetries) throw err;
        const delay = 150 * 2 ** attempt;
        attempt += 1;
        logger?.warn('graphql.fetch.retry.network', {
          attempt,
          maxRetries,
          delay,
          message: err instanceof Error ? err.message : String(err)
        });
        await sleep(delay);
        continue;
      }

      if (response.status === 429 && attempt < maxRetries) {
        const retryAfter = parseRetryAfterMs(
          response.headers.get('retry-after')
        );
        const delay = Math.min(
          Math.max(retryAfter ?? 1000 * 2 ** attempt, 1000),
          maxThrottleWaitMs
        );
        attempt += 1;
        logger?.warn('graphql.fetch.retry.throttle', { attempt, delay });
        await sleep(delay);
        continue;
      }

      if (
        (response.status === 502 ||
          response.status === 503 ||
          response.status === 504) &&
        attempt < maxRetries
      ) {
        const retryAfter = parseRetryAfterMs(
          response.headers.get('retry-after')
        );
        const delay = Math.min(
          Math.max(retryAfter ?? 200 * 2 ** attempt, 200),
          maxUpstreamWaitMs
        );
        attempt += 1;
        logger?.warn('graphql.fetch.retry.upstream', {
          attempt,
          delay,
          status: response.status
        });
        await sleep(delay);
        continue;
      }

      return response;
    }
  };
};

/**
 * Plugin form of `createRetryFetch`. Pass the consumer's `fetch` and the
 * resulting plugin installs the retrying fetch on the client.
 *
 * Order matters: place this **before** `withInstrumentedFetch` to measure
 * each attempt individually; place it **after** to measure end-to-end
 * including retries.
 */
export const withRetryFetch = (
  params: Parameters<typeof createRetryFetch>[0]
): GraphqlClientPlugin => {
  const fetchImpl = createRetryFetch(params);
  return () => ({ fetch: fetchImpl });
};
