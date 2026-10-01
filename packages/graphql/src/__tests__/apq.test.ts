import { describe, expect, test } from 'bun:test';
import {
  createApqExecutor,
  createPassthroughExecutor,
  type GraphqlRequestContext,
  type GraphqlRequestPlugin,
  type GraphqlResponseOutcome
} from '../apq.js';
import { createGraphqlClient } from '../client.js';
import {
  createFetchMock,
  documentWithHash,
  GET_POSTS_DATA,
  GET_POSTS_HASH,
  GET_POSTS_KEYS,
  GET_POSTS_SOURCE,
  jsonResponse,
  keysOf,
  UPDATE_POST_SOURCE,
  type FetchScript
} from './helpers.js';

const ENDPOINT = 'https://cms.example.test/graphql';
const NOT_FOUND = { errors: [{ message: 'PersistedQueryNotFound' }] };

/**
 * Wires an APQ executor and a real `graphql-request` client to the same
 * scripted fetch, and records every `onResponse` outcome.
 */
const setup = (
  script: FetchScript,
  {
    errorPolicy,
    persistedDocuments = { [GET_POSTS_HASH]: GET_POSTS_SOURCE }
  }: {
    errorPolicy?: 'all' | 'none';
    persistedDocuments?: Record<string, string>;
  } = {}
) => {
  const mock = createFetchMock(script);
  const outcomes: {
    context: GraphqlRequestContext;
    result: GraphqlResponseOutcome;
  }[] = [];
  const observer: GraphqlRequestPlugin = {
    /** Records every settled request. */
    onResponse: (context, result) => {
      outcomes.push({ context, result });
    }
  };
  const client = createGraphqlClient({
    endpoint: ENDPOINT,
    options: { fetch: mock.fetch, errorPolicy }
  });
  const execute = createApqExecutor({
    client,
    endpoint: ENDPOINT,
    fetch: mock.fetch,
    persistedDocuments,
    requestPlugins: [observer]
  });
  return { calls: mock.calls, execute, outcomes };
};

const GetPosts = documentWithHash<typeof GET_POSTS_DATA>(
  GET_POSTS_SOURCE,
  GET_POSTS_HASH
);

describe('createApqExecutor', () => {
  test('APQ GET hit: data-only call is unchanged, withMeta returns the GET headers', async () => {
    const { calls, execute, outcomes } = setup(() =>
      jsonResponse(
        { data: GET_POSTS_DATA },
        { headers: { 'X-GraphQL-Keys': GET_POSTS_KEYS } }
      )
    );

    const data = await execute(GetPosts);
    expect(data).toEqual(GET_POSTS_DATA);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.init?.method).toBe('GET');
    expect(calls[0]?.url).toContain(`queryId=${GET_POSTS_HASH}`);

    const meta = await execute.withMeta(GetPosts);
    expect(meta.data).toEqual(GET_POSTS_DATA);
    expect(meta.transport).toBe('apq-get');
    expect(keysOf(meta.headers)).toBe(GET_POSTS_KEYS);
    expect(typeof meta.durationMs).toBe('number');

    // onResponse sees headers + transport on both the plain and withMeta calls.
    expect(outcomes).toHaveLength(2);
    for (const { context, result } of outcomes) {
      expect(context.operationName).toBe('GetPosts');
      expect(result.data).toEqual(GET_POSTS_DATA);
      expect(result.transport).toBe('apq-get');
      expect(keysOf(result.headers)).toBe(GET_POSTS_KEYS);
      expect(result.error).toBeUndefined();
    }
  });

  test('APQ miss then register POST: surfaces the POST (final) response headers', async () => {
    const { calls, execute, outcomes } = setup((call) =>
      call.init?.method === 'GET'
        ? jsonResponse(NOT_FOUND, { headers: { 'X-GraphQL-Keys': 'stale' } })
        : jsonResponse(
            { data: GET_POSTS_DATA },
            { headers: { 'X-GraphQL-Keys': GET_POSTS_KEYS } }
          )
    );

    const meta = await execute.withMeta(GetPosts);

    expect(calls.map((c) => c.init?.method)).toEqual(['GET', 'POST']);
    // The register POST carries both the query text and the id.
    const registerBody = JSON.parse(calls[1]?.init?.body as string) as Record<
      string,
      unknown
    >;
    expect(registerBody.queryId).toBe(GET_POSTS_HASH);
    expect(registerBody.query).toBe(GET_POSTS_SOURCE);

    expect(meta.data).toEqual(GET_POSTS_DATA);
    expect(meta.transport).toBe('apq-register-post');
    expect(keysOf(meta.headers)).toBe(GET_POSTS_KEYS);
    expect(keysOf(outcomes[0]?.result.headers)).toBe(GET_POSTS_KEYS);
    expect(outcomes[0]?.result.transport).toBe('apq-register-post');
  });

  test('APQ miss, register POST fails: falls back to the client POST and surfaces its headers', async () => {
    const { calls, execute } = setup((call, index) => {
      if (call.init?.method === 'GET') return jsonResponse(NOT_FOUND);
      // 1st POST = register attempt (HTTP 500); 2nd POST = client fallback.
      return index === 1
        ? jsonResponse({}, { status: 500 })
        : jsonResponse(
            { data: GET_POSTS_DATA },
            { headers: { 'X-GraphQL-Keys': GET_POSTS_KEYS } }
          );
    });

    const meta = await execute.withMeta(GetPosts);

    expect(calls.map((c) => c.init?.method)).toEqual(['GET', 'POST', 'POST']);
    expect(meta.data).toEqual(GET_POSTS_DATA);
    expect(meta.transport).toBe('post');
    expect(keysOf(meta.headers)).toBe(GET_POSTS_KEYS);
  });

  test('APQ miss with no persisted-documents entry: client POST headers', async () => {
    const { calls, execute } = setup(
      (call) =>
        call.init?.method === 'GET'
          ? jsonResponse(NOT_FOUND)
          : jsonResponse(
              { data: GET_POSTS_DATA },
              { headers: { 'X-GraphQL-Keys': GET_POSTS_KEYS } }
            ),
      { persistedDocuments: {} }
    );

    const meta = await execute.withMeta(GetPosts);
    expect(calls.map((c) => c.init?.method)).toEqual(['GET', 'POST']);
    expect(meta.transport).toBe('post');
    expect(keysOf(meta.headers)).toBe(GET_POSTS_KEYS);
  });

  test('GET with GraphQL errors falls back to POST and surfaces the POST headers', async () => {
    const { execute } = setup(
      (call) =>
        call.init?.method === 'GET'
          ? jsonResponse(
              { errors: [{ message: 'Internal server error' }] },
              { headers: { 'X-GraphQL-Keys': 'from-get' } }
            )
          : jsonResponse(
              { data: GET_POSTS_DATA },
              { headers: { 'X-GraphQL-Keys': GET_POSTS_KEYS } }
            ),
      { errorPolicy: 'all' }
    );

    const meta = await execute.withMeta(GetPosts);
    expect(meta.transport).toBe('post');
    expect(keysOf(meta.headers)).toBe(GET_POSTS_KEYS);
  });

  test('GET transport failure (non-2xx) falls back to POST and surfaces the POST headers', async () => {
    const { execute } = setup((call) =>
      call.init?.method === 'GET'
        ? jsonResponse({}, { status: 503 })
        : jsonResponse(
            { data: GET_POSTS_DATA },
            { headers: { 'X-GraphQL-Keys': GET_POSTS_KEYS } }
          )
    );

    const meta = await execute.withMeta(GetPosts);
    expect(meta.transport).toBe('post');
    expect(keysOf(meta.headers)).toBe(GET_POSTS_KEYS);
  });

  test('mutations always POST via the client and surface its headers', async () => {
    const { calls, execute } = setup(() =>
      jsonResponse(
        { data: { updatePost: { post: { id: 'cG9zdDox' } } } },
        { headers: { 'X-GraphQL-Keys': 'graphql:Mutation UpdatePost' } }
      )
    );
    const UpdatePost = documentWithHash<
      { updatePost: { post: { id: string } } },
      { id: string }
    >(UPDATE_POST_SOURCE, 'b'.repeat(64));

    const meta = await execute.withMeta(UpdatePost, { id: 'cG9zdDox' });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.init?.method).toBe('POST');
    expect(meta.transport).toBe('post');
    expect(keysOf(meta.headers)).toBe('graphql:Mutation UpdatePost');
  });

  test('unhashed queries POST via the client and surface its headers', async () => {
    const { calls, execute } = setup(() =>
      jsonResponse(
        { data: GET_POSTS_DATA },
        { headers: { 'X-GraphQL-Keys': GET_POSTS_KEYS } }
      )
    );
    const Unhashed = documentWithHash<typeof GET_POSTS_DATA>(GET_POSTS_SOURCE);

    const meta = await execute.withMeta(Unhashed);
    expect(calls[0]?.init?.method).toBe('POST');
    expect(meta.transport).toBe('post');
    expect(keysOf(meta.headers)).toBe(GET_POSTS_KEYS);
  });

  test('edgeCache still rides the GET URL', async () => {
    const { calls, execute } = setup(() =>
      jsonResponse({ data: GET_POSTS_DATA })
    );
    await execute.withMeta(GetPosts, undefined, { edgeCache: 300 });
    expect(calls[0]?.url).toContain('edgeCache=300');
  });

  test('a thrown ClientError still hands onResponse the response headers', async () => {
    const { execute, outcomes } = setup((call) =>
      call.init?.method === 'GET'
        ? jsonResponse(
            { errors: [{ message: 'Cannot query field "nope"' }] },
            { headers: { 'X-GraphQL-Keys': 'from-get' } }
          )
        : jsonResponse(
            { errors: [{ message: 'Cannot query field "nope"' }] },
            { headers: { 'X-GraphQL-Keys': GET_POSTS_KEYS } }
          )
    );

    const error = await execute.withMeta(GetPosts).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('Cannot query field');

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.result.error).toBeDefined();
    expect(outcomes[0]?.result.data).toBeUndefined();
    expect(keysOf(outcomes[0]?.result.headers)).toBe(GET_POSTS_KEYS);
  });

  test('a network failure before any response leaves headers undefined', async () => {
    const { execute, outcomes } = setup((call) => {
      if (call.init?.method === 'GET') return jsonResponse({}, { status: 502 });
      throw new TypeError('fetch failed');
    });

    const error = await execute.withMeta(GetPosts).catch((e: unknown) => e);
    expect((error as Error).message).toBe('fetch failed');
    expect(outcomes[0]?.result.headers).toBeUndefined();
    expect(outcomes[0]?.result.transport).toBeUndefined();
  });
});

describe('createPassthroughExecutor', () => {
  test('POSTs via the client; withMeta surfaces headers, plain call returns data', async () => {
    const mock = createFetchMock(() =>
      jsonResponse(
        { data: GET_POSTS_DATA },
        { headers: { 'X-GraphQL-Keys': GET_POSTS_KEYS } }
      )
    );
    const client = createGraphqlClient({
      endpoint: ENDPOINT,
      options: { fetch: mock.fetch }
    });
    const execute = createPassthroughExecutor(client);

    expect(await execute(GetPosts)).toEqual(GET_POSTS_DATA);

    const meta = await execute.withMeta(GetPosts, undefined, {
      edgeCache: 60
    });
    expect(meta.data).toEqual(GET_POSTS_DATA);
    expect(meta.transport).toBe('post');
    expect(keysOf(meta.headers)).toBe(GET_POSTS_KEYS);
    expect(mock.calls.every((c) => c.init?.method === 'POST')).toBe(true);
    // Passthrough ignores edgeCache — no URL param on a POST.
    expect(mock.calls[1]?.url).not.toContain('edgeCache');
  });
});
