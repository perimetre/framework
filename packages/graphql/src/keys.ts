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
 * - the operation name (only for named operations): bare, or `operation:<Name>`
 *   since WPGraphQL 2.x.
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
    } else if (token.startsWith('operation:')) {
      // WPGraphQL 2.x prefixes the operation name; no purge ever names it.
      keys.operation ??= token.slice('operation:'.length);
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

/**
 * A WPGraphQL Relay global id, decoded: `cG9zdDo0Mg==` → `{ kind: 'post', id:
 * '42' }`. `null` for anything that isn't one (a `list:` / `skipped:` key, a
 * query id, a raw id a filter rewrote).
 *
 * The kind is the node's loader, not its post type: every post of every type
 * is `post:<id>`, every term `term:<id>`. Only type-level nodes name a type —
 * `post_type:<name>`, `taxonomy:<name>`.
 */
export const decodeRelayId = (
  key: string
): { id: string; kind: string } | null => {
  if (!isRelayGlobalId(key)) return null;
  const decoded = /^([a-z_]+):(.+)$/s.exec(atob(key));
  return decoded?.[1] && decoded[2]
    ? { id: decoded[2], kind: decoded[1] }
    : null;
};

/**
 * Whether an `X-GraphQL-Keys` header names any node: a Relay id or a
 * `skipped:<kind>` marker, not only the query id, root, operation and lists.
 *
 * It doesn't when WPGraphQL Smart Cache's "Use Object Cache" answered the
 * query from its object cache: the resolvers didn't run, so the analyzer saw
 * no node.
 */
export const hasGraphqlNodeKeys = (
  headers: Headers | null | string | undefined
): boolean => {
  const { nodeIds, skipped } = parseGraphqlKeys(headers);
  return nodeIds.length > 0 || skipped.length > 0;
};

/**
 * The keys of a read whose responses named no node: "may depend on any post
 * or term".
 *
 * Smart Cache's object cache ("Use Object Cache") answers a repeated query
 * WITHOUT running the resolvers, and its `X-GraphQL-Keys` then lists no node
 * id. `withLastGood` lends such a hit the keys of the last response that did
 * run, but at `next build` and on a cold store there is none — and an entry
 * tagged with nothing misses every change to what it embeds. Smart Cache
 * purges `skipped:post` / `skipped:term` on every post and term change, so an
 * entry tagged with these goes stale on the next save, and since Smart Cache
 * purged its own copy of the response by the node that changed, the refill
 * runs the resolvers and comes back with real keys: self-healing.
 *
 * **Entries only** (a page, a product). A listing, a menu, global settings
 * resolve one node per item and would collapse into `skipped:post` anyway,
 * which every post save purges — tag those with what they list (`type-*`,
 * `index-*`, `menu-*`), not with node keys.
 */
export const GRAPHQL_UNKNOWN_DEPENDENCIES: readonly string[] = Object.freeze([
  'skipped:post',
  'skipped:term'
]);

/** Options for {@link collapseGraphqlKeys} and {@link entryGraphqlKeys}. */
export type CollapseGraphqlKeysOptions = {
  /**
   * Post types and taxonomies the frontend doesn't render: their type-level
   * nodes (`post_type:<name>`, `taxonomy:<name>`) and `skipped:<name>` markers
   * are dropped. Individual posts and terms are `post:<id>` / `term:<id>`
   * whatever their type, so they can't be filtered here — the webhook side
   * (`createInvalidation` in `@perimetre/graphql/wp-cache`) ignores the purge
   * keys of a type the site doesn't render instead.
   */
  ignoreTypes?: readonly string[];
  /** Called when the keys overflowed `max` and were collapsed (for a log). */
  onCollapse?: (info: { keys: number; max: number }) => void;
};

/**
 * The cache keys of one read, from the `X-GraphQL-Keys` of each of its
 * responses: the node ids (Relay ids, raw ids) and `skipped:<kind>` markers,
 * deduplicated. The query id, root, operation and `list:<type>` keys are
 * dropped: WPGraphQL emits `list:<type>` for every connection a document
 * reads (a product page reading its related products carries `list:product`),
 * so the first new product would expire every entry. List membership belongs
 * to hand tags (`type-*`, `index-*`), which the webhook maps purged `list:*`
 * keys back onto.
 *
 * At most `max` keys. Past it, the analyzer's own overflow rule: the first
 * ids are kept and each kind of the dropped ones becomes `skipped:<kind>`,
 * which Smart Cache purges on any change of that kind — a collapsed read is
 * flushed more often, never less. Tokens that aren't Relay ids have no coarser
 * key and are always kept, as is one marker per kind, so a `max` below the
 * number of kinds a read resolved (WPGraphQL has a handful) can be exceeded.
 *
 * **Choosing `max`.** Vercel keeps at most 128 tags per Runtime Cache item AND
 * per cached route response, and a route carries the union of every scope it
 * renders: the entry's keys plus its hand tags, the layout's menus and
 * settings, Next's implicit tags (≈ 5). stelpro budgets 96 for an entry read
 * (its heaviest PDP resolves 67 nodes, ≈ 115 tags on the route). Keep it above
 * what an entry resolves: `skipped:post` is purged by every post save, so a
 * budget too small makes every save re-render every entry.
 * @example
 * ```ts
 * const { data, headers } = await cmsQuery.withMeta(PageByIdDocument, { id });
 * cacheTag(...entryGraphqlKeys([headers], 96));
 * ```
 */
export const collapseGraphqlKeys = (
  headers: readonly (Headers | null | string | undefined)[],
  max: number,
  { ignoreTypes = [], onCollapse }: CollapseGraphqlKeysOptions = {}
): string[] => {
  const ignored = new Set(ignoreTypes);
  const nodes = new Set<string>();
  const skipped = new Set<string>();

  for (const header of headers) {
    const parsed = parseGraphqlKeys(header);
    for (const key of parsed.nodeIds) {
      const relay = decodeRelayId(key);
      if (
        relay &&
        (relay.kind === 'post_type' || relay.kind === 'taxonomy') &&
        ignored.has(relay.id)
      ) {
        continue;
      }
      nodes.add(key);
    }
    for (const key of parsed.skipped) {
      if (!ignored.has(key.slice('skipped:'.length))) skipped.add(key);
    }
  }

  const ids = [...nodes];
  if (ids.length + skipped.size <= max) return [...ids, ...skipped];

  onCollapse?.({ keys: ids.length + skipped.size, max });

  const fixed = ids.filter((key) => decodeRelayId(key) === null);
  const relay = ids.flatMap((key) => {
    const decoded = decodeRelayId(key);
    return decoded ? [{ key, kind: decoded.kind }] : [];
  });

  for (let kept = Math.max(0, max - fixed.length - skipped.size); ; kept--) {
    const markers = new Set(skipped);
    for (const { kind } of relay.slice(kept)) markers.add(`skipped:${kind}`);
    if (kept === 0 || fixed.length + kept + markers.size <= max) {
      return [
        ...fixed,
        ...relay.slice(0, kept).map(({ key }) => key),
        ...markers
      ];
    }
  }
};

/**
 * The keys an ENTRY read tags its cached scope with: its
 * {@link collapseGraphqlKeys}, or {@link GRAPHQL_UNKNOWN_DEPENDENCIES} when
 * its responses named no node (a Smart Cache object-cache hit with no stored
 * keys to borrow). Not for listings, menus or settings — see
 * `GRAPHQL_UNKNOWN_DEPENDENCIES`.
 */
export const entryGraphqlKeys = (
  headers: readonly (Headers | null | string | undefined)[],
  max: number,
  options?: CollapseGraphqlKeysOptions
): string[] => {
  const keys = collapseGraphqlKeys(headers, max, options);
  return keys.length > 0 ? keys : [...GRAPHQL_UNKNOWN_DEPENDENCIES];
};
