import { describe, expect, test } from 'bun:test';
import { createWpGraphql } from '../index.js';
import { createTimeoutFetch, RequestTimeoutError } from '../middlewares.js';
import {
  createFetchMock,
  documentWithHash,
  GET_POSTS_DATA,
  GET_POSTS_HASH,
  GET_POSTS_SOURCE,
  jsonResponse
} from './helpers.js';

const ENDPOINT = 'https://cms.example.test/graphql';

/**
 * A CMS that never answers: the request only settles when its signal aborts,
 * rejecting with the signal's reason (what `fetch` does).
 */
const hangingFetch = createFetchMock(
  (call) =>
    new Promise<Response>((_resolve, reject) => {
      const signal = call.init?.signal;
      signal?.addEventListener('abort', () => {
        reject(signal.reason as Error);
      });
    })
);

describe('createTimeoutFetch', () => {
  test('a request with no response in time rejects in the package’s own words', async () => {
    const timed = createTimeoutFetch({
      fetch: hangingFetch.fetch,
      messagePrefix: 'Stelpro CMS request',
      timeoutMs: 20
    });

    const error = await timed(ENDPOINT).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RequestTimeoutError);
    expect((error as RequestTimeoutError).message).toBe(
      'Stelpro CMS request timed out after 20ms (no response)'
    );
    expect((error as RequestTimeoutError).timeoutMs).toBe(20);
  });

  test('defaults to a "CMS request" prefix', async () => {
    const timed = createTimeoutFetch({
      fetch: hangingFetch.fetch,
      timeoutMs: 10
    });

    expect(
      ((await timed(ENDPOINT).catch((e: unknown) => e)) as Error).message
    ).toBe('CMS request timed out after 10ms (no response)');
  });

  test('a caller abort wins over the timeout and keeps its own error', async () => {
    const timed = createTimeoutFetch({
      fetch: hangingFetch.fetch,
      timeoutMs: 5_000
    });
    const controller = new AbortController();
    const reason = new DOMException('Navigated away', 'AbortError');

    const pending = timed(ENDPOINT, { signal: controller.signal }).catch(
      (e: unknown) => e
    );
    controller.abort(reason);

    expect(await pending).toBe(reason);
  });

  test('enabled: () => false sends the request with no limit', async () => {
    const mock = createFetchMock(
      () =>
        new Promise<Response>((resolve) =>
          setTimeout(() => {
            resolve(jsonResponse({ data: GET_POSTS_DATA }));
          }, 40)
        )
    );
    const timed = createTimeoutFetch({
      /** Always off, as during `next build`. */
      enabled: () => false,
      fetch: mock.fetch,
      timeoutMs: 5
    });

    const response = await timed(ENDPOINT);

    expect(response.status).toBe(200);
    expect(mock.calls[0]?.init?.signal).toBeUndefined();
  });

  test('an answer inside the limit passes through', async () => {
    const mock = createFetchMock(() => jsonResponse({ data: GET_POSTS_DATA }));
    const timed = createTimeoutFetch({ fetch: mock.fetch, timeoutMs: 1_000 });

    expect((await timed(ENDPOINT)).status).toBe(200);
    expect(mock.calls[0]?.init?.signal).toBeInstanceOf(AbortSignal);
  });

  test('refuses a limit that is not a positive integer', () => {
    for (const timeoutMs of [0, -1, 1.5, Number.NaN]) {
      expect(() =>
        createTimeoutFetch({ fetch: hangingFetch.fetch, timeoutMs })
      ).toThrow('positive integer');
    }
  });
});

describe('createWpGraphql({ requestTimeoutMs })', () => {
  const GetPosts = documentWithHash<typeof GET_POSTS_DATA>(
    GET_POSTS_SOURCE,
    GET_POSTS_HASH
  );

  test('a hung APQ GET rejects with the timeout, without a POST', async () => {
    const methods: (string | undefined)[] = [];
    const { executeGraphqlRequest } = createWpGraphql({
      apq: true,
      endpoint: ENDPOINT,
      fetch: (async (input, init) => {
        methods.push(init?.method);
        return hangingFetch.fetch(input, init);
      }) as typeof fetch,
      persistedDocuments: { [GET_POSTS_HASH]: GET_POSTS_SOURCE },
      requestTimeoutMs: 20
    });

    const error = await executeGraphqlRequest(GetPosts).catch(
      (e: unknown) => e
    );

    expect(error).toBeInstanceOf(RequestTimeoutError);
    expect(methods).toEqual(['GET']);
  });

  test('the client POST is timed too, with no logger or tracer configured', async () => {
    const { executeGraphqlRequest } = createWpGraphql({
      endpoint: ENDPOINT,
      fetch: hangingFetch.fetch,
      requestTimeout: { messagePrefix: 'WordPress request' },
      requestTimeoutMs: 20
    });

    const error = await executeGraphqlRequest(GetPosts).catch(
      (e: unknown) => e
    );

    expect((error as Error).message).toBe(
      'WordPress request timed out after 20ms (no response)'
    );
  });

  test('requires a fetch to wrap', () => {
    expect(() =>
      createWpGraphql({ endpoint: ENDPOINT, requestTimeoutMs: 20 })
    ).toThrow('requires `fetch`');
  });
});
