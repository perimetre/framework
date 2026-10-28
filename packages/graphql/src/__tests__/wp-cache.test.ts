import { describe, expect, test } from 'bun:test';
import assert from 'node:assert/strict';
import {
  assertTagContract,
  post,
  wpRelayId as relay,
  type TagContractRow,
  type WpInvalidation
} from '../wp-cache.js';
import {
  CMS_TAGS,
  READ_TAGS,
  resolveInvalidation
} from './fixtures/stelpro.js';

/*
 * stelpro-frontend's `revalidation.test.ts`, run against `createInvalidation`
 * configured as stelpro (`./fixtures/stelpro.ts`): the shared kit must flush
 * exactly what each project's copy did.
 */

/** `resolveInvalidation`, asserting the body was accepted. */
const flush = (body: unknown): Omit<WpInvalidation, 'event'> => {
  const invalidation = resolveInvalidation(body);
  assert.ok(invalidation, 'expected a flush');
  return {
    expire: invalidation.expire,
    stale: invalidation.stale,
    ...(invalidation.saved ? { saved: invalidation.saved } : {})
  };
};

describe('resolveInvalidation', () => {
  test('refuses a body that is not a webhook payload', () => {
    assert.equal(resolveInvalidation(null), null);
    assert.equal(resolveInvalidation([]), null);
    assert.equal(resolveInvalidation({ post_id: 1 }), null);
    assert.equal(resolveInvalidation({ event: '' }), null);
  });

  test('a page save expires the entry, what embeds it, its type and index', () => {
    const result = flush(
      post({
        descendants: [31],
        embedders: [40],
        permalink: '/en/about-us',
        post_id: 30,
        post_type: 'page',
        purge_keys: [relay('post', 30), 'list:page']
      })
    );

    for (const tag of [
      'entry-30',
      'entry-31',
      'entry-40',
      'type-page',
      'index-page',
      relay('post', 30)
    ]) {
      assert.ok(result.expire.includes(tag), tag);
    }
    assert.ok(!result.expire.includes('list:page'), 'list keys are mapped');
    assert.deepEqual(result.stale, []);
  });

  test('a re-slug needs no path: the index and the entry both expire', () => {
    // The QC report: after a slug change the new URL did not resolve and the
    // old one kept its content. Both URLs resolve through the page index
    // (`index-page`) and render the entry (`entry-<id>`), so the save expires
    // both — the old URL 404s, the new one renders the saved content.
    for (const postType of ['page', 'product']) {
      const result = flush(
        post({
          old_permalink: '/en/old-slug',
          permalink: '/en/new-slug',
          post_id: 30,
          post_slug: 'new-slug',
          post_type: postType
        })
      );

      assert.ok(result.expire.includes('entry-30'), postType);
      assert.ok(result.expire.includes(`index-${postType}`), postType);
      assert.deepEqual(Object.keys(result).sort(), ['expire', 'stale']);
    }
  });

  test('a term membership change expires the listing AND every page printing the term', () => {
    // As Smart Cache reports a product joining room 35 ("kitchen"): the room's
    // node key, plus the post. Measured against the local CMS.
    const result = flush(
      post({
        post_id: 22,
        post_type: 'product',
        purge_keys: [
          relay('term', 35),
          'skipped:term',
          'list:productroom',
          relay('post', 22),
          'skipped:post'
        ],
        taxonomies: { product_room: ['bedroom', 'kitchen'] }
      })
    );

    assert.ok(result.expire.includes('term-product_room-kitchen'));
    assert.ok(result.expire.includes(relay('post', 22)));
    // The node key: pages that print the room (a PDP's room list) refresh too.
    assert.ok(result.expire.includes(relay('term', 35)));
    assert.deepEqual(result.stale, ['skipped:term', 'skipped:post']);
  });

  test('a plain content save leaves the URL index alone', () => {
    // Every route resolves its URL through the index: flushing it on a content
    // save expired 203 of 285 prerendered routes for one product edit.
    for (const postType of ['page', 'product']) {
      const result = flush(post({ post_id: 30, post_type: postType }));
      assert.ok(result.expire.includes('entry-30'), postType);
      assert.ok(!result.expire.includes(`index-${postType}`), postType);
    }
  });

  test('a plain save does not flush whole taxonomies; a membership change does', () => {
    const terms = { product_room: ['bedroom'] };
    const plain = flush(
      post({
        post_id: 22,
        post_type: 'product',
        purge_keys: [relay('post', 22)],
        taxonomies: terms
      })
    );
    assert.ok(plain.expire.includes('term-product_room-bedroom'));
    assert.ok(!plain.expire.includes('taxonomy-product_room'));

    const joined = flush(
      post({
        post_id: 22,
        post_type: 'product',
        purge_keys: [relay('term', 34), relay('post', 22)],
        taxonomies: terms
      })
    );
    assert.ok(joined.expire.includes('taxonomy-product_room'));

    const left = flush(
      post({
        post_id: 22,
        post_type: 'product',
        taxonomies: terms,
        taxonomies_removed: { product_room: ['kitchen'] }
      })
    );
    assert.ok(left.expire.includes('taxonomy-product_room'));
  });

  test('a payload that cannot say whether the post moved flushes the index', () => {
    // Core < 2.4.0 sends no `old_permalink`.
    const body: Record<string, unknown> = post({
      post_id: 30,
      post_type: 'page'
    });
    delete body.old_permalink;
    assert.ok(flush(body).expire.includes('index-page'));
  });

  test('a product flushes the terms it has AND the terms it just lost', () => {
    const result = flush(
      post({
        post_id: 5,
        post_type: 'product',
        taxonomies: {
          product_category: ['baseboards'],
          product_room: ['bedroom']
        },
        taxonomies_removed: { product_use_case: ['garage'] }
      })
    );

    for (const tag of [
      'taxonomy-product_category',
      'term-product_category-baseboards',
      'taxonomy-product_room',
      'term-product_room-bedroom',
      'taxonomy-product_use_case',
      'term-product_use_case-garage'
    ]) {
      assert.ok(result.expire.includes(tag), tag);
    }
  });

  test('a document save reaches the products embedding it', () => {
    // `stelpro-us-core` answers `perimetre_core_webhook_embedders` for a
    // document with its product.
    const result = flush(
      post({
        embedders: [22],
        post_id: 900,
        post_type: 'document',
        taxonomies: { document_type: ['installation-guides'] }
      })
    );

    for (const tag of [
      'entry-900',
      'entry-22',
      'term-document_type-installation-guides'
    ]) {
      assert.ok(result.expire.includes(tag), tag);
    }
  });

  test('a document without embedders names itself for the dependents lookup', () => {
    const result = flush(post({ post_id: 900, post_type: 'document' }));

    assert.deepEqual(result.saved, { id: 900, type: 'document' });
    assert.ok(result.expire.includes('entry-900'));
  });

  test('only a document is ever looked up', () => {
    assert.equal(
      flush(post({ post_id: 30, post_type: 'page' })).saved,
      undefined
    );
    assert.equal(
      flush(post({ embedders: [22], post_id: 900, post_type: 'document' }))
        .saved,
      undefined
    );
  });

  test('a post type the site does not render flushes its own tags only', () => {
    const result = flush(
      post({
        post_id: 9,
        post_type: 'graphql_document',
        purge_keys: [relay('post', 9), 'skipped:post', 'list:graphqldocument']
      })
    );

    assert.deepEqual(result.stale, [], 'its skipped:post marks nothing stale');
    assert.ok(result.expire.includes('type-graphql_document'));
    assert.ok(!result.expire.includes(CMS_TAGS.all));
  });

  test('a blog post flushes its own tags only', () => {
    const result = flush(post({ post_id: 9, post_type: 'post' }));

    assert.deepEqual(result.stale, []);
    assert.ok(result.expire.includes('type-post'));
    assert.ok(!result.expire.includes(CMS_TAGS.all));
  });

  test('a truncated descendant list makes the whole site stale, never expired', () => {
    const result = flush(
      post({
        descendants: [31],
        descendants_truncated: true,
        post_id: 30,
        post_type: 'page'
      })
    );

    assert.deepEqual(result.stale, [CMS_TAGS.all]);
    assert.ok(!result.expire.includes(CMS_TAGS.all));
  });

  test('options.saved flushes the page and Yoast, and ignores its purge_all', () => {
    const result = flush({
      event: 'options.saved',
      options_page: 'stelpro-us-global-settings',
      purge_all: true,
      purge_keys: []
    });

    assert.deepEqual(result.expire, [
      'options-stelpro-us-global-settings',
      'options-seo'
    ]);
    assert.deepEqual(result.stale, []);
  });

  test('a menu event flushes every location', () => {
    const result = flush({
      event: 'menu.saved',
      menu_id: 36,
      purge_keys: [relay('term', 36), 'list:menu']
    });

    for (const location of ['primary', 'top_bar', 'footer', 'footer_legal']) {
      assert.ok(result.expire.includes(`menu-${location}`), location);
    }
  });

  test('a Gravity Forms event flushes that form', () => {
    for (const event of ['form.saved', 'form.trashed', 'form.deleted']) {
      assert.deepEqual(
        flush({
          embedded_in: [
            { permalink: '/en/contact', post_id: 3, post_type: 'page' }
          ],
          event,
          form_id: 26
        }),
        { expire: ['form-26'], stale: [] }
      );
    }
  });

  test('a form event without a form id goes stale site-wide instead of 400', () => {
    assert.deepEqual(flush({ event: 'form.saved' }), {
      expire: [],
      stale: [CMS_TAGS.all]
    });
  });

  test('cache.purged maps list keys onto hand tags; skipped markers go stale', () => {
    const result = flush({
      event: 'cache.purged',
      purge_all: false,
      purge_keys: [relay('term', 7), 'list:productcategory', 'skipped:term']
    });

    assert.deepEqual(result.expire, [
      relay('term', 7),
      'taxonomy-product_category'
    ]);
    assert.deepEqual(result.stale, ['skipped:term']);
  });

  test('a purge-all goes stale site-wide', () => {
    const result = flush({
      event: 'cache.purged',
      purge_all: true,
      purge_keys: []
    });

    assert.deepEqual(result.stale, [CMS_TAGS.all]);
  });

  test('an import is one stale-while-revalidate flush', () => {
    const result = flush({
      count: 2,
      event: 'import.completed',
      post_ids: [1, 2],
      post_types: ['product']
    });

    assert.deepEqual(result.expire, []);
    assert.deepEqual(result.stale, [
      'type-product',
      'index-product',
      'entry-1',
      'entry-2'
    ]);
  });

  test('an unmodelled event flushes the catch-all, stale', () => {
    assert.deepEqual(flush({ event: 'user.saved' }), {
      expire: [],
      stale: [CMS_TAGS.all]
    });
  });

  test('malformed fields read as absent, and the event still flushes', () => {
    const result = flush({
      descendants: 'nope',
      embedders: [{ id: 1 }, 32],
      event: 'post.updated',
      post_id: { id: 1 },
      post_type: 'page',
      taxonomies: []
    });

    assert.ok(result.expire.includes('entry-32'));
    assert.ok(result.expire.includes('index-page'));
  });
});

/**
 * The tag contract: every cached read × every CMS change that alters its
 * output. Each row is a read's hand tags (`READ_TAGS`, the same constant the
 * reader spreads into `cacheTag`) and the webhook bodies that must refresh it
 * on the editor's FIRST reload (an `expire` tag in common). A new read adds a
 * row; a new kind of change adds a body.
 */
describe('tag contract', () => {
  const pageSave = post({ post_id: 30, post_type: 'page' });
  /**
   * Every way a post appears in, leaves or moves within its type's URL → id
   * index. A plain content save (`post.updated`, `old_permalink: null`) is
   * none of them.
   */
  const indexChanges = (postType: string, id: number) => [
    post({ event: 'post.published', post_id: id, post_type: postType }),
    post({ event: 'post.trashed', post_id: id, post_type: postType }),
    post({ event: 'post.drafted', post_id: id, post_type: postType }),
    post({ event: 'post.deleted', post_id: id, post_type: postType }),
    post({ old_permalink: '/en/old', post_id: id, post_type: postType })
  ];
  /** A product save naming the terms the product has. */
  const productSave = (taxonomies: Record<string, string[]> = {}) =>
    post({ post_id: 22, post_type: 'product', taxonomies });
  /** A product joining `slug`, as Core + Smart Cache report it (the term's key purged). */
  const productJoined = (taxonomy: string, slug: string) =>
    post({
      post_id: 22,
      post_type: 'product',
      purge_keys: [relay('term', 35), 'skipped:term', relay('post', 22)],
      taxonomies: { [taxonomy]: [slug] }
    });
  /** A product save that took the product out of one term. */
  const productRemovedFrom = (taxonomy: string, slug: string) =>
    post({
      post_id: 22,
      post_type: 'product',
      taxonomies_removed: { [taxonomy]: [slug] }
    });
  const documentSave = post({
    embedders: [22],
    post_id: 900,
    post_type: 'document',
    taxonomies: { document_type: ['installation-guides'] }
  });
  /** A term created, as Core reports it: `cache.purged` with Smart Cache's keys. */
  const termPurge = (list: string) => ({
    event: 'cache.purged',
    purge_keys: [relay('term', 3), list]
  });
  const menuSave = { event: 'menu.saved', menu_id: 36 };
  const optionsSave = {
    event: 'options.saved',
    options_page: 'stelpro-us-global-settings'
  };

  const contract: TagContractRow[] = [
    ['page', READ_TAGS.page(30), [pageSave]],
    [
      'page, when its parent moves',
      READ_TAGS.page(31),
      [post({ descendants: [31], post_id: 30, post_type: 'page' })]
    ],
    ['page index', READ_TAGS.pageIndex, indexChanges('page', 30)],
    ['sitemap pages', READ_TAGS.sitemapPages, indexChanges('page', 30)],
    // `getResourceCards` adds the hub page's own entry once it resolved it.
    [
      'resources hub',
      [...READ_TAGS.resourcesHub, CMS_TAGS.entry(30)],
      [pageSave, ...indexChanges('page', 31)]
    ],
    ['product', READ_TAGS.product(22), [productSave(), documentSave]],
    [
      'product custom specifications file',
      READ_TAGS.productCustomSpecs(22),
      [productSave()]
    ],
    ['product index', READ_TAGS.productIndex, indexChanges('product', 22)],
    [
      'sitemap products',
      READ_TAGS.sitemapProducts,
      indexChanges('product', 22)
    ],
    ['all products', READ_TAGS.allProducts, [productSave()]],
    ['discontinued products', READ_TAGS.discontinuedProducts, [productSave()]],
    [
      'category listing',
      READ_TAGS.category('baseboards'),
      [
        productSave({ product_category: ['baseboards'] }),
        productRemovedFrom('product_category', 'baseboards')
      ]
    ],
    ...(['product_room', 'product_space', 'product_use_case'] as const).map(
      (taxonomy): TagContractRow => [
        `${taxonomy} archive`,
        READ_TAGS.taxonomyArchive(taxonomy, 'bedroom'),
        [
          productSave({ [taxonomy]: ['bedroom'] }),
          productRemovedFrom(taxonomy, 'bedroom')
        ]
      ]
    ),
    ...(['product_room', 'product_space'] as const).map(
      (taxonomy): TagContractRow => [
        `${taxonomy} sidebar links`,
        READ_TAGS.taxonomyLinks(taxonomy),
        [
          productJoined(taxonomy, 'bedroom'),
          productRemovedFrom(taxonomy, 'bedroom'),
          termPurge(`list:${taxonomy.replace('_', '')}`)
        ]
      ]
    ),
    [
      'category index (gate, static params)',
      READ_TAGS.categoryIndex,
      [
        productJoined('product_category', 'baseboards'),
        productRemovedFrom('product_category', 'baseboards'),
        termPurge('list:productcategory')
      ]
    ],
    [
      'use-case archive slugs (gate, static params)',
      READ_TAGS.taxonomyLinks('product_use_case'),
      [
        productJoined('product_use_case', 'interior-en'),
        productRemovedFrom('product_use_case', 'interior-en'),
        termPurge('list:productusecase')
      ]
    ],
    [
      'document type index (gate, static params)',
      READ_TAGS.documentTypeIndex,
      [
        post({
          event: 'post.published',
          post_id: 900,
          post_type: 'document',
          taxonomies: { document_type: ['installation-guides'] }
        }),
        termPurge('list:documenttype')
      ]
    ],
    [
      'sitemap product categories',
      READ_TAGS.sitemapProductCategories,
      [
        productJoined('product_category', 'baseboards'),
        termPurge('list:productcategory')
      ]
    ],
    [
      'sitemap product taxonomies',
      READ_TAGS.sitemapProductTaxonomies,
      [
        productJoined('product_room', 'bedroom'),
        productJoined('product_space', 'bedroom'),
        productJoined('product_use_case', 'bedroom'),
        termPurge('list:productusecase')
      ]
    ],
    [
      'document type archive',
      READ_TAGS.documentType('installation-guides'),
      [
        documentSave,
        post({
          post_id: 900,
          post_type: 'document',
          taxonomies_removed: { document_type: ['installation-guides'] }
        })
      ]
    ],
    [
      'resource documents',
      READ_TAGS.resourceDocuments(['manuals', 'installation-guides']),
      [documentSave]
    ],
    [
      'sitemap document types',
      READ_TAGS.sitemapDocumentTypes,
      [
        post({
          event: 'post.published',
          post_id: 900,
          post_type: 'document',
          taxonomies: { document_type: ['installation-guides'] }
        }),
        termPurge('list:documenttype')
      ]
    ],
    ['primary menu', READ_TAGS.primaryMenu, [menuSave]],
    ['top bar menu', READ_TAGS.topBarMenu, [menuSave]],
    [
      'footer menu',
      READ_TAGS.footerMenu,
      [menuSave, { event: 'menu.deleted' }]
    ],
    ['footer legal menu', READ_TAGS.footerLegalMenu, [menuSave]],
    ['header (assembled)', READ_TAGS.header, [menuSave, optionsSave]],
    ['footer (assembled)', READ_TAGS.footer, [menuSave, optionsSave]],
    ['global settings', READ_TAGS.globalSettings, [optionsSave]],
    ['Yoast settings', READ_TAGS.globalSeo, [optionsSave]],
    [
      'Gravity Forms form',
      READ_TAGS.form(26),
      [
        { event: 'form.saved', form_id: 26 },
        { event: 'form.trashed', form_id: 26 },
        { event: 'form.deleted', form_id: 26 }
      ]
    ]
  ];

  test('every read × every change that alters it shares an expired tag', () => {
    assertTagContract(resolveInvalidation, contract);
  });

  test('a broken row fails the contract, naming the read and the change', () => {
    expect(() => {
      assertTagContract(resolveInvalidation, [
        [
          'menu read missing its tag',
          [CMS_TAGS.all],
          [{ event: 'menu.saved' }]
        ],
        ['no catch-all', [CMS_TAGS.menu('primary')], []]
      ]);
    }).toThrow(/menu read missing its tag: .*menu\.saved.*\n- no catch-all/s);
  });

  test('an entry is not flushed by saves of other entries of its type', () => {
    const { expire } = flush(post({ post_id: 99, post_type: 'product' }));
    assert.ok(!READ_TAGS.product(22).some((tag) => expire.includes(tag)));
  });

  test('a term archive is not flushed by a product outside that term', () => {
    const { expire } = flush(
      productSave({
        product_category: ['baseboards'],
        product_room: ['kitchen']
      })
    );
    assert.ok(
      !READ_TAGS.taxonomyArchive('product_room', 'bedroom').some((tag) =>
        expire.includes(tag)
      )
    );
  });

  test('a node key a read resolved is flushed when the CMS purges it', () => {
    // `queryWithKeys` tags a page with the Relay id of a product its Featured
    // Product block shows; the product's save carries that id in `purge_keys`.
    const { expire } = flush(
      post({
        post_id: 22,
        post_type: 'product',
        purge_keys: [relay('post', 22)]
      })
    );
    assert.ok(expire.includes(relay('post', 22)));
  });
});
