import { createInvalidation, WP_CACHE_TAGS } from '../../wp-cache.js';

/*
 * stelpro-frontend's `src/server/cms/tags.ts`, verbatim but for CMS_TAGS
 * spreading the package vocabulary, and its `resolveInvalidation` rebuilt on
 * `createInvalidation`: the port must answer every webhook exactly as
 * stelpro's own copy did (`../wp-cache.test.ts`).
 */

/**
 * The cache-tag vocabulary: the ONLY place a CMS tag string is spelled. Every
 * tag is named after something WordPress knows — an entry id, a post type, a
 * taxonomy, a term, a menu location, an options page, a form — never after a
 * frontend path or a page that happens to render it (the
 * `perimetre-apps:app-caching` skill, "CMS-coupled tags"). Each cached read
 * declares which CMS things it depends on (`READ_TAGS`); the webhook says what
 * changed in the CMS's own terms, and `resolveInvalidation`
 * (`./revalidation.ts`) answers with the same strings. So a new listing or
 * block needs no new webhook branch: it tags what it reads, and every save of
 * that thing reaches it.
 *
 * Next to these hand tags, a read carries the CMS's own keys for the nodes its
 * answer resolved (WPGraphQL's `X-GraphQL-Keys`, `./keys.ts`), verbatim: the
 * webhook flushes the keys WPGraphQL Smart Cache purged (`purge_keys`). They
 * are what reach an entry when something it EMBEDS changes — a product shown
 * in a page's Featured Product block, a category renamed under a PDP's
 * breadcrumb, an image's alt text — dependencies nobody has to remember to
 * declare.
 *
 * A tag is only real once `resolveInvalidation` returns it:
 * `revalidation.test.ts` checks every read below against every change that
 * alters it.
 *
 * The products API (`src/services/products-api`) is NOT the CMS and has its
 * own, time-based tags (`src/services/products-api/tags.ts`).
 */
export const CMS_TAGS = {
  ...WP_CACHE_TAGS,
  /** On every CMS read. Flushed (stale-while-revalidate) for any change the mapping does not model. */
  all: 'cms',
  /** One entry, by WordPress post id: on the entry's own read, and on reads that embed it by id. */
  entry: (id: number | string) => `entry-${String(id)}`,
  /**
   * A Gravity Forms form, by id. Forms live in Gravity Forms' own tables, not
   * in posts: `stelpro-us-core`'s `Sync\GravityFormWebhook` sends `form.*`
   * events for them.
   */
  form: (id: number | string) => `form-${String(id)}`,
  /** The URL → id index of a post type: static params, the sitemap. */
  index: (postType: string) => `index-${postType}`,
  /** A menu, by location. WordPress names the menu, never the location: every location is flushed. */
  menu: (location: string) => `menu-${location}`,
  /** An ACF options page (by `menu_slug`), or Yoast's settings (`seo`). */
  options: (group: string) => `options-${group}`,
  /** Everything that lists a taxonomy's terms (sidebar links, sitemap slices). */
  taxonomy: (taxonomy: string) => `taxonomy-${taxonomy}`,
  /** One term, for anything scoped to that term alone: its archive listing. */
  term: (taxonomy: string, slug: string) => `term-${taxonomy}-${slug}`,
  /** Every entry of a post type: whole-catalogue listings. A NEW entry reaches them through it. */
  type: (postType: string) => `type-${postType}`
} as const;

/**
 * Stelpro's content model, by the names WordPress registers
 * (`stelpro-us-core`: `PostTypes/`, `Taxonomies/`,
 * `ACF/GlobalSettingsFieldGroup.php`; the `stelpro-us` theme's
 * `register_nav_menus`). The webhook payload speaks these names, so the tags
 * must too.
 */
export const CONTENT_MODEL = {
  /** `register_nav_menus` locations (the theme's `functions.php`). */
  menuLocations: ['primary', 'top_bar', 'footer', 'footer_legal'],
  /** The ACF options page (`menu_slug`), the `options_page` of its `options.saved`. */
  optionsPage: 'stelpro-us-global-settings',
  /**
   * The taxonomies the site renders an archive or a term list for. The other
   * product taxonomies (heating mode, thermostat, …) only print as labels on
   * the PDP, which reaches them through its CMS keys.
   */
  taxonomies: {
    document: ['document_type'],
    product: [
      'product_category',
      'product_room',
      'product_space',
      'product_use_case'
    ]
  },
  /** Every post type the site renders (`post` is not rendered). */
  types: ['page', 'product', 'document']
} as const;

/** A product taxonomy with an archive route. */
export type ProductTaxonomy = (typeof CONTENT_MODEL.taxonomies.product)[number];

/**
 * The hand tags each cached read sets before it reads. Readers spread these
 * into `cacheTag`, and `revalidation.test.ts` asserts that every change which
 * alters a read flushes one of them — the tag contract. A new read gets a row
 * here (and in the test), never a string of its own.
 *
 * Entries carry only their own id: a change to what they EMBED (a document on
 * a PDP, a product in a page block, a term, an image) reaches them through the
 * payload (`embedders`, `descendants`) and through the CMS keys (`./keys.ts`).
 *
 * Term archives carry their term, never the taxonomy: every product save names
 * its taxonomies, so a `taxonomy-*` tag on 57 archives would expire them all on
 * each save. The product save names the TERMS it has and just lost
 * (`taxonomies`, `taxonomies_removed`), and those are exactly the archives that
 * list it — WPGraphQL's term → product connection does not include
 * descendants, so there is no ancestor to walk.
 *
 * Whole-catalogue listings carry the type tag, never one tag per item (128-tag
 * limit, and it would still miss a new item). Indexes carry `index-<type>`,
 * flushed by every save of the type (published, unpublished, re-slugged).
 */
export const READ_TAGS = {
  /** Every published product (the `/rooms` and `/spaces` grids). */
  allProducts: [CMS_TAGS.all, CMS_TAGS.type('product')],
  /**
   * Every non-empty product category's path (`/categories/<root>/…/<slug>/`):
   * the categories' existence gate, canonical redirect and static params.
   */
  categoryIndex: [CMS_TAGS.all, CMS_TAGS.taxonomy('product_category')],
  /** A product category listing, plus its direct children's (data-derived, see `getCategory`). */
  category: (slug: string) => [
    CMS_TAGS.all,
    CMS_TAGS.term('product_category', slug)
  ],
  /** Every discontinued product (the Discontinued Products block scans the whole catalogue). */
  discontinuedProducts: [CMS_TAGS.all, CMS_TAGS.type('product')],
  /** Every document type slug: the archives' existence gate and static params. */
  documentTypeIndex: [CMS_TAGS.all, CMS_TAGS.taxonomy('document_type')],
  /** A document type's archive (`/document-type/<slug>`). */
  documentType: (slug: string) => [
    CMS_TAGS.all,
    CMS_TAGS.term('document_type', slug)
  ],
  /** The footer, assembled: its two menus and the brand column. */
  footer: [
    CMS_TAGS.all,
    CMS_TAGS.menu('footer'),
    CMS_TAGS.menu('footer_legal'),
    CMS_TAGS.options(CONTENT_MODEL.optionsPage)
  ],
  /** The footer's legal links row. */
  footerLegalMenu: [CMS_TAGS.all, CMS_TAGS.menu('footer_legal')],
  /** The footer menu (its link columns). */
  footerMenu: [CMS_TAGS.all, CMS_TAGS.menu('footer')],
  /** A Gravity Forms form definition. */
  form: (id: number | string) => [CMS_TAGS.all, CMS_TAGS.form(id)],
  /** The "Global Settings" ACF options page (logos, phones, social, certifications). */
  globalSettings: [CMS_TAGS.all, CMS_TAGS.options(CONTENT_MODEL.optionsPage)],
  /** Yoast's site-wide settings (no webhook: see `getGlobalSeo`). */
  globalSeo: [CMS_TAGS.all, CMS_TAGS.options('seo')],
  /** The header, assembled: the primary and top-bar menus and the logos. */
  header: [
    CMS_TAGS.all,
    CMS_TAGS.menu('primary'),
    CMS_TAGS.menu('top_bar'),
    CMS_TAGS.options(CONTENT_MODEL.optionsPage)
  ],
  /** One page by id. */
  page: (id: number | string) => [CMS_TAGS.all, CMS_TAGS.entry(id)],
  /** The page uri → id index. */
  pageIndex: [CMS_TAGS.all, CMS_TAGS.index('page')],
  /** The primary (mega) menu. */
  primaryMenu: [CMS_TAGS.all, CMS_TAGS.menu('primary')],
  /** One product by id. */
  product: (id: number | string) => [CMS_TAGS.all, CMS_TAGS.entry(id)],
  /** The custom specifications HTML file uploaded on a product (ACF `custom_content_file`). */
  productCustomSpecs: (productId: number | string) => [
    CMS_TAGS.all,
    CMS_TAGS.entry(productId)
  ],
  /** The product slug → id index. */
  productIndex: [CMS_TAGS.all, CMS_TAGS.index('product')],
  /** The resource-centre section listings: every document of the card's types. */
  resourceDocuments: (typeSlugs: readonly string[]) => [
    CMS_TAGS.all,
    ...typeSlugs.map((slug) => CMS_TAGS.term('document_type', slug))
  ],
  /** The `/resources/` hub's Resource Cards (plus the hub's entry id, data-derived). */
  resourcesHub: [CMS_TAGS.all, CMS_TAGS.index('page')],
  /** The sitemap's document-type slice. */
  sitemapDocumentTypes: [CMS_TAGS.all, CMS_TAGS.taxonomy('document_type')],
  /** The sitemap's page slice. */
  sitemapPages: [CMS_TAGS.all, CMS_TAGS.index('page')],
  /** The sitemap's product-category slice (only non-empty categories). */
  sitemapProductCategories: [
    CMS_TAGS.all,
    CMS_TAGS.taxonomy('product_category')
  ],
  /** The sitemap's product slice. */
  sitemapProducts: [CMS_TAGS.all, CMS_TAGS.index('product')],
  /** The sitemap's use-case / room / space slice (only non-empty terms). */
  sitemapProductTaxonomies: [
    CMS_TAGS.all,
    CMS_TAGS.taxonomy('product_use_case'),
    CMS_TAGS.taxonomy('product_room'),
    CMS_TAGS.taxonomy('product_space')
  ],
  /** A use-case / room / space term's archive listing. */
  taxonomyArchive: (taxonomy: ProductTaxonomy, slug: string) => [
    CMS_TAGS.all,
    CMS_TAGS.term(taxonomy, slug)
  ],
  /** The `/rooms` or `/spaces` sidebar: that taxonomy's non-empty terms. */
  taxonomyLinks: (taxonomy: ProductTaxonomy) => [
    CMS_TAGS.all,
    CMS_TAGS.taxonomy(taxonomy)
  ],
  /** The top-bar utility menu. */
  topBarMenu: [CMS_TAGS.all, CMS_TAGS.menu('top_bar')]
} as const;

/**
 * The most CMS keys one read may add to its cached scope (`./keys.ts`). Only
 * the entry reads (a page, a product) carry keys: measured, PDPs resolve 42–67
 * nodes and the home page 44.
 *
 * Vercel keeps at most 128 tags per Runtime Cache item AND per cached route
 * response, and a route's response carries the union of every scope it
 * renders: the entry (96 + 2), the global settings, four menus and Yoast (2
 * each, hand tags only), a block's own read or a PDP's products-API
 * sections (≈ 6) and Next's implicit tags (≈ 5) — about 115 for the heaviest PDP.
 *
 * Past the budget the rest collapse into WPGraphQL's own coarser key
 * (`skipped:<kind>`), which Smart Cache purges on ANY change of that kind: a
 * collapsed read is flushed more often, never less — but `skipped:post` is
 * purged by every post save, so a budget too small to hold a PDP made every
 * save re-render every PDP. Keep it above what an entry resolves.
 */
export const MAX_CMS_KEYS = 96;

/** stelpro's webhook mapping, on the package. */
export const resolveInvalidation = createInvalidation({
  contentModel: {
    menuLocations: CONTENT_MODEL.menuLocations,
    optionsPage: CONTENT_MODEL.optionsPage,
    taxonomies: [
      ...CONTENT_MODEL.taxonomies.document,
      ...CONTENT_MODEL.taxonomies.product
    ],
    types: CONTENT_MODEL.types
  },
  extraEvents: {
    // `stelpro-us-core`'s `Sync\GravityFormWebhook`: `form.*` with `form_id`.
    /** Gravity Forms events: that form. */
    'form.*': ({ raw }) => ({
      tags:
        typeof raw.form_id === 'number' || typeof raw.form_id === 'string'
          ? [CMS_TAGS.form(raw.form_id)]
          : []
    })
  },
  // A document renders on its products' PDPs; without `embedders` the route
  // looks them up.
  /** Which saves the caller looks dependents up for. */
  lookUpDependents: (payload) =>
    payload.postType === 'document' && !payload.embedders?.length
});
