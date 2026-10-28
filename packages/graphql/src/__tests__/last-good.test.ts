import { describe, expect, test } from 'bun:test';
import type { GraphqlExecuteResult, GraphqlExecutor } from '../apq.js';
import { GRAPHQL_KEYS_HEADER } from '../keys.js';
import {
  withLastGood,
  type LastGoodClock,
  type LastGoodFallback,
  type LastGoodOptions,
  type LastGoodStore
} from '../last-good.js';
import { documentWithHash } from './helpers.js';

/*
 * `withLastGood`: every CMS read answers its last successful response when
 * the CMS fails or is slow, and nothing that is not a real answer ever
 * replaces that copy. Over a scripted executor, a map store and a manual
 * clock.
 */

type Data = { pages: { nodes: { databaseId: number }[] } | null };

const PAGE_BY_ID = documentWithHash<Data, Record<string, unknown>>(
  'query PageById($id: ID!) { pages { nodes { databaseId } } }',
  'c'.repeat(64)
);
const OFFICES = documentWithHash<Data, Record<string, unknown>>(
  'query Offices($id: ID!) { pages { nodes { databaseId } } }',
  'd'.repeat(64)
);
const SAVE_FORM = documentWithHash<Data, Record<string, unknown>>(
  'mutation SaveForm($id: ID!) { pages { nodes { databaseId } } }',
  'e'.repeat(64)
);

/** The Relay id WPGraphQL gives a post. */
const relay = (id: number) => btoa(`post:${String(id)}`);

/** `X-GraphQL-Keys` as WPGraphQL 2.x writes it, for post ids. */
const keysHeader = (...ids: number[]) =>
  [
    'b'.repeat(64),
    'graphql:Query',
    'operation:PageById',
    'list:page',
    ...ids.map(relay)
  ].join(' ');

/** A response, as an executor's `.withMeta` resolves it. */
const response = (data: Data, header?: string): GraphqlExecuteResult<Data> => ({
  data,
  durationMs: 12,
  headers: new Headers(header ? { [GRAPHQL_KEYS_HEADER]: header } : {}),
  transport: 'apq-get'
});

const PAGE_18 = { pages: { nodes: [{ databaseId: 18 }] } };
const PAGE_18_V2 = { pages: { nodes: [{ databaseId: 1018 }] } };
const DOWN = new Error('fetch failed: CERT_HAS_EXPIRED');

type Answer =
  | Error
  | GraphqlExecuteResult<Data>
  | Promise<GraphqlExecuteResult<Data>>;

/** The CMS, scripted: each call takes the next answer. */
const cmsAnswering = (...answers: Answer[]): GraphqlExecutor => {
  /** The next scripted answer. */
  const withMeta = <TResult>() => {
    const next = answers.shift();
    if (next === undefined) throw new Error('No scripted answer left');
    return (
      next instanceof Error ? Promise.reject(next) : Promise.resolve(next)
    ) as Promise<GraphqlExecuteResult<TResult>>;
  };
  return Object.assign(async <TResult>() => (await withMeta<TResult>()).data, {
    withMeta
  }) as GraphqlExecutor;
};

/** A store over a map, as the Runtime Cache behaves. */
const mapStore = () => {
  const entries = new Map<string, unknown>();
  const ttls: number[] = [];
  const store: LastGoodStore = {
    /** Reads a copy. */
    get: (key) => Promise.resolve(entries.get(key) ?? null),
    /** Writes a copy. */
    set: (key, value, { ttl }) => {
      entries.set(key, value);
      ttls.push(ttl);
      return Promise.resolve();
    }
  };
  return { entries, store, ttls };
};

/** A clock the test moves by hand. */
const manualClock = () => {
  let now = 1_000_000;
  let timers: { at: number; callback: () => void; id: number }[] = [];
  let ids = 0;
  const clock: LastGoodClock = {
    /** Cancels a timer. */
    clearTimeout: (handle) => {
      timers = timers.filter((timer) => timer.id !== handle);
    },
    /** The current time. */
    now: () => now,
    /** Schedules a timer. */
    setTimeout: (callback, ms) => {
      ids += 1;
      timers.push({ at: now + ms, callback, id: ids });
      return ids;
    }
  };
  /** Moves time forward, firing every timer that comes due. */
  const advance = (ms: number) => {
    now += ms;
    const due = timers.filter((timer) => timer.at <= now);
    timers = timers.filter((timer) => timer.at > now);
    for (const timer of due) timer.callback();
  };
  return { advance, clock };
};

/** Lets pending promise callbacks (store reads/writes) run. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/** A CMS answer that lands when the test says so. */
const deferred = () => {
  let land: ((value: GraphqlExecuteResult<Data>) => void) | undefined;
  const pending = new Promise<GraphqlExecuteResult<Data>>((resolve) => {
    land = resolve;
  });
  return {
    /** Lands the answer. */
    land: (value: GraphqlExecuteResult<Data>) => {
      land?.(value);
    },
    pending
  };
};

/** The rejection of a promise (fails the test when it resolves). */
const failure = async (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error('expected a rejection');
    },
    (error: unknown) => error
  );

/** `withLastGood` over a map store, recording every fallback. */
const setup = (
  executor: GraphqlExecutor,
  options: Partial<LastGoodOptions> = {}
) => {
  const { entries, store, ttls } = mapStore();
  const fallbacks: LastGoodFallback[] = [];
  const read = withLastGood(executor, {
    /** Records the fallback. */
    onFallback: (event) => fallbacks.push(event),
    store,
    ...options
  });
  return { entries, fallbacks, read, ttls };
};

describe('withLastGood', () => {
  test('a healthy CMS answers as is, and its answer is kept untagged for the TTL', async () => {
    const { entries, read, ttls } = setup(
      cmsAnswering(response(PAGE_18, keysHeader(18)))
    );

    const result = await read.withMeta(PAGE_BY_ID, { id: '18' });
    await flush();

    expect(result.stale).toBe(false);
    expect(result.data).toEqual(PAGE_18);
    expect(entries.size).toBe(1);
    expect(ttls).toEqual([31_536_000]);
  });

  test('the CMS throws: the copy, flagged stale, with the keys it was read with', async () => {
    const { fallbacks, read } = setup(
      cmsAnswering(response(PAGE_18, keysHeader(18, 70)), DOWN)
    );
    await read(PAGE_BY_ID, { id: '18', language: 'fr' });
    await flush();

    // The same variables in another order are the same read.
    const result = await read.withMeta(PAGE_BY_ID, {
      language: 'fr',
      id: '18'
    });

    expect(result.stale).toBe(true);
    expect(result.data).toEqual(PAGE_18);
    expect(result.headers.get(GRAPHQL_KEYS_HEADER)).toBe(keysHeader(18, 70));
    expect(fallbacks).toEqual([
      {
        error: DOWN,
        operationName: 'PageById',
        reason: 'error',
        variables: { language: 'fr', id: '18' }
      }
    ]);
  });

  test('the CMS back: its new answer, which replaces the copy', async () => {
    const { read } = setup(
      cmsAnswering(response(PAGE_18), DOWN, response(PAGE_18_V2), DOWN)
    );
    await read(PAGE_BY_ID, { id: '18' });
    await flush();
    await read(PAGE_BY_ID, { id: '18' });

    expect(await read.withMeta(PAGE_BY_ID, { id: '18' })).toMatchObject({
      data: PAGE_18_V2,
      stale: false
    });
    await flush();
    expect(await read(PAGE_BY_ID, { id: '18' })).toEqual(PAGE_18_V2);
  });

  test('no copy of this read: the CMS error, unchanged (another read’s copy never answers)', async () => {
    const { read } = setup(cmsAnswering(response(PAGE_18), DOWN, DOWN));
    await read(PAGE_BY_ID, { id: '18' });
    await flush();

    expect(await failure(read(PAGE_BY_ID, { id: '19' }))).toBe(DOWN);
    expect(await failure(read(OFFICES, { id: '18' }))).toBe(DOWN);
  });

  test('an empty answer (every root null) is returned but never stored', async () => {
    const { entries, read } = setup(
      cmsAnswering(response(PAGE_18), response({ pages: null }), DOWN)
    );
    await read(PAGE_BY_ID, { id: '18' });
    await flush();

    expect(await read.withMeta(PAGE_BY_ID, { id: '18' })).toMatchObject({
      data: { pages: null },
      stale: false
    });
    await flush();
    expect(entries.size).toBe(1);
    expect(await read(PAGE_BY_ID, { id: '18' })).toEqual(PAGE_18);
  });

  test('isEmptyAnswer is configurable', async () => {
    const { entries, read } = setup(cmsAnswering(response(PAGE_18)), {
      /** Refuses everything. */
      isEmptyAnswer: () => true
    });

    await read(PAGE_BY_ID, { id: '18' });
    await flush();
    expect(entries.size).toBe(0);
  });

  test('an answer with no data at all is answered like a failure', async () => {
    const { read } = setup(
      cmsAnswering(
        response(PAGE_18),
        response(undefined as unknown as Data),
        response(undefined as unknown as Data)
      )
    );
    await read(PAGE_BY_ID, { id: '18' });
    await flush();

    expect(await read.withMeta(PAGE_BY_ID, { id: '18' })).toMatchObject({
      data: PAGE_18,
      stale: true
    });
    expect(await failure(read(PAGE_BY_ID, { id: '19' }))).toBeInstanceOf(Error);
  });

  test('a mutation is never kept nor replaced', async () => {
    const { entries, read } = setup(cmsAnswering(response(PAGE_18), DOWN));

    await read(SAVE_FORM, { id: '18' });
    await flush();

    expect(entries.size).toBe(0);
    expect(await failure(read(SAVE_FORM, { id: '18' }))).toBe(DOWN);
  });

  test('keys are lent to a keyless hit (Smart Cache’s object cache)', async () => {
    const { entries, read } = setup(
      cmsAnswering(
        response(PAGE_18, keysHeader(18, 70)),
        response(PAGE_18, keysHeader())
      )
    );
    await read(PAGE_BY_ID, { id: '18' });
    await flush();

    const hit = await read.withMeta(PAGE_BY_ID, { id: '18' });
    await flush();

    expect(hit.headers.get(GRAPHQL_KEYS_HEADER)).toBe(keysHeader(18, 70));
    // And the copy keeps them for the next hit.
    expect([...entries.values()]).toEqual([
      expect.objectContaining({ keys: keysHeader(18, 70) })
    ]);
  });

  test('a failing store costs the fallback, never the read', async () => {
    const broken: LastGoodStore = {
      /** Fails. */
      get: () => Promise.reject(new Error('store down')),
      /** Fails. */
      set: () => Promise.reject(new Error('store down'))
    };
    const errors: string[] = [];
    const read = withLastGood(cmsAnswering(response(PAGE_18), DOWN), {
      logger: {
        /** Ignored. */
        debug: () => undefined,
        /** Records the write failure. */
        error: (message) => errors.push(message),
        /** Ignored. */
        info: () => undefined,
        /** Ignored. */
        warn: () => undefined
      },
      store: broken
    });

    expect(await read(PAGE_BY_ID, { id: '18' })).toEqual(PAGE_18);
    await flush();
    expect(errors).toEqual(['graphql.last_good.write_failed']);
    expect(await failure(read(PAGE_BY_ID, { id: '18' }))).toBe(DOWN);
  });

  test('the CMS slow, with a copy: the copy at the soft deadline, then the background refresh updates it', async () => {
    const { advance, clock } = manualClock();
    const slow = deferred();
    const deferredWork: Promise<unknown>[] = [];
    const { entries, fallbacks, read } = setup(
      cmsAnswering(response(PAGE_18), slow.pending),
      {
        clock,
        /** Records the background work. */
        defer: (work) => deferredWork.push(work)
      }
    );
    await read(PAGE_BY_ID, { id: '18' });
    await flush();

    const pending = read.withMeta(PAGE_BY_ID, { id: '18' });
    await flush();
    advance(2_999);
    await flush();
    advance(1);

    expect(await pending).toMatchObject({ data: PAGE_18, stale: true });
    expect(fallbacks.map((event) => event.reason)).toEqual(['slow']);

    slow.land(response(PAGE_18_V2));
    await Promise.all(deferredWork);
    await flush();
    expect([...entries.values()]).toEqual([
      expect.objectContaining({ data: PAGE_18_V2 })
    ]);
  });

  test('the CMS slow, with no copy: the read waits for the CMS', async () => {
    const { advance, clock } = manualClock();
    const slow = deferred();
    const { fallbacks, read } = setup(cmsAnswering(slow.pending), { clock });

    const pending = read.withMeta(PAGE_BY_ID, { id: '18' });
    await flush();
    advance(10_000);
    await flush();
    slow.land(response(PAGE_18));

    expect(await pending).toMatchObject({ data: PAGE_18, stale: false });
    expect(fallbacks).toEqual([]);
  });

  test('after a failure, the next read with a copy waits only the short deadline, for the slow window', async () => {
    const { advance, clock } = manualClock();
    const { fallbacks, read } = setup(
      cmsAnswering(
        response(PAGE_18),
        DOWN,
        deferred().pending,
        deferred().pending
      ),
      { clock }
    );
    await read(PAGE_BY_ID, { id: '18' });
    await flush();
    await read(PAGE_BY_ID, { id: '18' }); // DOWN: opens the slow window

    const short = read.withMeta(PAGE_BY_ID, { id: '18' });
    await flush();
    advance(500);
    expect(await short).toMatchObject({ stale: true });

    // Past the window (30s after the last miss): the full 3s again.
    advance(30_001);
    const full = read.withMeta(PAGE_BY_ID, { id: '18' });
    await flush();
    advance(500);
    await flush();
    let settled = false;
    void full.then(() => (settled = true));
    await flush();
    expect(settled).toBe(false);
    advance(2_500);
    expect(await full).toMatchObject({ stale: true });
    expect(fallbacks.map((event) => event.reason)).toEqual([
      'error',
      'slow',
      'slow'
    ]);
  });

  test('custom deadlines are honoured', async () => {
    const { advance, clock } = manualClock();
    const { read } = setup(
      cmsAnswering(response(PAGE_18), deferred().pending),
      {
        clock,
        softTimeoutMs: 50
      }
    );
    await read(PAGE_BY_ID, { id: '18' });
    await flush();

    const pending = read.withMeta(PAGE_BY_ID, { id: '18' });
    await flush();
    advance(50);
    expect(await pending).toMatchObject({ stale: true });
  });

  test('enabled: () => false: the store is neither read nor written', async () => {
    const { entries, read } = setup(cmsAnswering(response(PAGE_18), DOWN), {
      /** Off, as during `next build`. */
      enabled: () => false
    });

    await read(PAGE_BY_ID, { id: '18' });
    await flush();

    expect(entries.size).toBe(0);
    expect(await failure(read(PAGE_BY_ID, { id: '18' }))).toBe(DOWN);
  });

  test('an answer over maxBytes is not stored', async () => {
    const huge = {
      pages: {
        nodes: Array.from({ length: 1_000 }, (_, databaseId) => ({
          databaseId
        }))
      }
    };
    const { entries, read } = setup(cmsAnswering(response(huge)), {
      maxBytes: 1_000
    });

    expect(await read(PAGE_BY_ID, { id: '18' })).toBe(huge);
    await flush();
    expect(entries.size).toBe(0);
  });

  test('a throwing onFallback never takes the read down', async () => {
    const { read } = setup(cmsAnswering(response(PAGE_18), DOWN), {
      /** Throws, as `cacheLife` does outside a cache scope. */
      onFallback: () => {
        throw new Error('not in a cache scope');
      }
    });
    await read(PAGE_BY_ID, { id: '18' });
    await flush();

    expect(await read(PAGE_BY_ID, { id: '18' })).toEqual(PAGE_18);
  });
});
