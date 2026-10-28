import { describe, expect, test } from 'bun:test';
import {
  createInvalidation,
  createRevalidateHandler,
  parseWebhookPayload,
  post,
  WP_CACHE_TAGS,
  wpRelayId
} from '../wp-cache.js';

/*
 * What stelpro's suite (`./wp-cache.test.ts`) doesn't cover: the oiq and cima
 * deltas folded into the kit, its configuration, and the handler.
 */

const invalidate = createInvalidation({
  contentModel: {
    graphqlSingleNames: { news: 'newsArticle' },
    menuLocations: [],
    optionsPage: 'cima-site-options',
    taxonomies: ['news_topic'],
    types: ['page', 'news']
  },
  /** Which saves the caller looks dependents up for. */
  lookUpDependents: (payload) =>
    payload.postType === 'page' &&
    (payload.translations === undefined || payload.descendantsTruncated)
});

describe('createInvalidation', () => {
  test('a move (old_permalink) also flushes the taxonomies of the post’s terms (oiq)', () => {
    const result = invalidate(
      post({
        old_permalink: '/old',
        post_id: 3,
        post_type: 'news',
        taxonomies: { news_topic: ['energy'] }
      })
    );
    expect(result?.expire).toContain('taxonomy-news_topic');
    expect(result?.expire).toContain('index-news');
  });

  test('graphqlSingleNames maps a purged list key whose name differs from the post type', () => {
    const result = invalidate({
      event: 'cache.purged',
      purge_keys: ['list:newsarticle', 'list:newstopic']
    });
    expect(result?.expire).toEqual([
      'type-news',
      'index-news',
      'taxonomy-news_topic'
    ]);
  });

  test('an unrendered type ignores its purge keys (cima)', () => {
    const result = invalidate(
      post({
        post_id: 9,
        post_type: 'graphql_document',
        purge_keys: [wpRelayId('post', 9), 'skipped:post', 'graphql:Query']
      })
    );
    expect(result).toEqual({
      event: 'post.updated',
      expire: ['type-graphql_document', 'entry-9'],
      stale: []
    });
  });

  test('another options page flushes only itself; the site settings page brings Yoast', () => {
    expect(
      invalidate({ event: 'options.saved', options_page: 'footer' })?.expire
    ).toEqual(['options-footer']);
    expect(invalidate({ event: 'options.saved' })?.expire).toEqual([
      'options-cima-site-options',
      'options-seo'
    ]);
  });

  test('lookUpDependents names the saved entry, with its language', () => {
    const body: Record<string, unknown> = post({
      language: 'fr',
      post_id: 12,
      post_type: 'page'
    });
    delete body.translations;
    expect(invalidate(body)?.saved).toEqual({
      id: 12,
      language: 'fr',
      type: 'page'
    });
    expect(invalidate(post({ post_id: 12, post_type: 'page' }))?.saved).toBe(
      undefined
    );
  });

  test('extra events: exact names win over prefixes, and run before the built-ins', () => {
    const withExtras = createInvalidation({
      contentModel: { types: ['page'] },
      extraEvents: {
        /** Gravity Forms events: that form. */
        'form.*': () => ({ tags: ['form-any'] }),
        /** The exact event. */
        'form.saved': () => ({ tags: ['form-saved'] }),
        /** Overrides the built-in menu flush. */
        'menu.saved': () => ({ broad: true, tags: ['menus'] })
      }
    });
    expect(withExtras({ event: 'form.saved' })?.expire).toEqual(['form-saved']);
    expect(withExtras({ event: 'form.deleted' })?.expire).toEqual(['form-any']);
    expect(withExtras({ event: 'menu.saved' })?.stale).toEqual(['menus']);
  });

  test('a custom vocabulary is used everywhere', () => {
    const custom = createInvalidation({
      contentModel: { types: ['page'] },
      tags: {
        ...WP_CACHE_TAGS,
        all: 'wp',
        /** A renamed entry tag. */
        entry: (id) => `wp-${String(id)}`
      }
    });
    expect(custom(post({ post_id: 1, post_type: 'page' }))?.expire).toContain(
      'wp-1'
    );
    expect(custom({ event: 'user.saved' })?.stale).toEqual(['wp']);
  });
});

describe('parseWebhookPayload', () => {
  test('reads Core’s fields loosely and keeps the raw body', () => {
    const payload = parseWebhookPayload({
      event: 'post.updated',
      form_id: 26,
      post_id: '7',
      purge_keys: ['a', 3, ''],
      translations: [{ post_id: 8 }, { nope: true }]
    });
    expect(payload?.postId).toBe('7');
    expect(payload?.purgeKeys).toEqual(['a']);
    expect(payload?.purgeFacts).toBe(true);
    expect(payload?.translations).toEqual([8]);
    expect(payload?.raw.form_id).toBe(26);
    expect(parseWebhookPayload({ post_id: 1 })).toBeNull();
  });
});

describe('createRevalidateHandler', () => {
  const SECRET = 's3cret';
  /** A webhook request. */
  const request = (body: string, authorization?: string) =>
    new Request('https://site.test/revalidate/', {
      body,
      headers: authorization ? { authorization } : {},
      method: 'POST'
    });
  const handle = createRevalidateHandler({
    /** The product pages listing a saved page. */
    dependents: (saved) =>
      Promise.resolve([`entry-${String(saved.id)}-parent`]),
    invalidate,
    /** The configured secret. */
    secret: () => SECRET
  });

  test('refuses a missing or wrong secret, and a missing configured secret', async () => {
    const body = JSON.stringify(post({ post_id: 1 }));
    expect((await handle(request(body))).status).toBe(401);
    expect((await handle(request(body, 'Bearer nope'))).status).toBe(401);
    expect((await handle(request(body, SECRET))).status).toBe(401);

    const unconfigured = createRevalidateHandler({
      invalidate,
      secret: undefined
    });
    const refused = await unconfigured(request(body, 'Bearer '));
    expect(refused).toMatchObject({ expire: [], stale: [], status: 401 });
  });

  test('refuses a body that is not JSON, or has no event', async () => {
    const auth = `Bearer ${SECRET}`;
    expect((await handle(request('{', auth))).status).toBe(400);
    expect(
      (await handle(request(JSON.stringify({ post_id: 1 }), auth))).body
    ).toEqual({ error: 'Missing event' });
  });

  test('answers what to flush, with the looked-up dependents expired too', async () => {
    const body: Record<string, unknown> = post({
      post_id: 12,
      post_type: 'page'
    });
    delete body.translations;

    const outcome = await handle(
      request(JSON.stringify(body), `Bearer ${SECRET}`)
    );

    expect(outcome.status).toBe(200);
    expect(outcome.expire).toContain('entry-12');
    expect(outcome.expire).toContain('entry-12-parent');
    expect(outcome.body).toEqual({
      expire: outcome.expire,
      revalidated: true,
      stale: []
    });
  });
});
