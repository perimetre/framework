import type { GraphqlLogger } from './utils.js';

/**
 * # CMS-coupled cache invalidation for headless WordPress
 *
 * Every cached read is tagged with the CMS things it depends on — an entry id,
 * a post type, a taxonomy, a term, a menu location, an options page — never
 * with a frontend path. Perimetre Core's webhook says what changed in the
 * CMS's own terms, and {@link createInvalidation} answers with the same tag
 * strings. A new listing or block needs no new webhook branch: it tags what it
 * reads, and every save of that thing reaches it.
 *
 * Next to these hand tags, entry reads carry WPGraphQL's own node keys
 * (`entryGraphqlKeys` in `@perimetre/graphql/keys`), and the webhook relays the
 * keys WPGraphQL Smart Cache purged (`purge_keys`), so a change to anything an
 * entry EMBEDS reaches it with no declared dependency.
 *
 * Framework-agnostic: this module computes tags; the caller flushes them
 * (`revalidateTag` in Next.js, a CDN purge, a KV delete).
 */

/**
 * The tag vocabulary: the ONLY place a CMS tag string is spelled. Shared by
 * the readers (`cacheTag(...)`) and the webhook. {@link WP_CACHE_TAGS} is the
 * Perimetre default; pass your own to {@link createInvalidation} to rename.
 */
export type WpCacheTags = {
  /** On every CMS read. Flushed (stale-while-revalidate) for any change the mapping doesn't model. */
  all: string;
  /** One entry, by post id: on its own read, and on reads that embed it by id. */
  entry: (id: WpPostId) => string;
  /** The URL → id index of a post type: static params, sitemap, routing. */
  index: (postType: string) => string;
  /** A menu, by location. WordPress names the menu, never the location: every location is flushed. */
  menu: (location: string) => string;
  /** An ACF options page (by `menu_slug`), or Yoast's settings (`seo`). */
  options: (group: string) => string;
  /** Everything that lists a taxonomy's terms (filter bars, sitemap slices). */
  taxonomy: (taxonomy: string) => string;
  /** One term, for anything scoped to that term alone: its archive listing. */
  term: (taxonomy: string, slug: string) => string;
  /** Every entry of a post type: whole-catalogue listings. A NEW entry reaches them through it. */
  type: (postType: string) => string;
};

/** A WordPress post id, as WordPress sends it (a number) or as a string. */
export type WpPostId = number | string;

/** The Perimetre tag vocabulary (identical in stelpro, oiq and cima). */
export const WP_CACHE_TAGS: WpCacheTags = {
  all: 'cms',
  /** `entry-<id>`. */
  entry: (id) => `entry-${String(id)}`,
  /** `index-<postType>`. */
  index: (postType) => `index-${postType}`,
  /** `menu-<location>`. */
  menu: (location) => `menu-${location}`,
  /** `options-<group>`. */
  options: (group) => `options-${group}`,
  /** `taxonomy-<taxonomy>`. */
  taxonomy: (taxonomy) => `taxonomy-${taxonomy}`,
  /** `term-<taxonomy>-<slug>`. */
  term: (taxonomy, slug) => `term-${taxonomy}-${slug}`,
  /** `type-<postType>`. */
  type: (postType) => `type-${postType}`
};

/** Options for {@link createInvalidation}. */
export type CreateInvalidationOptions = {
  /** What the site renders. */
  contentModel: WpContentModel;
  /**
   * Project events, by exact name (`'form.saved'`) or prefix (`'form.*'`).
   * Checked before the built-in events.
   */
  extraEvents?: Readonly<Record<string, WpExtraEvent>>;
  /** Logs unmodelled events, unrendered types and empty flushes (info). */
  logger?: GraphqlLogger;
  /**
   * Whether a `post.*` payload's dependents must be looked up by the caller
   * (`saved` in the result): e.g. a document whose embedders the CMS didn't
   * name, or a page whose translations / descendants Core didn't list.
   * Default: never.
   */
  lookUpDependents?: (payload: WpWebhookPayload) => boolean;
  /** The tag vocabulary. Default {@link WP_CACHE_TAGS}. */
  tags?: WpCacheTags;
};

/** What the site renders, by the names WordPress registers. */
export type WpContentModel = {
  /**
   * GraphQL single names that don't follow the default (the name without
   * underscores, lower-cased: `product_category` → `productcategory`), by
   * post type or taxonomy: `{ news: 'newsArticle' }`. Smart Cache's
   * `list:<name>` keys use the GraphQL single name.
   */
  graphqlSingleNames?: Readonly<Record<string, string>>;
  /** Extra `list:<name>` → hand tags mappings, merged over the derived ones. */
  listKeys?: Readonly<Record<string, readonly string[]>>;
  /** `register_nav_menus` locations the site renders. Every menu event flushes them all. */
  menuLocations?: readonly string[];
  /**
   * The site-settings ACF options page (`menu_slug`): what an
   * `options.saved` without `options_page` means. Saving it also flushes
   * Yoast's settings (`options-seo`): Yoast's own screens send no webhook, so
   * re-saving the settings page is the editor's way to push a Yoast change.
   */
  optionsPage?: string;
  /** Taxonomies the site lists or labels terms of. */
  taxonomies?: readonly string[];
  /**
   * Post types the site renders. A save of any OTHER type flushes only its
   * own `type-*` / `index-*` tags (a no-op when nothing carries them) and its
   * Smart Cache purge keys are ignored: they include `skipped:post`, which
   * would mark every keyless or collapsed read stale — and every first APQ
   * registration publishes a `graphql_document` post.
   */
  types: readonly string[];
};

/**
 * A project-specific event (`form.saved` from a Gravity Forms sync, …):
 * payload → tags, in the project's own vocabulary.
 */
export type WpExtraEvent = (
  payload: WpWebhookPayload,
  tags: WpCacheTags
) => WpFlush;

/** A project event's flush: its tags; `broad` sends them all stale. */
export type WpFlush = { broad?: boolean; tags: string[] };

/**
 * What one webhook flushes, split by profile:
 *
 * - `expire` — what the change names: the entry, the entries that embed it,
 *   its type, terms and index, menus, options, the node keys Smart Cache
 *   purged. Flush with an immediate expiry (`revalidateTag(tag, { expire: 0
 *   })`) so the editor's FIRST reload is fresh.
 * - `stale` — the catch-all, Smart Cache's `skipped:<kind>` markers, and every
 *   tag of a broad flush (an import, an event the mapping doesn't model).
 *   Flush stale-while-revalidate (`revalidateTag(tag, 'max')`): a site-wide
 *   flush serves one stale response per entry instead of a blocking CMS miss
 *   for every visitor.
 * - `saved` — an entry whose dependents the payload didn't name, for the
 *   caller to look up (see `CreateInvalidationOptions.lookUpDependents`).
 */
export type WpInvalidation = {
  event: string;
  expire: string[];
  saved?: WpSavedEntry;
  stale: string[];
};

/** An entry the webhook saved, for the caller to look up dependents of. */
export type WpSavedEntry = {
  id: WpPostId;
  language?: string;
  type: string;
};

/**
 * The Perimetre Core ≥ 2.4.0 Dispatcher body (its README → Webhooks), read
 * loosely: only `event` is required; any other field that is missing or
 * malformed reads as absent, so an unexpected payload still flushes something
 * instead of being refused. `raw` is the body itself, for project fields
 * (`form_id`, …) read by {@link WpExtraEvent} handlers.
 */
export type WpWebhookPayload = {
  descendants?: WpPostId[];
  /** Core caps the list (`perimetre_core_webhook_descendants_limit`, 500). */
  descendantsTruncated: boolean;
  embedders?: WpPostId[];
  event: string;
  /** The post's language (WPML / Polylang), when Core sends one. */
  language?: string;
  /**
   * The path a published post just left (slug or parent changed); `null` when
   * it did not move; absent from a Core < 2.4.0 payload, which can't say.
   */
  oldPermalink?: null | string;
  optionsPage?: string;
  permalink?: string;
  postId?: WpPostId;
  postIds?: WpPostId[];
  postType?: string;
  postTypes?: string[];
  purgeAll: boolean;
  /** Whether the payload carried Smart Cache's purge facts (Core ≥ 2.4.0). */
  purgeFacts: boolean;
  purgeKeys: string[];
  raw: Record<string, unknown>;
  taxonomies: Record<string, string[]>;
  taxonomiesRemoved: Record<string, string[]>;
  translations?: WpPostId[];
};

/** Whether a value is a plain JSON object. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** A non-empty string, else absent. */
const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

/** A list of non-empty strings (the malformed ones dropped), else absent. */
const texts = (value: unknown): string[] | undefined =>
  Array.isArray(value)
    ? value.filter((it): it is string => text(it) !== undefined)
    : undefined;

/** A post id, as a number or a non-empty string, else absent. */
const postId = (value: unknown): undefined | WpPostId =>
  typeof value === 'number' && Number.isFinite(value) ? value : text(value);

/** A list of post ids (the malformed ones dropped), else absent. */
const postIds = (value: unknown): undefined | WpPostId[] =>
  Array.isArray(value)
    ? value.flatMap((it) => {
        const id = postId(it);
        return id === undefined ? [] : [id];
      })
    : undefined;

/** `{ taxonomy: [slugs] }`; PHP sends `[]` when empty, read as none. */
const terms = (value: unknown): Record<string, string[]> =>
  isRecord(value)
    ? Object.fromEntries(
        Object.entries(value).map(([taxonomy, slugs]) => [
          taxonomy,
          texts(slugs) ?? []
        ])
      )
    : {};

/**
 * Reads a Perimetre Core webhook body (see {@link WpWebhookPayload}).
 * @returns The payload, or `null` when the body has no `event`.
 */
export const parseWebhookPayload = (body: unknown): null | WpWebhookPayload => {
  if (!isRecord(body) || typeof body.event !== 'string' || !body.event) {
    return null;
  }

  return {
    descendants: postIds(body.descendants),
    descendantsTruncated: body.descendants_truncated === true,
    embedders: postIds(body.embedders),
    event: body.event,
    language: text(body.language),
    oldPermalink: body.old_permalink === null ? null : text(body.old_permalink),
    optionsPage: text(body.options_page),
    permalink: text(body.permalink),
    postId: postId(body.post_id),
    postIds: postIds(body.post_ids),
    postType: text(body.post_type),
    postTypes: texts(body.post_types),
    purgeAll: body.purge_all === true,
    purgeFacts: Array.isArray(body.purge_keys),
    purgeKeys: texts(body.purge_keys) ?? [],
    raw: body,
    taxonomies: terms(body.taxonomies),
    taxonomiesRemoved: terms(body.taxonomies_removed),
    translations: postIds(
      Array.isArray(body.translations)
        ? (body.translations as unknown[]).map((it) =>
            isRecord(it) ? it.post_id : it
          )
        : undefined
    )
  };
};

/** Whether a key is a WPGraphQL term's Relay id (`term:<id>`, base64). */
const isTermKey = (key: string): boolean => {
  if (!/^[A-Za-z0-9+/]+=*$/.test(key)) return false;
  try {
    return atob(key).startsWith('term:');
  } catch {
    return false;
  }
};

/**
 * Whether a `post.*` event changes the URL → id index of its type: the post
 * appeared, disappeared or moved. Every route that resolves a URL renders the
 * index, so flushing `index-<type>` on a plain content save expires every
 * page of the site for an edit to one (stelpro measured 203 of 285
 * prerendered routes for one product save). `post.updated` is a published
 * post saved published: it moved only if Core ≥ 2.4.0 reports an
 * `old_permalink`; a payload without the field can't say, so it flushes.
 */
const movesInIndex = (payload: WpWebhookPayload): boolean =>
  payload.event !== 'post.updated' || payload.oldPermalink !== null;

/**
 * Whether a `post.*` event changed which terms the post belongs to: only then
 * does a `taxonomy-<tax>` read (a taxonomy's NON-EMPTY terms) change through
 * it — a plain product save used to expire every room and space archive
 * through their sidebar. WPGraphQL Smart Cache purges a term's node key
 * exactly when a relationship to it is added or removed (a plain save purges
 * only the post). So: the post appeared, disappeared or moved; Core reported
 * removed terms; or a term key was purged. A payload without purge facts
 * (Core < 2.4.0) can't say, so it flushes.
 */
const changesTermMembership = (payload: WpWebhookPayload): boolean =>
  movesInIndex(payload) ||
  !payload.purgeFacts ||
  Object.values(payload.taxonomiesRemoved).some((slugs) => slugs.length > 0) ||
  payload.purgeKeys.some(isTermKey);

/**
 * Builds the webhook → flush mapping for one site. The rules (stelpro's
 * `resolveInvalidation`, shared by oiq and cima):
 *
 * - **`post.*`**: the entry, its type, every term it has or just lost
 *   (`taxonomies`, `taxonomies_removed`) and the entries that embed it — its
 *   translations, descendants and embedders. Its index only when the post
 *   appeared, disappeared or moved (publish / unpublish / trash / delete, or
 *   an `old_permalink`); its taxonomies only when its term membership changed.
 *   Plus the keys Smart Cache purged — for a type the site renders. A type it
 *   doesn't render flushes only its own type / index tags and its purge keys
 *   are ignored. A truncated descendant list adds the catch-all (stale).
 * - **`options.saved`**: that options page (Yoast's settings too for the site
 *   settings page) and Smart Cache's keys — but not its `purge_all`: Core
 *   purges all of Smart Cache before every `options.saved`, since options have
 *   no node; it is not a site-wide change.
 * - **`menu.*`**: every menu location.
 * - **`cache.purged`** (a term, media, user or menu-location change, the
 *   "GraphQL Cache Purged" watched event): the purged keys, and the hand tags
 *   of the `list:*` keys they name.
 * - **`import.completed`**: the imported types (type + index) and entries, all
 *   stale-while-revalidate.
 * - **`extraEvents`**: the project's own.
 * - **anything else**: the catch-all, stale-while-revalidate, logged.
 *
 * Smart Cache's purge keys: node keys (posts AND terms) expire; `skipped:*`
 * markers go stale (they're on every collapsed or keyless read: purged by
 * every save); `list:*` keys map onto the hand tags of what lists that type;
 * `graphql:Query` or `purge_all` add the catch-all. Never an empty flush: one
 * flushes the catch-all, stale.
 * @returns `(body) => WpInvalidation`, or `null` when the body has no `event`.
 */
export const createInvalidation = ({
  contentModel,
  extraEvents = {},
  logger,
  lookUpDependents,
  tags = WP_CACHE_TAGS
}: CreateInvalidationOptions): ((body: unknown) => null | WpInvalidation) => {
  const renderedTypes = new Set(contentModel.types);
  const menus = (contentModel.menuLocations ?? []).map(tags.menu);

  /** `list:<GraphQL single name>`, lower-cased, as Smart Cache spells it. */
  const listKey = (name: string) =>
    `list:${(contentModel.graphqlSingleNames?.[name] ?? name.replaceAll('_', '')).toLowerCase()}`;

  /**
   * Smart Cache's list keys → the hand tags of what lists that type. Reads
   * never carry list keys (`collapseGraphqlKeys` drops them), so this is how
   * a purge naming a list reaches the reads that list or label it: a term
   * created, renamed or deleted (WordPress itself dispatches nothing for
   * terms), or an entry of a type the webhook doesn't watch.
   */
  const listKeyTags: Record<string, readonly string[]> = {
    ...Object.fromEntries(
      contentModel.types.map((type) => [
        listKey(type),
        [tags.type(type), tags.index(type)]
      ])
    ),
    ...Object.fromEntries(
      (contentModel.taxonomies ?? []).map((taxonomy) => [
        listKey(taxonomy),
        [tags.taxonomy(taxonomy)]
      ])
    ),
    'list:menu': menus,
    'list:menuitem': menus,
    ...contentModel.listKeys
  };

  /** A tag that names no particular thing: flushed stale, never expired. */
  const isWide = (tag: string) =>
    tag === tags.all || tag.startsWith('skipped:');

  /** What Smart Cache purged: its keys, the lists' hand tags, the catch-all. */
  const purgedTags = (payload: WpWebhookPayload, withPurgeAll = true) => {
    const keys = payload.purgeKeys;
    const flushed = [
      ...keys.filter(
        (key) => !key.startsWith('list:') && key !== 'graphql:Query'
      ),
      ...keys.flatMap((key) => listKeyTags[key] ?? [])
    ];
    if (withPurgeAll && (payload.purgeAll || keys.includes('graphql:Query'))) {
      flushed.push(tags.all);
    }
    return flushed;
  };

  /** A `post.*` event's flush. */
  const postFlush = (
    payload: WpWebhookPayload
  ): { saved?: WpSavedEntry } & WpFlush => {
    const type = payload.postType ?? 'page';
    const flushed = [tags.type(type)];

    if (movesInIndex(payload)) flushed.push(tags.index(type));
    if (payload.postId != null) flushed.push(tags.entry(payload.postId));

    const membershipChanged = changesTermMembership(payload);
    for (const termsOf of [payload.taxonomies, payload.taxonomiesRemoved]) {
      for (const [taxonomy, slugs] of Object.entries(termsOf)) {
        if (membershipChanged) flushed.push(tags.taxonomy(taxonomy));
        flushed.push(...slugs.map((slug) => tags.term(taxonomy, slug)));
      }
    }

    for (const id of [
      ...(payload.translations ?? []),
      ...(payload.descendants ?? []),
      ...(payload.embedders ?? [])
    ]) {
      flushed.push(tags.entry(id));
    }

    // Past Core's descendant cap the rest can't be named: everything, stale.
    if (payload.descendantsTruncated) flushed.push(tags.all);

    if (renderedTypes.has(type)) {
      flushed.push(...purgedTags(payload));
    } else {
      logger?.info('cms.revalidate.unrendered_type', { postType: type });
    }

    const saved =
      payload.postId != null && lookUpDependents?.(payload)
        ? {
            id: payload.postId,
            type,
            ...(payload.language ? { language: payload.language } : {})
          }
        : undefined;

    return { saved, tags: flushed };
  };

  /** The site-settings page and Yoast with it, plus Smart Cache's keys. */
  const optionsFlush = (payload: WpWebhookPayload): WpFlush => {
    const page = payload.optionsPage ?? contentModel.optionsPage;
    if (!page) return { broad: true, tags: [tags.all] };
    return {
      tags: [
        tags.options(page),
        ...(page === contentModel.optionsPage ? [tags.options('seo')] : []),
        ...purgedTags(payload, false)
      ]
    };
  };

  /** A project event handler for `event`, exact name first, then `prefix.*`. */
  const extraEventFor = (event: string): undefined | WpExtraEvent =>
    extraEvents[event] ??
    Object.entries(extraEvents).find(
      ([name]) => name.endsWith('.*') && event.startsWith(name.slice(0, -1))
    )?.[1];

  /** Any event → its flush. */
  const toFlush = (
    payload: WpWebhookPayload
  ): { saved?: WpSavedEntry } & WpFlush => {
    const { event } = payload;
    const extra = extraEventFor(event);
    if (extra) return extra(payload, tags);
    if (event.startsWith('post.')) return postFlush(payload);

    switch (event) {
      case 'cache.purged':
        return { tags: purgedTags(payload) };
      case 'import.completed':
        return {
          broad: true,
          tags: [
            ...(payload.postTypes ?? []).flatMap((type) => [
              tags.type(type),
              tags.index(type)
            ]),
            ...(payload.postIds ?? []).map((id) => tags.entry(id))
          ]
        };
      case 'menu.deleted':
      case 'menu.saved':
        return { tags: [...menus, ...purgedTags(payload)] };
      case 'options.saved':
        return optionsFlush(payload);
      default:
        logger?.info('cms.revalidate.unmodelled_event', { event });
        return { broad: true, tags: [tags.all] };
    }
  };

  return (body) => {
    const payload = parseWebhookPayload(body);
    if (!payload) return null;

    const flush = toFlush(payload);
    if (flush.tags.length === 0) {
      logger?.info('cms.revalidate.empty_flush', { event: payload.event });
      return { event: payload.event, expire: [], stale: [tags.all] };
    }

    const unique = [...new Set(flush.tags)];
    if (flush.broad) return { event: payload.event, expire: [], stale: unique };

    return {
      event: payload.event,
      expire: unique.filter((tag) => !isWide(tag)),
      ...(flush.saved ? { saved: flush.saved } : {}),
      stale: unique.filter(isWide)
    };
  };
};

// ---------------------------------------------------------------------------
// The /revalidate handler
// ---------------------------------------------------------------------------

/** Options for {@link createRevalidateHandler}. */
export type RevalidateHandlerOptions = {
  /**
   * Looks up the dependents of a `saved` entry (see `lookUpDependents`) and
   * returns tags to expire with it — e.g. `entry-<id>` of the product pages
   * listing a document.
   */
  dependents?: (saved: WpSavedEntry) => Promise<readonly string[]>;
  /** The mapping, from {@link createInvalidation}. */
  invalidate: (body: unknown) => null | WpInvalidation;
  /** Logs refused requests (error) and flushes (info). */
  logger?: GraphqlLogger;
  /**
   * The shared secret WordPress sends as `Authorization: Bearer <secret>`. A
   * function is read per request. Missing → every request is refused.
   */
  secret: (() => string | undefined) | string | undefined;
};

/** What the handler answers; the caller flushes `expire` / `stale` and responds. */
export type RevalidateOutcome = {
  body: Record<string, unknown>;
  /** Tags to expire now (`revalidateTag(tag, { expire: 0 })`). */
  expire: string[];
  /** The resolved flush, when the request was accepted. */
  invalidation?: WpInvalidation;
  /** Tags to flush stale-while-revalidate (`revalidateTag(tag, 'max')`). */
  stale: string[];
  status: 200 | 400 | 401;
};

/**
 * Compares two strings in constant time: both are hashed (SHA-256) first, so
 * neither the length nor a common prefix leaks through timing.
 */
const safeEqual = async (a: string, b: string): Promise<boolean> => {
  const encoder = new TextEncoder();
  const [left, right] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b))
  ]);
  const x = new Uint8Array(left);
  const y = new Uint8Array(right);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
};

/**
 * Builds a framework-agnostic `/revalidate` webhook handler: a Web `Request`
 * in, `{ status, body, expire, stale }` out. It checks the bearer secret in
 * constant time, parses the JSON, resolves the flush and adds the looked-up
 * dependents. It flushes NOTHING itself: the caller runs its framework's
 * invalidation and answers with `status` / `body`.
 * @example Next.js route handler
 * ```ts
 * // src/app/revalidate/route.ts
 * const handle = createRevalidateHandler({
 *   invalidate: createInvalidation({ contentModel: CONTENT_MODEL }),
 *   secret: () => process.env.REVALIDATION_SECRET
 * });
 *
 * export async function POST(request: Request) {
 *   const { body, expire, stale, status } = await handle(request);
 *   expire.forEach((tag) => revalidateTag(tag, { expire: 0 }));
 *   stale.forEach((tag) => revalidateTag(tag, 'max'));
 *   return Response.json(body, { status });
 * }
 * ```
 */
export const createRevalidateHandler = ({
  dependents,
  invalidate,
  logger,
  secret
}: RevalidateHandlerOptions): ((
  request: Request
) => Promise<RevalidateOutcome>) => {
  return async (request) => {
    const expected = typeof secret === 'function' ? secret() : secret;
    const authorization = request.headers.get('authorization');
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : null;

    if (!token || !expected || !(await safeEqual(token, expected))) {
      logger?.error('cms.revalidate.unauthorized', {
        reason: !token
          ? 'missing-token'
          : !expected
            ? 'missing-secret'
            : 'mismatch'
      });
      return {
        body: { error: 'Unauthorized' },
        expire: [],
        stale: [],
        status: 401
      };
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch (error) {
      logger?.error('cms.revalidate.invalid_body', {
        message: error instanceof Error ? error.message : String(error)
      });
      return {
        body: { error: 'Invalid JSON body' },
        expire: [],
        stale: [],
        status: 400
      };
    }

    const invalidation = invalidate(payload);
    if (!invalidation) {
      return {
        body: { error: 'Missing event' },
        expire: [],
        stale: [],
        status: 400
      };
    }

    const expire = [...invalidation.expire];
    if (invalidation.saved && dependents) {
      expire.push(...(await dependents(invalidation.saved)));
    }
    const unique = [...new Set(expire)];

    logger?.info('cms.revalidate.flushed', {
      event: invalidation.event,
      expire: unique,
      stale: invalidation.stale
    });
    return {
      body: { expire: unique, revalidated: true, stale: invalidation.stale },
      expire: unique,
      invalidation,
      stale: invalidation.stale,
      status: 200
    };
  };
};

// ---------------------------------------------------------------------------
// Test-contract helpers
// ---------------------------------------------------------------------------

/** The Relay id WPGraphQL gives a node: `wpRelayId('post', 42)` → `cG9zdDo0Mg==`. */
export const wpRelayId = (kind: string, id: number | string): string =>
  btoa(`${kind}:${String(id)}`);

/**
 * A Perimetre Core 2.4.0 `post.*` webhook body, as `Dispatcher` sends it — a
 * published post saved published, nothing moved, no purge keys — with
 * `fields` on top.
 * @example
 * ```ts
 * post({ post_id: 30, post_type: 'page', purge_keys: [wpRelayId('post', 30)] })
 * post({ event: 'post.trashed', post_id: 30, post_type: 'page' })
 * ```
 */
export const post = (
  fields: Record<string, unknown> = {}
): Record<string, unknown> => ({
  descendants: [],
  embedders: [],
  event: 'post.updated',
  old_permalink: null,
  purge_all: false,
  purge_keys: [],
  taxonomies: [],
  translations: [],
  ...fields
});

/**
 * One row of the tag contract: a read's name, the hand tags it sets
 * (`READ_TAGS.x`), and the webhook bodies that must refresh it on the
 * editor's FIRST reload.
 */
export type TagContractRow = readonly [
  name: string,
  readTags: readonly string[],
  changes: readonly unknown[]
];

/**
 * Asserts the tag contract: every read × every change that alters it shares
 * an EXPIRED tag (a stale-only match would serve the old content once), and
 * every read carries the catch-all. Throws one `Error` listing every broken
 * pair — call it from any test runner.
 * @example
 * ```ts
 * test('tag contract', () => {
 *   assertTagContract(resolveInvalidation, [
 *     ['page', READ_TAGS.page(30), [post({ post_id: 30, post_type: 'page' })]],
 *     ['primary menu', READ_TAGS.primaryMenu, [{ event: 'menu.saved' }]]
 *   ]);
 * });
 * ```
 */
export const assertTagContract = (
  invalidate: (body: unknown) => null | WpInvalidation,
  rows: readonly TagContractRow[],
  { catchAll = WP_CACHE_TAGS.all }: { catchAll?: string } = {}
): void => {
  const failures: string[] = [];
  for (const [name, readTags, changes] of rows) {
    if (!readTags.includes(catchAll)) {
      failures.push(`${name}: does not carry the catch-all "${catchAll}"`);
    }
    for (const change of changes) {
      const invalidation = invalidate(change);
      if (!invalidation) {
        failures.push(`${name}: ${JSON.stringify(change)} was refused`);
      } else if (!readTags.some((tag) => invalidation.expire.includes(tag))) {
        failures.push(
          `${name}: ${JSON.stringify(change)} does not expire any of ${readTags.join(', ')}`
        );
      }
    }
  }
  if (failures.length > 0) {
    throw new Error(`Tag contract broken:\n- ${failures.join('\n- ')}`);
  }
};
