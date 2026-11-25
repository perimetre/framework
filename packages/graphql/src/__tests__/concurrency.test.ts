import { describe, expect, test } from 'bun:test';
import { createWpGraphql } from '../index.js';
import {
  createConcurrencyLimitFetch,
  RequestTimeoutError
} from '../middlewares.js';
import { asFetch, documentWithHash } from './helpers.js';

const ENDPOINT = 'https://cms.example.test/graphql';

/** One request the fake origin received, answered when the test says so. */
type Pending = {
  /** Fails it as a network error does (connection reset). */
  fail: () => void;
  init: RequestInit | undefined;
  /** Answers it. */
  respond: (body: unknown, status?: number) => void;
  /**
   * Answers its headers and the start of a body that never finishes; the
   * body errors once the request is aborted.
   */
  stall: () => void;
  url: string;
};

/**
 * A fake origin whose requests stay open until the test answers them.
 * @returns The `fetch`, every request it got, and how many are open.
 */
const origin = () => {
  const requests: Pending[] = [];
  let open = 0;
  let peak = 0;
  /** The fake `fetch`. */
  const send = (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const { promise, reject, resolve } = Promise.withResolvers<Response>();
    let settled = false;
    open++;
    peak = Math.max(peak, open);
    /** Closes the request once. */
    const close = () => {
      if (settled) return false;
      settled = true;
      open--;
      return true;
    };
    init?.signal?.addEventListener('abort', () => {
      if (close()) reject(new DOMException('aborted', 'AbortError'));
    });
    requests.push({
      /** Fails the request (once). */
      fail: () => {
        if (close()) reject(new TypeError('fetch failed'));
      },
      init,
      /** Answers the request (once). */
      respond: (body, status = 200) => {
        if (close()) resolve(Response.json(body, { status }));
      },
      /** Sends headers and part of a body, then nothing (once). */
      stall: () => {
        if (settled) return;
        resolve(
          new Response(
            new ReadableStream<Uint8Array>({
              /** Half a JSON document; errors when the request aborts. */
              start: (controller) => {
                controller.enqueue(new TextEncoder().encode('{"data":'));
                init?.signal?.addEventListener('abort', () => {
                  close();
                  controller.error(new DOMException('aborted', 'AbortError'));
                });
              }
            }),
            { headers: { 'content-type': 'application/json' } }
          )
        );
      },
      url:
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url
    });
    return promise;
  };
  return {
    fetch: asFetch(send),
    /** Requests open right now. */
    open: () => open,
    /** The most requests open at once. */
    peak: () => peak,
    requests
  };
};

/** Lets queued promise callbacks run. */
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

/** What a request settled as, never throwing. */
const outcome = (request: Promise<Response>) =>
  request.then(
    (response) => (response.ok ? 'ok' : `http ${String(response.status)}`),
    () => 'threw'
  );

/** A unique scope per test, so process-wide limits never leak between tests. */
let scopes = 0;
/** A scope no other test uses. */
const freshScope = () => `test-${String(++scopes)}-${String(Date.now())}`;

describe('createConcurrencyLimitFetch', () => {
  test('at most maxConcurrent at once; the rest wait in line, in order, and all are answered', async () => {
    const cms = origin();
    const limited = createConcurrencyLimitFetch({
      fetch: cms.fetch,
      maxConcurrent: 2
    });

    const requests = [1, 2, 3, 4, 5].map((id) =>
      limited(`${ENDPOINT}?id=${String(id)}`)
    );
    await tick();
    expect(cms.requests.length).toBe(2);

    for (let answered = 0; answered < 5; answered++) {
      cms.requests[answered]?.respond({ data: { answered } });
      await tick();
      await tick();
    }

    expect(await Promise.all(requests.map(outcome))).toStrictEqual([
      'ok',
      'ok',
      'ok',
      'ok',
      'ok'
    ]);
    expect(cms.peak()).toBe(2);
    expect(cms.requests.map((request) => request.url)).toStrictEqual(
      [1, 2, 3, 4, 5].map((id) => `${ENDPOINT}?id=${String(id)}`)
    );
  });

  test('the response comes back whole: status, headers and body', async () => {
    const limited = createConcurrencyLimitFetch({
      fetch: asFetch(() =>
        Promise.resolve(
          Response.json(
            { data: { ok: true } },
            { headers: { 'X-GraphQL-Keys': 'post:1' }, status: 202 }
          )
        )
      ),
      maxConcurrent: 1
    });

    const response = await limited(ENDPOINT);

    expect(response.status).toBe(202);
    expect(response.headers.get('x-graphql-keys')).toBe('post:1');
    expect(await response.json()).toStrictEqual({ data: { ok: true } });
  });

  test('a 204 comes back with no body', async () => {
    const limited = createConcurrencyLimitFetch({
      fetch: asFetch(() =>
        Promise.resolve(new Response(null, { status: 204 }))
      ),
      maxConcurrent: 1
    });

    const response = await limited(ENDPOINT);

    expect(response.status).toBe(204);
    expect(response.body).toBeNull();
  });

  test('enabled() returning false sends the request outside the limit (`next build`)', async () => {
    const cms = origin();
    const limited = createConcurrencyLimitFetch({
      /** Off, as during `next build`. */
      enabled: () => false,
      fetch: cms.fetch,
      maxConcurrent: 1
    });

    for (const id of [1, 2, 3, 4]) void limited(`${ENDPOINT}?id=${String(id)}`);
    await tick();

    expect(cms.requests.length).toBe(4);
    for (const request of cms.requests) request.respond({ data: {} });
  });

  test('a request holds its slot for itself only: one that waits on another cannot deadlock', async () => {
    const cms = origin();
    const limited = createConcurrencyLimitFetch({
      fetch: cms.fetch,
      maxConcurrent: 1
    });

    const outer = (async () => {
      await limited(`${ENDPOINT}?id=outer`);
      return (await (await limited(`${ENDPOINT}?id=inner`)).json()) as unknown;
    })();
    await tick();
    cms.requests[0]?.respond({ data: 'outer' });
    await tick();
    await tick();
    cms.requests[1]?.respond({ data: 'inner' });

    expect(await outer).toStrictEqual({ data: 'inner' });
  });

  test('rejects a limit that is not a positive integer', () => {
    for (const maxConcurrent of [0, -1, 1.5, Number.NaN]) {
      expect(() =>
        createConcurrencyLimitFetch({ fetch: origin().fetch, maxConcurrent })
      ).toThrow('the concurrency limit must be a positive integer');
    }
    expect(() =>
      createConcurrencyLimitFetch({
        fetch: origin().fetch,
        holdLimitMs: 0,
        maxConcurrent: 1
      })
    ).toThrow('the hold limit must be a positive integer');
  });
});

describe('a queued request keeps its caller’s deadline', () => {
  test('an abort while queued leaves the line, rejects with the signal’s reason, and never reaches the origin', async () => {
    const cms = origin();
    const limited = createConcurrencyLimitFetch({
      fetch: cms.fetch,
      maxConcurrent: 1
    });
    const caller = new AbortController();

    const first = limited(`${ENDPOINT}?id=1`);
    const queued = limited(`${ENDPOINT}?id=2`, { signal: caller.signal });
    const third = limited(`${ENDPOINT}?id=3`);
    await tick();
    const reason = new Error('the caller gave up');
    caller.abort(reason);

    expect(await queued.catch((error: unknown) => error)).toBe(reason);
    cms.requests[0]?.respond({ data: {} });
    await first;
    await tick();
    await tick();
    // The aborted request's place went to the next in line.
    expect(cms.requests.map((request) => request.url)).toStrictEqual([
      `${ENDPOINT}?id=1`,
      `${ENDPOINT}?id=3`
    ]);
    cms.requests[1]?.respond({ data: {} });
    expect(await outcome(third)).toBe('ok');
  });

  test('a signal already aborted rejects without queueing', async () => {
    const cms = origin();
    const limited = createConcurrencyLimitFetch({
      fetch: cms.fetch,
      maxConcurrent: 1
    });

    expect(
      await outcome(limited(ENDPOINT, { signal: AbortSignal.abort() }))
    ).toBe('threw');
    expect(cms.requests.length).toBe(0);
  });
});

describe('a slot always comes back', () => {
  // A slot that never came back would cost the process one of its slots for
  // good; all of them, and every request queues until its deadline.

  /** A limit of one, a first request ended by `end`, then a second request that must get through. */
  const nextGetsThrough = async (
    end: (
      cms: ReturnType<typeof origin>,
      caller: AbortController
    ) => Promise<void> | void,
    holdLimitMs?: number
  ) => {
    const cms = origin();
    const limited = createConcurrencyLimitFetch({
      fetch: cms.fetch,
      holdLimitMs,
      maxConcurrent: 1
    });
    const caller = new AbortController();
    const first = outcome(
      limited(`${ENDPOINT}?id=1`, { signal: caller.signal })
    );
    const next = limited(`${ENDPOINT}?id=2`);
    await tick();
    await end(cms, caller);
    await first;
    await tick();
    await tick();
    expect(cms.requests[1]?.url).toBe(`${ENDPOINT}?id=2`);
    cms.requests[1]?.respond({ data: {} });
    expect(await outcome(next)).toBe('ok');
    return first;
  };

  test('after an error answer', async () => {
    expect(
      await nextGetsThrough((cms) => {
        cms.requests[0]?.respond({ errors: [] }, 500);
      })
    ).toBe('http 500');
  });

  test('after a network failure', async () => {
    expect(
      await nextGetsThrough((cms) => {
        cms.requests[0]?.fail();
      })
    ).toBe('threw');
  });

  test('after an abort while sending', async () => {
    expect(
      await nextGetsThrough((_cms, caller) => {
        caller.abort();
      })
    ).toBe('threw');
  });

  test('after an abort while the body streams', async () => {
    expect(
      await nextGetsThrough(async (cms, caller) => {
        cms.requests[0]?.stall();
        await tick();
        caller.abort();
      })
    ).toBe('threw');
  });

  test('at the hold limit, for a caller with no deadline and an origin that never answers', async () => {
    const cms = origin();
    const limited = createConcurrencyLimitFetch({
      fetch: cms.fetch,
      holdLimitMs: 30,
      maxConcurrent: 1
    });

    const hung = outcome(limited(`${ENDPOINT}?id=1`));
    const next = limited(`${ENDPOINT}?id=2`);
    expect(await hung).toBe('threw');
    await tick();
    expect(cms.requests[0]?.init?.signal?.aborted).toBe(true);
    cms.requests[1]?.respond({ data: {} });
    expect(await outcome(next)).toBe('ok');
  });

  test('at the hold limit, for a body that never finishes', async () => {
    const cms = origin();
    const limited = createConcurrencyLimitFetch({
      fetch: cms.fetch,
      holdLimitMs: 30,
      maxConcurrent: 1
    });

    const stalled = outcome(limited(`${ENDPOINT}?id=1`));
    const next = limited(`${ENDPOINT}?id=2`);
    await tick();
    cms.requests[0]?.stall();
    expect(await stalled).toBe('threw');
    await tick();
    cms.requests[1]?.respond({ data: {} });
    expect(await outcome(next)).toBe('ok');
  });

  test('when nobody reads the response: the body is read under the slot', async () => {
    const cms = origin();
    const limited = createConcurrencyLimitFetch({
      fetch: cms.fetch,
      maxConcurrent: 1
    });

    const unread = limited(`${ENDPOINT}?id=1`);
    const next = limited(`${ENDPOINT}?id=2`);
    await tick();
    cms.requests[0]?.respond({ data: { big: 'x'.repeat(10_000) } });
    await unread; // its body is never consumed
    await tick();
    cms.requests[1]?.respond({ data: {} });
    expect(await outcome(next)).toBe('ok');
  });
});

describe('scope', () => {
  test('limiters with the same scope share one limit (one per process, whichever module made them)', async () => {
    const cms = origin();
    const scope = freshScope();
    const a = createConcurrencyLimitFetch({
      fetch: cms.fetch,
      maxConcurrent: 2,
      scope
    });
    const b = createConcurrencyLimitFetch({
      fetch: cms.fetch,
      maxConcurrent: 2,
      scope
    });

    void a(`${ENDPOINT}?id=1`);
    void b(`${ENDPOINT}?id=2`);
    void a(`${ENDPOINT}?id=3`);
    void b(`${ENDPOINT}?id=4`);
    await tick();

    expect(cms.open()).toBe(2);
    for (const request of cms.requests) request.respond({ data: {} });
    await tick();
    await tick();
    for (const request of cms.requests) request.respond({ data: {} });
  });

  test('limiters sharing a scope must share their limit', () => {
    const scope = freshScope();
    createConcurrencyLimitFetch({
      fetch: origin().fetch,
      maxConcurrent: 2,
      scope
    });

    expect(() =>
      createConcurrencyLimitFetch({
        fetch: origin().fetch,
        maxConcurrent: 3,
        scope
      })
    ).toThrow(
      `the concurrency scope "${scope}" already has a limit of 2, not 3`
    );
  });

  test('without a scope, each limiter counts only its own requests', async () => {
    const cms = origin();
    const a = createConcurrencyLimitFetch({
      fetch: cms.fetch,
      maxConcurrent: 1
    });
    const b = createConcurrencyLimitFetch({
      fetch: cms.fetch,
      maxConcurrent: 1
    });

    void a(`${ENDPOINT}?id=1`);
    void b(`${ENDPOINT}?id=2`);
    await tick();

    expect(cms.open()).toBe(2);
    for (const request of cms.requests) request.respond({ data: {} });
  });
});

describe('createWpGraphql({ maxConcurrentRequests })', () => {
  const POSTS = documentWithHash<{ posts: unknown }>(
    'query Posts { posts { nodes { id } } }'
  );

  test('limits every request the bundle sends', async () => {
    const cms = origin();
    const { executeGraphqlRequest } = createWpGraphql({
      // A fresh endpoint per test: the default scope is the endpoint.
      endpoint: `${ENDPOINT}/${freshScope()}`,
      fetch: cms.fetch,
      maxConcurrentRequests: 2
    });

    const reads = [1, 2, 3].map(() => executeGraphqlRequest(POSTS));
    await tick();
    expect(cms.open()).toBe(2);
    for (let answered = 0; answered < 3; answered++) {
      cms.requests[answered]?.respond({ data: { posts: answered } });
      await tick();
      await tick();
    }

    expect(await Promise.all(reads)).toStrictEqual([
      { posts: 0 },
      { posts: 1 },
      { posts: 2 }
    ]);
    expect(cms.peak()).toBe(2);
  });

  test('unset: no limit', async () => {
    const cms = origin();
    const { executeGraphqlRequest } = createWpGraphql({
      endpoint: `${ENDPOINT}/${freshScope()}`,
      fetch: cms.fetch,
      // Nothing wraps `fetch` here, so the client keeps graphql-request's
      // own unless told otherwise.
      options: { fetch: cms.fetch }
    });

    for (let index = 0; index < 6; index++) void executeGraphqlRequest(POSTS);
    await tick();

    expect(cms.open()).toBe(6);
    for (const request of cms.requests) request.respond({ data: {} });
  });

  test('bundles on the same endpoint share one limit', async () => {
    const cms = origin();
    const endpoint = `${ENDPOINT}/${freshScope()}`;
    const first = createWpGraphql({
      endpoint,
      fetch: cms.fetch,
      maxConcurrentRequests: 1
    });
    const second = createWpGraphql({
      endpoint,
      fetch: cms.fetch,
      maxConcurrentRequests: 1
    });

    void first.executeGraphqlRequest(POSTS);
    void second.executeGraphqlRequest(POSTS);
    await tick();

    expect(cms.open()).toBe(1);
    cms.requests[0]?.respond({ data: {} });
    await tick();
    await tick();
    cms.requests[1]?.respond({ data: {} });
  });

  test('time spent waiting for a slot counts against requestTimeoutMs', async () => {
    const cms = origin();
    const endpoint = `${ENDPOINT}/${freshScope()}`;
    // Another bundle on the same CMS holds the only slot, with no deadline.
    const holder = createWpGraphql({
      endpoint,
      fetch: cms.fetch,
      maxConcurrentRequests: 1
    });
    const timed = createWpGraphql({
      endpoint,
      fetch: cms.fetch,
      maxConcurrentRequests: 1,
      requestTimeoutMs: 40
    });

    const held = holder.executeGraphqlRequest(POSTS);
    await tick();
    const queued = await timed
      .executeGraphqlRequest(POSTS)
      .catch((error: unknown) => error);

    expect(queued).toBeInstanceOf(RequestTimeoutError);
    // It timed out in line: it never reached the origin.
    expect(cms.requests.length).toBe(1);
    cms.requests[0]?.respond({ data: { posts: [] } });
    expect(await held).toStrictEqual({ posts: [] });
  });

  test('requires fetch', () => {
    expect(() =>
      createWpGraphql({ endpoint: ENDPOINT, maxConcurrentRequests: 2 })
    ).toThrow('requires `fetch` when `maxConcurrentRequests` is set');
  });
});
