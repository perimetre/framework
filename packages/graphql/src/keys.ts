/**
 * # `X-GraphQL-Keys`
 *
 * WPGraphQL's Query Analyzer emits an `X-GraphQL-Keys` response header listing
 * everything a response resolved, and WPGraphQL Smart Cache purges its own
 * cache by exactly those keys (`graphql_purge` per key). The header is a
 * single space-separated string, in this order:
 *
 * ```text
 * <queryId> graphql:<RootType> <OperationName> list:<type>… <relayId>… skipped:<type>…
 * ```
 *
 * - `queryId` — sha256 of the normalized document (the same id APQ / Trusted
 *   Documents GET by), or `gql:<uniqid>` when the server could not hash it.
 * - `graphql:Query` — the root operation type.
 * - the operation name, bare (only for named operations).
 * - `list:<type>` — one per type queried as a list (lower-cased type name).
 * - Relay global ids — `base64("<type>:<id>")`, e.g. `cG9zdDo0Mg==` = `post:42`,
 *   one per node that was resolved.
 * - `skipped:<type>` — appended when the header overflowed WPGraphQL's limit
 *   (`graphql_query_analyzer_header_length_limit`, default 4000 chars): ids of
 *   that type were truncated, so a cache keyed on ids alone is incomplete.
 *
 * The header is only sent when the Query Analyzer is enabled (or WPGraphQL
 * debug is on) — check with `curl -I` against a persisted GET.
 *
 * `parseGraphqlKeys` turns that string into buckets a Next.js reader can hand
 * to `cacheTag`. It is pure and dependency-free.
 */

/** Lower-cased name of the response header WPGraphQL's Query Analyzer emits. */
export const GRAPHQL_KEYS_HEADER = 'x-graphql-keys';

/** The parsed buckets of an `X-GraphQL-Keys` header. */
export type GraphqlKeys = {
  /**
   * `list:<type>` keys, kept in wire form (e.g. `'list:post'`) because that is
   * the key Smart Cache purges on create/delete of that type — tag with it
   * as-is.
   */
  lists: string[];
  /**
   * Relay global ids of every node the response resolved (`cG9zdDo0Mg==`).
   * Smart Cache purges these on update of the node — tag with them as-is.
   */
  nodeIds: string[];
  /** The operation name, when the operation was named. */
  operation?: string;
  /** The server's query id (sha256 hex, or `gql:<uniqid>`). */
  queryId?: string;
  /** The root operation type from `graphql:<RootType>`, e.g. `'Query'`. */
  root?: string;
  /**
   * `skipped:<type>` markers, in wire form (e.g. `'skipped:post'`). Present
   * only when the header overflowed and ids of that type were dropped — a
   * reader should fall back to a broader tag for those types.
   */
  skipped: string[];
};

const SHA256_RE = /^[a-f0-9]{64}$/i;
const GRAPHQL_NAME_RE = /^[_A-Za-z][_0-9A-Za-z]*$/;
const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;
/** What a decoded Relay global id looks like: `<type>:<id>`. */
const RELAY_PAYLOAD_RE = /^[A-Za-z0-9_-]+:.+$/s;

/**
 * Whether a bare token is a WPGraphQL Relay global id: padded base64 that
 * decodes to `<type>:<id>`. Decoding is what disambiguates an id from a bare
 * operation name — `cG9zdDox` is also a valid GraphQL name, but `GetPosts`
 * does not decode to anything with a colon in it.
 */
const isRelayGlobalId = (token: string): boolean => {
  if (token.length % 4 !== 0 || !BASE64_RE.test(token)) return false;
  try {
    return RELAY_PAYLOAD_RE.test(atob(token));
  } catch {
    return false;
  }
};

/**
 * Parses WPGraphQL's `X-GraphQL-Keys` response header into `nodeIds`,
 * `lists`, `skipped`, plus the `operation`, `queryId` and `root` it carries.
 * Accepts the `Headers` of a response (e.g. from
 * `executeGraphqlRequest.withMeta()`), or the raw header string. A missing /
 * empty header yields empty buckets — never throws.
 *
 * Unknown bare tokens (e.g. an id a `graphql_query_analyzer_runtime_node`
 * filter rewrote into a non-base64 form) land in `nodeIds`: an extra cache
 * tag is harmless, a dropped dependency is not.
 * @example Tag a `'use cache: remote'` read with what the CMS says it resolved
 * ```ts
 * const { data, headers } = await executeGraphqlRequest.withMeta(GetPageDocument, { uri });
 * const { nodeIds, lists, skipped } = parseGraphqlKeys(headers);
 * cacheTag('cms', ...nodeIds, ...lists, ...skipped);
 * ```
 */
export const parseGraphqlKeys = (
  headers: Headers | null | string | undefined
): GraphqlKeys => {
  const raw =
    typeof headers === 'string'
      ? headers
      : (headers?.get(GRAPHQL_KEYS_HEADER) ?? '');

  const keys: GraphqlKeys = { lists: [], nodeIds: [], skipped: [] };
  const seen = new Set<string>();

  for (const token of raw.split(/\s+/)) {
    if (!token || seen.has(token)) continue;
    seen.add(token);

    if (
      keys.queryId === undefined &&
      (SHA256_RE.test(token) || token.startsWith('gql:'))
    ) {
      keys.queryId = token;
    } else if (token.startsWith('graphql:')) {
      keys.root = token.slice('graphql:'.length);
    } else if (token.startsWith('list:')) {
      keys.lists.push(token);
    } else if (token.startsWith('skipped:')) {
      keys.skipped.push(token);
    } else if (isRelayGlobalId(token)) {
      keys.nodeIds.push(token);
    } else if (keys.operation === undefined && GRAPHQL_NAME_RE.test(token)) {
      keys.operation = token;
    } else {
      keys.nodeIds.push(token);
    }
  }

  return keys;
};
