import { describe, expect, test } from 'bun:test';
import type {
  GraphqlRequestContext,
  GraphqlRequestPlugin,
  GraphqlResponseOutcome
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
const setup = (script: FetchScript) => {
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
    options: { fetch: mock.fetch }
  });
  const execute = createTrustedDocumentExecutor({
    client,
    endpoint: ENDPOINT,
    fetch: mock.fetch,
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

  test('GET with GraphQL errors falls back to POST and surfaces the POST headers', async () => {
    const { calls, execute } = setup((call) =>
      call.init?.method === 'GET'
        ? jsonResponse(
            { data: GET_POSTS_DATA, errors: [{ message: 'partial' }] },
            { headers: { 'X-GraphQL-Keys': 'from-get' } }
          )
        : jsonResponse(
            { data: GET_POSTS_DATA },
            { headers: { 'X-GraphQL-Keys': GET_POSTS_KEYS } }
          )
    );

    const meta = await execute.withMeta(GetPosts);
    expect(calls.map((c) => c.init?.method)).toEqual(['GET', 'POST']);
    expect(meta.transport).toBe('post');
    expect(keysOf(meta.headers)).toBe(GET_POSTS_KEYS);
  });

  test('GET transport failure falls back to POST and surfaces the POST headers', async () => {
    const { execute } = setup((call) =>
      call.init?.method === 'GET'
        ? jsonResponse({}, { status: 504 })
        : jsonResponse(
            { data: GET_POSTS_DATA },
            { headers: { 'X-GraphQL-Keys': GET_POSTS_KEYS } }
          )
    );

    const meta = await execute.withMeta(GetPosts);
    expect(meta.transport).toBe('post');
    expect(keysOf(meta.headers)).toBe(GET_POSTS_KEYS);
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
