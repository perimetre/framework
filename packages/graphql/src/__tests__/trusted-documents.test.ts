import { describe, expect, test } from 'bun:test';
import { ClientError } from 'graphql-request';
import {
  errorResponseMeta,
  type GraphqlRequestContext,
  type GraphqlRequestPlugin,
  type GraphqlResponseOutcome,
  type PostFallback
} from '../apq.js';
import { createGraphqlClient } from '../client.js';
import {
  createTrustedDocumentExecutor,
  TrustedDocumentNotRegisteredError
} from '../trusted-documents.js';
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

/**
 * Wires a trusted-documents executor and a real `graphql-request` client to
 * the same scripted fetch, and records every `onResponse` outcome.
 */
const setup = (
  script: FetchScript,
  {
    errorPolicy,
    postFallback
  }: { errorPolicy?: 'all' | 'none'; postFallback?: PostFallback } = {}
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
    options: { errorPolicy, fetch: mock.fetch }
  });
  const execute = createTrustedDocumentExecutor({
    client,
    endpoint: ENDPOINT,
    fetch: mock.fetch,
    postFallback,
    requestPlugins: [observer]
  });
  return { calls: mock.calls, execute, outcomes };
};

const GetPosts = documentWithHash<typeof GET_POSTS_DATA>(
  GET_POSTS_SOURCE,
  GET_POSTS_HASH
);

describe('createTrustedDocumentExecutor', () => {
  test('GET hit: surfaces the GET headers on withMeta and onResponse', async () => {
    const { calls, execute, outcomes } = setup(() =>
      jsonResponse(
        { data: GET_POSTS_DATA },
        { headers: { 'X-GraphQL-Keys': GET_POSTS_KEYS } }
      )
    );

    expect(await execute(GetPosts)).toEqual(GET_POSTS_DATA);

    const meta = await execute.withMeta(GetPosts, undefined, {
      edgeCache: 120
    });
    expect(calls).toHaveLength(2);
    expect(calls[1]?.init?.method).toBe('GET');
    expect(calls[1]?.url).toContain(`queryId=${GET_POSTS_HASH}`);
    expect(calls[1]?.url).toContain('edgeCache=120');

    expect(meta.data).toEqual(GET_POSTS_DATA);
    expect(meta.transport).toBe('trusted-get');
    expect(keysOf(meta.headers)).toBe(GET_POSTS_KEYS);
    expect(outcomes[1]?.result.transport).toBe('trusted-get');
    expect(keysOf(outcomes[1]?.result.headers)).toBe(GET_POSTS_KEYS);
  });

  test('unregistered id throws and never POSTs; onResponse sees the error', async () => {
    const { calls, execute, outcomes } = setup(() =>
      jsonResponse({ errors: [{ message: 'PersistedQueryNotFound' }] })
    );

    const error = await execute.withMeta(GetPosts).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(TrustedDocumentNotRegisteredError);
    expect(calls).toHaveLength(1);
    expect(outcomes[0]?.result.error).toBeInstanceOf(
      TrustedDocumentNotRegisteredError
    );
    expect(outcomes[0]?.result.headers).toBeUndefined();
  });

  test('GET with GraphQL errors (a blocked document) rejects with the GET’s ClientError, without a POST', async () => {
    // What WPGraphQL Smart Cache answers in "Allow only specific queries" mode
    // for a document not marked allowed — measured against a local CMS.
    const { calls, execute, outcomes } = setup(() =>
      jsonResponse(
        { errors: [{ message: 'This query document has been blocked.' }] },
        { headers: { 'X-GraphQL-Keys': 'from-get' } }
      )
    );

    const error = await execute.withMeta(GetPosts).catch((e: unknown) => e);

    expect(calls.map((c) => c.init?.method)).toEqual(['GET']);
    expect(error).toBeInstanceOf(ClientError);
    expect((error as ClientError).response.errors?.[0]?.message).toBe(
      'This query document has been blocked.'
    );
    expect(errorResponseMeta(error).transport).toBe('trusted-get');
    expect(keysOf(outcomes[0]?.result.headers)).toBe('from-get');
  });

  test("GraphQL errors under errorPolicy 'all' answer the GET's data", async () => {
    const { calls, execute } = setup(
      () =>
        jsonResponse({
          data: GET_POSTS_DATA,
          errors: [{ message: 'partial' }]
        }),
      { errorPolicy: 'all' }
    );

    const meta = await execute.withMeta(GetPosts);
    expect(calls).toHaveLength(1);
    expect(meta.data).toEqual(GET_POSTS_DATA);
    expect(meta.transport).toBe('trusted-get');
  });

  for (const status of [403, 429, 500, 503, 504]) {
    test(`GET answering HTTP ${String(status)} rejects without a POST`, async () => {
      const { calls, execute } = setup(() =>
        jsonResponse({}, { headers: { 'X-GraphQL-Keys': 'from-get' }, status })
      );

      const error = await execute.withMeta(GetPosts).catch((e: unknown) => e);

      expect(calls.map((c) => c.init?.method)).toEqual(['GET']);
      expect((error as ClientError).response.status).toBe(status);
      expect(errorResponseMeta(error).transport).toBe('trusted-get');
    });
  }

  test('a throwing fetch rejects with the same error object, without a POST', async () => {
    const down = new TypeError('fetch failed');
    const { calls, execute } = setup(() => Promise.reject(down));

    expect(await execute.withMeta(GetPosts).catch((e: unknown) => e)).toBe(
      down
    );
    expect(calls).toHaveLength(1);
  });

  for (const status of [414, 405]) {
    test(`GET refused as a GET (HTTP ${String(status)}) is re-sent as a POST by id, with no document text`, async () => {
      const { calls, execute } = setup((call) =>
        call.init?.method === 'GET'
          ? new Response('<html>414 Request-URI Too Large</html>', { status })
          : jsonResponse(
              { data: GET_POSTS_DATA },
              { headers: { 'X-GraphQL-Keys': GET_POSTS_KEYS } }
            )
      );

      const meta = await execute.withMeta(GetPosts, undefined, {
        edgeCache: 60
      });

      expect(calls.map((c) => c.init?.method)).toEqual(['GET', 'POST']);
      expect(calls[1]?.url).toBe(ENDPOINT);
      expect(JSON.parse(calls[1]?.init?.body as string)).toEqual({
        operationName: 'GetPosts',
        queryId: GET_POSTS_HASH,
        variables: {}
      });
      expect(meta.data).toEqual(GET_POSTS_DATA);
      expect(meta.transport).toBe('trusted-post');
      expect(keysOf(meta.headers)).toBe(GET_POSTS_KEYS);
    });
  }

  test('a POST by id for an unregistered id still throws TrustedDocumentNotRegisteredError', async () => {
    const { calls, execute } = setup((call) =>
      call.init?.method === 'GET'
        ? jsonResponse({}, { status: 414 })
        : jsonResponse({ errors: [{ message: 'PersistedQueryNotFound' }] })
    );

    expect(
      await execute.withMeta(GetPosts).catch((e: unknown) => e)
    ).toBeInstanceOf(TrustedDocumentNotRegisteredError);
    expect(calls).toHaveLength(2);
  });

  test('a failing POST by id rejects with its own ClientError, without a third request', async () => {
    const { calls, execute } = setup((call) =>
      call.init?.method === 'GET'
        ? jsonResponse({}, { status: 414 })
        : jsonResponse({}, { status: 503 })
    );

    const error = await execute.withMeta(GetPosts).catch((e: unknown) => e);

    expect(calls).toHaveLength(2);
    expect((error as ClientError).response.status).toBe(503);
    expect(errorResponseMeta(error).transport).toBe('trusted-post');
  });

  test("postFallback 'any' restores the client POST on any GET failure", async () => {
    const scripts: FetchScript[] = [
      (call) =>
        call.init?.method === 'GET'
          ? jsonResponse({}, { status: 504 })
          : jsonResponse({ data: GET_POSTS_DATA }),
      (call) =>
        call.init?.method === 'GET'
          ? jsonResponse({ errors: [{ message: 'partial' }] })
          : jsonResponse({ data: GET_POSTS_DATA })
    ];

    for (const script of scripts) {
      const { calls, execute } = setup(script, { postFallback: 'any' });
      const meta = await execute.withMeta(GetPosts);
      expect(calls.map((c) => c.init?.method)).toEqual(['GET', 'POST']);
      expect(meta.transport).toBe('post');
    }
  });

  test("a caller abort never falls back, even under postFallback 'any'", async () => {
    const controller = new AbortController();
    const { calls, execute } = setup(
      () => {
        controller.abort();
        return Promise.reject(
          new DOMException('The operation was aborted.', 'AbortError')
        );
      },
      { postFallback: 'any' }
    );

    const error = await execute
      .withMeta(GetPosts, undefined, { signal: controller.signal })
      .catch((e: unknown) => e);

    expect((error as Error).name).toBe('AbortError');
    expect(calls).toHaveLength(1);
    expect(calls[0]?.init?.signal).toBe(controller.signal);
  });

  test('mutations POST via the client and surface its headers', async () => {
    const { calls, execute } = setup(() =>
      jsonResponse(
        { data: { updatePost: { post: { id: 'cG9zdDox' } } } },
        { headers: { 'X-GraphQL-Keys': 'graphql:Mutation UpdatePost' } }
      )
    );
    const UpdatePost = documentWithHash<
      { updatePost: { post: { id: string } } },
      { id: string }
    >(UPDATE_POST_SOURCE, 'c'.repeat(64));

    const meta = await execute.withMeta(UpdatePost, { id: 'cG9zdDox' });
    expect(calls[0]?.init?.method).toBe('POST');
    expect(meta.transport).toBe('post');
    expect(keysOf(meta.headers)).toBe('graphql:Mutation UpdatePost');
  });
});
