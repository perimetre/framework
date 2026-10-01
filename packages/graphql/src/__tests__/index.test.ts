import { describe, expect, test } from 'bun:test';
import { createWpGraphql, parseGraphqlKeys } from '../index.js';
import {
  createFetchMock,
  documentWithHash,
  GET_POSTS_DATA,
  GET_POSTS_HASH,
  GET_POSTS_KEYS,
  GET_POSTS_SOURCE,
  jsonResponse,
  keysOf
} from './helpers.js';

const ENDPOINT = 'https://cms.example.test/graphql';
const GetPosts = documentWithHash<typeof GET_POSTS_DATA>(
  GET_POSTS_SOURCE,
  GET_POSTS_HASH
);

/** A fetch that answers every request with the same keyed GraphQL response. */
const okFetch = () =>
  createFetchMock(() =>
    jsonResponse(
      { data: GET_POSTS_DATA },
      { headers: { 'X-GraphQL-Keys': GET_POSTS_KEYS } }
    )
  );

describe('createWpGraphql', () => {
  test('APQ bundle: executeGraphqlRequest.withMeta surfaces headers from the GET', async () => {
    const mock = okFetch();
    const { executeGraphqlRequest } = createWpGraphql({
      apq: true,
      endpoint: ENDPOINT,
      fetch: mock.fetch,
      persistedDocuments: { [GET_POSTS_HASH]: GET_POSTS_SOURCE }
    });

    const { data, headers, transport } =
      await executeGraphqlRequest.withMeta(GetPosts);
    expect(data).toEqual(GET_POSTS_DATA);
    expect(transport).toBe('apq-get');
    expect(parseGraphqlKeys(headers)).toMatchObject({
      lists: ['list:post'],
      nodeIds: ['cG9zdDox'],
      operation: 'GetPosts'
    });
  });

  test('Trusted Documents bundle: withMeta surfaces headers from the GET', async () => {
    const mock = okFetch();
    const { executeGraphqlRequest } = createWpGraphql({
      endpoint: ENDPOINT,
      fetch: mock.fetch,
      trustedDocuments: true
    });

    const meta = await executeGraphqlRequest.withMeta(GetPosts);
    expect(meta.transport).toBe('trusted-get');
    expect(keysOf(meta.headers)).toBe(GET_POSTS_KEYS);
  });

  test('passthrough bundle (no transport opted in): withMeta surfaces POST headers', async () => {
    const mock = okFetch();
    const { executeGraphqlRequest } = createWpGraphql({
      endpoint: ENDPOINT,
      options: { fetch: mock.fetch }
    });

    const meta = await executeGraphqlRequest.withMeta(GetPosts);
    expect(mock.calls[0]?.init?.method).toBe('POST');
    expect(meta.transport).toBe('post');
    expect(keysOf(meta.headers)).toBe(GET_POSTS_KEYS);
  });

  test('graphqlOptions still resolves to data only', async () => {
    const mock = okFetch();
    const { graphqlOptions } = createWpGraphql({
      apq: true,
      endpoint: ENDPOINT,
      fetch: mock.fetch,
      persistedDocuments: { [GET_POSTS_HASH]: GET_POSTS_SOURCE }
    });

    const options = graphqlOptions(GetPosts);
    const data = await (
      options.queryFn as unknown as () => Promise<typeof GET_POSTS_DATA>
    )();
    expect(data).toEqual(GET_POSTS_DATA);
  });
});
