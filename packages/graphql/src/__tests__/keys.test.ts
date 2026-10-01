import { describe, expect, test } from 'bun:test';
import { GRAPHQL_KEYS_HEADER, parseGraphqlKeys } from '../keys.js';

const HASH = '3f2a'.repeat(16);
const POST_1 = btoa('post:1'); // cG9zdDox
const POST_42 = btoa('post:42'); // cG9zdDo0Mg==
const TERM_7 = btoa('term:7');
const PAGE_TYPE = btoa('post_type:page');

describe('parseGraphqlKeys', () => {
  test('splits a typical header into its buckets', () => {
    const header = `${HASH} graphql:Query GetPosts list:post list:category ${POST_1} ${POST_42} ${TERM_7}`;
    expect(parseGraphqlKeys(header)).toEqual({
      lists: ['list:post', 'list:category'],
      nodeIds: [POST_1, POST_42, TERM_7],
      operation: 'GetPosts',
      queryId: HASH,
      root: 'Query',
      skipped: []
    });
  });

  test('reads the header off a Headers object (case-insensitive)', () => {
    const headers = new Headers({
      'X-GraphQL-Keys': `${HASH} graphql:Query GetPage ${PAGE_TYPE}`
    });
    expect(headers.get(GRAPHQL_KEYS_HEADER)).not.toBeNull();
    const keys = parseGraphqlKeys(headers);
    expect(keys.operation).toBe('GetPage');
    expect(keys.nodeIds).toEqual([PAGE_TYPE]);
  });

  test('collects skipped:<type> markers from an overflowed header', () => {
    const keys = parseGraphqlKeys(
      `${HASH} graphql:Query Big list:post ${POST_1} skipped:post skipped:term`
    );
    expect(keys.skipped).toEqual(['skipped:post', 'skipped:term']);
    expect(keys.nodeIds).toEqual([POST_1]);
  });

  test('handles an unnamed operation (no bare name token)', () => {
    const keys = parseGraphqlKeys(`${HASH} graphql:Query list:post ${POST_1}`);
    expect(keys.operation).toBeUndefined();
    expect(keys.nodeIds).toEqual([POST_1]);
    expect(keys.lists).toEqual(['list:post']);
  });

  test('accepts the gql:<uniqid> fallback query id', () => {
    const keys = parseGraphqlKeys(
      `gql:65f1a2b3c4d5e.12345678 graphql:Query GetPosts ${POST_1}`
    );
    expect(keys.queryId).toBe('gql:65f1a2b3c4d5e.12345678');
    expect(keys.operation).toBe('GetPosts');
  });

  test('does not mistake an operation name for a node id, or vice versa', () => {
    // "GetPosts" is 8 chars of base64 alphabet but decodes to garbage; the
    // Relay id below is also a valid GraphQL name but decodes to `post:1`.
    const keys = parseGraphqlKeys(`graphql:Query GetPosts ${POST_1}`);
    expect(keys.operation).toBe('GetPosts');
    expect(keys.nodeIds).toEqual([POST_1]);
  });

  test('keeps unknown bare tokens as node ids rather than dropping them', () => {
    // e.g. a `graphql_query_analyzer_runtime_node` filter that emits raw ids.
    const keys = parseGraphqlKeys(`${HASH} graphql:Query GetPosts 42 7`);
    expect(keys.nodeIds).toEqual(['42', '7']);
  });

  test('dedupes repeated tokens and tolerates odd whitespace', () => {
    const keys = parseGraphqlKeys(
      `  ${HASH}\tgraphql:Query  GetPosts list:post list:post ${POST_1} ${POST_1}  `
    );
    expect(keys.lists).toEqual(['list:post']);
    expect(keys.nodeIds).toEqual([POST_1]);
  });

  test('returns empty buckets for a missing or empty header', () => {
    const empty = { lists: [], nodeIds: [], skipped: [] };
    expect(parseGraphqlKeys(undefined)).toEqual(empty);
    expect(parseGraphqlKeys(null)).toEqual(empty);
    expect(parseGraphqlKeys('')).toEqual(empty);
    expect(parseGraphqlKeys(new Headers())).toEqual(empty);
  });

  test('reports the root type for non-query operations', () => {
    expect(parseGraphqlKeys('graphql:Mutation UpdatePost').root).toBe(
      'Mutation'
    );
  });
});
