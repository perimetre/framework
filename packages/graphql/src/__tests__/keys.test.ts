import { describe, expect, test } from 'bun:test';
import {
  collapseGraphqlKeys,
  decodeRelayId,
  entryGraphqlKeys,
  GRAPHQL_KEYS_HEADER,
  GRAPHQL_UNKNOWN_DEPENDENCIES,
  hasGraphqlNodeKeys,
  parseGraphqlKeys
} from '../keys.js';

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

describe('parseGraphqlKeys — WPGraphQL 2.x', () => {
  test('reads the operation:<Name> token as the operation, not a node id', () => {
    const keys = parseGraphqlKeys(
      `${HASH} graphql:Query operation:PageById list:page ${POST_1}`
    );
    expect(keys.operation).toBe('PageById');
    expect(keys.nodeIds).toEqual([POST_1]);
  });
});

/** The Relay id WPGraphQL gives a node (`post:42` → `cG9zdDo0Mg==`). */
const relay = (kind: string, id: number | string) =>
  btoa(`${kind}:${String(id)}`);

describe('decodeRelayId', () => {
  test('decodes Relay ids, and nothing else', () => {
    expect(decodeRelayId(POST_42)).toEqual({ id: '42', kind: 'post' });
    expect(decodeRelayId(PAGE_TYPE)).toEqual({ id: 'page', kind: 'post_type' });
    expect(decodeRelayId('list:post')).toBeNull();
    expect(decodeRelayId('GetPosts')).toBeNull();
    expect(decodeRelayId('42')).toBeNull();
  });
});

describe('hasGraphqlNodeKeys', () => {
  test('a node id or a skipped marker counts; the query id, root, operation and lists do not', () => {
    expect(hasGraphqlNodeKeys(`${HASH} graphql:Query GetPosts ${POST_1}`)).toBe(
      true
    );
    expect(hasGraphqlNodeKeys(`${HASH} graphql:Query skipped:post`)).toBe(true);
    expect(
      hasGraphqlNodeKeys(`${HASH} graphql:Query operation:PageById list:page`)
    ).toBe(false);
    expect(hasGraphqlNodeKeys(null)).toBe(false);
  });
});

describe('collapseGraphqlKeys', () => {
  test('keeps node ids, drops the query id, root, list and operation keys', () => {
    const header = [
      HASH,
      'graphql:Query',
      'operation:PageById',
      'list:page',
      relay('post', 30),
      relay('term', 7)
    ].join(' ');

    expect(collapseGraphqlKeys([header], 96)).toEqual([
      relay('post', 30),
      relay('term', 7)
    ]);
  });

  test('deduplicates across the responses of one read', () => {
    expect(
      collapseGraphqlKeys(
        [relay('post', 1), `${relay('post', 1)} ${relay('post', 2)}`],
        96
      )
    ).toEqual([relay('post', 1), relay('post', 2)]);
  });

  test('a missing header is no keys', () => {
    expect(
      collapseGraphqlKeys([null, undefined, '', new Headers()], 96)
    ).toEqual([]);
  });

  test('keeps the analyzer’s own skipped markers', () => {
    expect(
      collapseGraphqlKeys([`${relay('post', 1)} skipped:post`], 96)
    ).toEqual([relay('post', 1), 'skipped:post']);
  });

  test('past the budget, the overflow collapses into skipped:<kind>, and nothing is left unreachable', () => {
    const ids = Array.from({ length: 10 }, (_, i) => relay('post', i + 1));
    const all = [...ids, relay('term', 3)];
    const collapsed: { keys: number; max: number }[] = [];
    const keys = collapseGraphqlKeys([all.join(' ')], 5, {
      /** Records the collapse. */
      onCollapse: (info) => collapsed.push(info)
    });

    expect(keys.length).toBeLessThanOrEqual(5);
    expect(keys).toContain('skipped:post');
    expect(collapsed).toEqual([{ keys: 11, max: 5 }]);
    for (const id of all) {
      const kind = atob(id).split(':')[0] ?? '';
      expect(keys.includes(id) || keys.includes(`skipped:${kind}`)).toBe(true);
    }
  });

  // A budget below the number of node kinds can't hold one marker per kind;
  // any real budget (stelpro: 96) is far above WPGraphQL's handful of kinds.
  test('never more than max (at least one marker per kind), whatever the response resolved', () => {
    const kinds = ['post', 'term', 'user', 'comment', 'nav_menu_item'];
    const header = Array.from({ length: 300 }, (_, i) =>
      relay(kinds[i % kinds.length] ?? 'post', i)
    ).join(' ');
    for (const max of [5, 6, 20, 96]) {
      expect(collapseGraphqlKeys([header], max).length).toBeLessThanOrEqual(
        max
      );
    }
  });

  test('a token that is not a Relay id has no coarser key: it is kept', () => {
    const header = [
      '42',
      ...Array.from({ length: 6 }, (_, i) => relay('post', i))
    ];
    const keys = collapseGraphqlKeys([header.join(' ')], 3);
    expect(keys).toContain('42');
    expect(keys).toContain('skipped:post');
  });

  test('ignoreTypes drops the type-level nodes and markers of types the site does not render', () => {
    const header = [
      relay('post', 1),
      relay('post_type', 'graphql_document'),
      relay('post_type', 'page'),
      relay('taxonomy', 'graphql_document_group'),
      'skipped:graphql_document'
    ].join(' ');

    expect(
      collapseGraphqlKeys([header], 96, {
        ignoreTypes: ['graphql_document', 'graphql_document_group']
      })
    ).toEqual([relay('post', 1), relay('post_type', 'page')]);
  });
});

describe('entryGraphqlKeys', () => {
  test('an entry whose response named no node may depend on anything', () => {
    // A Smart Cache object-cache hit: the query id and its list keys, no node.
    const hit = [HASH, 'graphql:Query', 'operation:PageById', 'list:page'].join(
      ' '
    );

    expect(entryGraphqlKeys([hit], 96)).toEqual([
      'skipped:post',
      'skipped:term'
    ]);
    expect(entryGraphqlKeys([null], 96)).toEqual([
      ...GRAPHQL_UNKNOWN_DEPENDENCIES
    ]);
    expect(entryGraphqlKeys([relay('post', 30)], 96)).toEqual([
      relay('post', 30)
    ]);
  });
});
