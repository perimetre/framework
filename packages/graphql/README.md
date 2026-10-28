# @perimetre/graphql

Reusable GraphQL client toolkit for Perimetre projects (primarily WPGraphQL / WordPress headless). Bundles the `graphql-request` setup, TanStack Query bindings, WPGraphQL Smart Cache APQ routing, and codegen helpers that we use across every project — minus the copy-paste.

APQ is **opt-in** (`apq: true`) and built around a `graphql-php`-compatible hasher, so the codegen hash matches the id WPGraphQL Smart Cache stores the document under — queries hit the cacheable GET path on the first request with **no POST-to-register round trip**. Every other layer (logging, retries, instrumented fetch, TanStack helpers) works with or without APQ.

## What's in the box

The package is opinionated about **what** goes in your `src/server/graphql/index.ts`, but every layer is opt-in. Pick the slice you need and ignore the rest.

| Layer                                      | Use when…                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------- |
| `createGraphqlClient`                      | You just want a `graphql-request` `GraphQLClient`.                              |
| `withRequestLogger` / `withResponseLogger` | You want structured request/error logs (Sentry, console, pino).                 |
| `withInstrumentedFetch`                    | You want DNS/TCP/TLS/TTFB phase timings per request.                            |
| `withRetryFetch`                           | You want bounded retries on transient network/upstream failures.                |
| `createApqExecutor`                        | APQ (learn-at-runtime) on `wp-graphql-smart-cache`.                             |
| `createTrustedDocumentExecutor`            | Trusted Documents (safelist) — GET-by-id only, no runtime learn.                |
| `parseGraphqlKeys`                         | You want to tag cached reads with WPGraphQL's `X-GraphQL-Keys`.                 |
| `requestTimeoutMs` / `createTimeoutFetch`  | A hung CMS must fail in bounded time, in words Sentry won't filter.             |
| `entryGraphqlKeys` / `collapseGraphqlKeys` | You tag entry reads with node keys, within Vercel's 128-tag budget.             |
| `withLastGood`                             | Serve the last good response when the CMS fails or is slow (stale-if-error).    |
| `@perimetre/graphql/wp-cache`              | Map Perimetre Core webhooks to cache tags; `/revalidate` handler; tag contract. |
| `registerTrustedDocuments`                 | Pre-register the safelist on the CMS at deploy time.                            |
| `trustedDocumentsCodegenHook`              | Register documents straight from your `codegen.ts` hooks.                       |
| `createGraphqlTanstack`                    | You want `graphqlOptions` / `graphqlMutationOptions` helpers.                   |
| `createWpGraphql`                          | You want a one-shot, batteries-included factory.                                |
| `hashOperationForWpGraphqlSmartCache`      | You want a Smart Cache-compatible hasher for codegen.                           |
| `printForWpGraphqlSmartCache`              | You want the raw `graphql-php`-compatible printer.                              |

## Installation

```bash
pnpm add @perimetre/graphql
# Optional, for the TanStack helpers
pnpm add @tanstack/react-query
```

`graphql`, `graphql-request`, and `@graphql-typed-document-node/core` ship as regular dependencies so you don't have to install them yourself. `@tanstack/react-query` is an optional peer dependency — install it only if you want the TanStack helpers.

## Tier 1 — Lean (graphql-request only)

Matches the existing setup in `perimetre-epicelk-app`.

```ts
// src/server/graphql/index.ts
import { createGraphqlClient } from '@perimetre/graphql';
import invariant from 'tiny-invariant';

invariant(
  process.env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_ENDPOINT,
  'NEXT_PUBLIC_WORDPRESS_GRAPHQL_ENDPOINT is not defined'
);

export const graphqlClient = createGraphqlClient({
  endpoint: process.env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_ENDPOINT
});
```

That's it. `graphqlClient` is a real `GraphQLClient` from `graphql-request`, so all of its existing surface (`request`, `rawRequest`, `batchRequests`…) works.

## Tier 2 — Lean + logging (no APQ)

Matches the existing setup in `stelpro-frontend`. Adds structured request/response logging without any of the persisted-query / Smart Cache machinery.

```ts
// src/server/graphql/index.ts
import { createGraphqlClient } from '@perimetre/graphql';
import {
  withRequestLogger,
  withResponseLogger
} from '@perimetre/graphql/middlewares';
import invariant from 'tiny-invariant';

invariant(
  process.env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_ENDPOINT,
  'NEXT_PUBLIC_WORDPRESS_GRAPHQL_ENDPOINT is not defined'
);

export const graphqlClient = createGraphqlClient({
  endpoint: process.env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_ENDPOINT,
  options: { errorPolicy: 'all' },
  plugins: [
    withRequestLogger({
      logger: console,
      debug: !!process.env.NEXT_PUBLIC_DEBUG_GRAPHQL
    }),
    withResponseLogger({ logger: console })
  ]
});
```

Swap `console` for `Sentry.logger`, `pino()`, or any object that implements the `GraphqlLogger` interface (`{ debug, info, warn, error }`).

## Tier 3 — TanStack helpers

Adds `graphqlOptions` / `graphqlMutationOptions` (the shape consumed by `useQuery`, `useMutation`, RSC `prefetchQuery`, etc).

```ts
// src/server/graphql/index.ts
import {
  createGraphqlClient,
  createPassthroughExecutor
} from '@perimetre/graphql';
import { createGraphqlTanstack } from '@perimetre/graphql/tanstack';

const client = createGraphqlClient({
  endpoint: process.env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_ENDPOINT!
});
const executor = createPassthroughExecutor(client);

export const graphqlClient = client;
export const { graphqlOptions, graphqlMutationOptions } = createGraphqlTanstack(
  {
    client,
    executor
  }
);
```

Then in a component:

```ts
import { useQuery } from '@tanstack/react-query';
import { graphqlOptions } from '@/server/graphql';
import { GetHomepageDocument } from '@/server/graphql/__generated__/graphql';

const { data } = useQuery({
  ...graphqlOptions(GetHomepageDocument),
  staleTime: 60_000
});
```

## Tier 4 — Full WPGraphQL Smart Cache + APQ + Sentry

Matches the `microbird-frontend` setup. APQ routes queries through `GET` so Smart Cache's network cache can serve them; mutations always use `POST`. Logger and span tracer are optional but recommended.

APQ is **opt-in** — set `apq: true` _and_ provide `persistedDocuments` to turn it on.

```ts
// src/server/graphql/index.ts
import { createWpGraphql } from '@perimetre/graphql';
import * as Sentry from '@sentry/nextjs';
import invariant from 'tiny-invariant';
import persistedDocuments from './__generated__/persisted-documents.json';

invariant(
  process.env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_ENDPOINT,
  'NEXT_PUBLIC_WORDPRESS_GRAPHQL_ENDPOINT is not defined'
);

export const {
  client: graphqlClient,
  executeGraphqlRequest,
  graphqlOptions,
  graphqlMutationOptions
} = createWpGraphql({
  endpoint: process.env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_ENDPOINT,
  apq: true, // ← opt into APQ routing
  fetch: globalThis.fetch, // pass your own wrapper if you need retries, custom headers, etc.
  persistedDocuments: persistedDocuments as Record<string, string>,
  options: { errorPolicy: 'all' },
  logger: Sentry.logger,
  debug: !!process.env.NEXT_PUBLIC_DEBUG_GRAPHQL,
  captureException: Sentry.captureException,
  startSpan: Sentry.startSpan
});
```

`createWpGraphql` slots in:

- `withRequestLogger` + `withResponseLogger` when `logger` is set;
- `withInstrumentedFetch` when (`logger` or `startSpan`) AND `fetch` is set;
- `createApqExecutor` when `apq: true` AND `persistedDocuments` AND `fetch` are all set, otherwise `createPassthroughExecutor`;
- TanStack helpers always (free with `@tanstack/react-query` already in your deps).

### APQ is opt-in, not opt-out

APQ turns on **only** when `apq: true` and `persistedDocuments` are both present. This means:

- **Want the full toolkit without APQ?** Just don't pass `apq: true`. Logging, retries, instrumented fetch, and the TanStack helpers all keep working; every operation uses the standard POST transport. You can even keep `persistedDocuments` wired (for codegen/tooling) — it's ignored by the transport unless `apq: true`.
- **Want to flip APQ off temporarily?** Set `apq: false` (or remove it) without touching your codegen setup.

### How APQ avoids the hash-mismatch round trip

WPGraphQL Smart Cache stores each persisted document under `sha256(graphql-php print(parse(query)))`. The codegen hasher in this package (`hashOperationForWpGraphqlSmartCache`) prints documents the **same way `graphql-php` does** (see [`printForWpGraphqlSmartCache`](#the-graphql-php-compatible-printer)), so the codegen-embedded `queryId` equals the server's id. The executor therefore issues an APQ **GET** first and gets a HIT on the first request — no POST-to-register, no per-cold-start re-warm, no tracking of a separate "server hash".

The only time a GET misses is when a document has **never** been registered on that server (e.g. a freshly-deployed query the CMS hasn't seen). In that case Smart Cache replies `PersistedQueryNotFound`; the executor registers it with a single POST (sending both `query` and `queryId`, so it's saved under the id you already use) and then resumes GETs — so that POST happens at most once per document per server, not once per process.

### A failed GET is not re-sent as a POST (`apqPostFallback`)

Up to 0.5, any failed APQ GET — a timeout, a network error, any non-2xx, GraphQL `errors` in the body — was re-sent as a POST. Since 0.6 the executor only does that when the failure is about the GET itself:

| GET outcome                                            | `'get-specific'` (default)                                                                             | `'any'`  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | -------- |
| `PersistedQueryNotFound`                               | register POST (client POST if that fails) — unchanged                                                  | same     |
| HTTP 414 (URL too long), 405 (GET not allowed)         | POST via the client, logs `graphql.apq.get_rejected_fallback_post`                                     | same     |
| `fetch` throws (timeout, `AbortError`, `fetch failed`) | rethrows the same error object                                                                         | POST     |
| HTTP 401 / 403 / 429 / 5xx                             | rethrows a `ClientError` (status, headers, body)                                                       | POST     |
| GraphQL `errors` in the body                           | what the POST would do: `ClientError` under `errorPolicy: 'none'`, the data under `'all'` / `'ignore'` | POST     |
| the caller's `signal` aborted                          | rethrows                                                                                               | rethrows |

**Why `'any'` amplifies an outage.** On stelpro (2026-10-28) the CMS hung and every read waited out its 15 s timeout. The executor then re-sent each timed-out GET as a POST, which waited another 15 s against the same hung server — twice the load on a CMS that was already down, twice the latency for every visitor. The POST also bypasses Smart Cache's network cache, so it can never be the cheap request. When the host's bot protection (Imunify360) started answering 403, the executor POSTed into the block too. A 5xx, a 403, a 429 or a timeout says the _server_ is in trouble; only a 414 or a 405 says the _GET_ is, and only those are fixed by switching transport. Keep `'any'` for a server whose GETs fail while its POSTs work (a proxy that mangles query strings).

```ts
createWpGraphql({ apq: true, apqPostFallback: 'get-specific' /* default */, … });
createApqExecutor({ …, postFallback: 'get-specific' });
```

Errors thrown for a received response are the same `ClientError` the client's POST throws, so `onResponse` observers and catch sites see `response.status` / `response.headers` either way. `errorResponseMeta(error)` returns `{ headers, transport }` for a thrown error (`transport: 'apq-get'` when the GET produced it); both are `undefined` when no response arrived.

Pass `{ signal }` in the per-call options to abort a request: it reaches every `fetch` the request makes, and an aborted request is never re-sent.

> **`withRetryFetch` has the same failure mode.** Its defaults retry HTTP 429 and 502/503/504 up to 4 times for every request (POSTs and mutations included), so one read against a CMS answering 503 becomes 5 requests. Transient socket errors are retried only for POST bodies starting with `query` — never the APQ GET, which has no body — and timeouts/aborts are never retried. If you wrap the CMS `fetch` with it, lower `maxRetries` (1) and `maxUpstreamWaitMs`, or leave it off the server transport and rely on the stale-if-error copy instead.

## Tier 5 — Trusted Documents (Saved Queries / safelisting)

Trusted Documents is the **safelisting** model — the same idea as [trusted documents](https://benjie.dev/graphql/trusted-documents) (Benjie Gillam / The Guild) and Apollo's `rover persisted-queries publish`. It's a **separate transport from APQ**, with a different contract:

|                         | **APQ** (Tier 4)        | **Trusted Documents** (Tier 5)                              |
| ----------------------- | ----------------------- | ----------------------------------------------------------- |
| Model                   | learn-at-runtime        | safelist-ahead-of-time                                      |
| First request for a doc | register POST, then GET | GET only (must be pre-registered)                           |
| Unknown id              | learned (POST)          | **hard error** (`TrustedDocumentNotRegisteredError`)        |
| Registration            | implicit, at runtime    | explicit, at deploy time                                    |
| Best for                | bandwidth/caching       | caching **+ security** (server runs only your authored ops) |

Both reference documents by the same `graphql-php`-compatible hash, and both ride the persisted-query GET transport. **Pick one per client** — `apq: true` and `trustedDocuments: true` together is a configuration error and throws.

### 1. Pre-register the safelist (deploy time)

Push every committed document to the CMS **once**, so the runtime never has to. `registerTrustedDocuments` does this over the network via the `createGraphqlDocument` mutation (it needs a WordPress user with the `create_posts` capability — an Application Password or JWT). It's idempotent, so it's safe to run on every deploy.

```ts
// scripts/register-trusted-documents.ts — run in CI / on deploy, after codegen
import { registerTrustedDocuments } from '@perimetre/graphql/trusted-documents';
import persistedDocuments from '../src/server/graphql/__generated__/persisted-documents.json';

const result = await registerTrustedDocuments({
  endpoint: process.env.WORDPRESS_GRAPHQL_ENDPOINT!,
  fetch: globalThis.fetch,
  headers: {
    Authorization: `Basic ${Buffer.from(
      `${process.env.WP_USER}:${process.env.WP_APP_PASSWORD}`
    ).toString('base64')}`
  },
  persistedDocuments: persistedDocuments as Record<string, string>,
  grant: 'allow' // optional: mark each as explicitly allowed in the Smart Cache allow/deny rules
});

if (result.failed > 0) {
  console.error(result.registrations.filter((r) => r.status === 'failed'));
  process.exit(1);
}
console.log(
  `safelisted ${result.created} new, ${result.skipped} already present`
);
```

`registerTrustedDocuments` returns an error-as-values summary (`{ created, skipped, failed, registrations }`) and never throws for per-document failures — you decide whether to fail the deploy.

#### Wiring it into codegen

Because `@graphql-codegen` lifecycle hooks accept **functions** (not just shell strings), you can register documents in the same step that emits them — no separate script to remember. `trustedDocumentsCodegenHook()` returns an `afterAllFileWrite` hook that finds the just-written `persisted-documents.json` and registers it. Gate it on an env flag so local/watch runs stay offline:

```ts
// codegen.ts
import { addTypenameSelectionDocumentTransform } from '@graphql-codegen/client-preset';
import {
  wpGraphqlSmartCachePresetConfig,
  trustedDocumentsCodegenHook
} from '@perimetre/graphql/codegen';

const config: CodegenConfig = {
  schema: './schema.graphql',
  documents: ['src/**/*graphql.ts'],
  generates: {
    'src/server/graphql/__generated__/': {
      documentTransforms: [addTypenameSelectionDocumentTransform],
      preset: 'client',
      presetConfig: {
        ...wpGraphqlSmartCachePresetConfig(),
        fragmentMasking: { unmaskFunctionName: 'getFragmentData' }
      }
    }
  },
  hooks: {
    afterAllFileWrite: [
      'prettier --write',
      // Only register on the runs that should touch the CMS, e.g.
      //   REGISTER_TRUSTED_DOCS=1 pnpm codegen
      ...(process.env.REGISTER_TRUSTED_DOCS
        ? [
            trustedDocumentsCodegenHook({
              endpoint: process.env.WORDPRESS_GRAPHQL_ENDPOINT!,
              fetch: globalThis.fetch,
              headers: {
                Authorization: `Basic ${Buffer.from(
                  `${process.env.WP_USER}:${process.env.WP_APP_PASSWORD}`
                ).toString('base64')}`
              },
              grant: 'allow'
            })
          ]
        : [])
    ]
  },
  overwrite: true
};

export default config;
```

This composes with the existing `prettier --write` hook. Keep the env gate — `afterAllFileWrite` fires on every run (including `codegen:watch`), and you only want to register on CI/deploy runs. A typical wiring is a `predeploy` (or CI) step that runs `REGISTER_TRUSTED_DOCS=1 pnpm codegen` against the live endpoint, while plain `pnpm codegen` / `pnpm dev` stay offline against the local schema snapshot.

> **Server-side alternative.** If you have shell access to the WordPress host, you can pre-register without GraphQL auth using WP-CLI / `wp_insert_post` against the `graphql_document` CPT (add the codegen hash as a `graphql_query_alias` term). The mutation path above is preferred for Vercel-only frontend deploys that can reach the GraphQL endpoint but not the WP filesystem.

### 2. Use the GET-only runtime executor

With documents safelisted, set `trustedDocuments: true`. Queries go out as `GET ?queryId=<hash>` and nothing else — there's no register-on-miss POST. An id the server doesn't know throws `TrustedDocumentNotRegisteredError` (your safelist is incomplete — re-run registration), rather than silently learning it.

```ts
// src/server/graphql/index.ts
import { createWpGraphql } from '@perimetre/graphql';
import * as Sentry from '@sentry/nextjs';

export const {
  client: graphqlClient,
  executeGraphqlRequest,
  graphqlOptions,
  graphqlMutationOptions
} = createWpGraphql({
  endpoint: process.env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_ENDPOINT!,
  trustedDocuments: true, // ← GET-by-id only; never learns at runtime
  fetch: globalThis.fetch,
  options: { errorPolicy: 'all' },
  logger: Sentry.logger,
  startSpan: Sentry.startSpan
});
```

Mutations and subscriptions still POST through the underlying client, exactly as with APQ. The persisted-documents map isn't needed at runtime for this transport (the executor reads `__meta__.hash` off each generated document) — it's only used by the deploy-time registrar.

## Reading response headers / `X-GraphQL-Keys`

Every executor (`createApqExecutor`, `createTrustedDocumentExecutor`, `createPassthroughExecutor`, and the `executeGraphqlRequest` that `createWpGraphql` returns) is callable as before — data only — **and** exposes `.withMeta(document, variables?, options?)`, which resolves to:

```ts
type GraphqlExecuteResult<TResult> = {
  data: TResult;
  headers: Headers; // raw fetch Response.headers of the response that produced `data`
  transport: 'apq-get' | 'apq-register-post' | 'post' | 'trusted-get';
  durationMs: number;
};
```

`headers` always belong to the **final** response: after an APQ `PersistedQueryNotFound` miss (or a 414 / 405) you get the register-POST's headers (or the fallback POST's), never the GET's that missed. Mutations and unhashed documents go through `graphql-request`'s `rawRequest`, so the POST path carries headers too. The `onResponse` hook of a `GraphqlRequestPlugin` receives the same `headers` / `transport` alongside `data` / `error` / `durationMs` (headers and transport are also reported for a thrown `ClientError` — read them with `errorResponseMeta(error)`; they're `undefined` only when the request failed before any response arrived).

The main use is tagging a Next.js `'use cache: remote'` read with what WPGraphQL says the response resolved. The Query Analyzer emits an `X-GraphQL-Keys` header — `<queryId> graphql:Query <OperationName> list:<type>… <relayId>… skipped:<type>…` — and WPGraphQL Smart Cache purges by exactly those keys. `parseGraphqlKeys` (from `@perimetre/graphql/keys`, also re-exported from the root) splits it into buckets; `lists` and `skipped` are kept in wire form (`list:post`, `skipped:post`) because those are the purge keys you tag with:

```ts
// src/server/cms/cache.ts
import { cacheLife, cacheTag } from 'next/cache';
import { parseGraphqlKeys } from '@perimetre/graphql/keys';
import { executeGraphqlRequest } from '@/server/graphql';

export async function getPage(uri: string) {
  'use cache: remote';
  cacheLife('max');
  const { data, headers } = await executeGraphqlRequest.withMeta(
    GetPageDocument,
    { uri }
  );
  const { nodeIds, lists, skipped } = parseGraphqlKeys(headers);
  cacheTag('cms', ...nodeIds, ...lists, ...skipped); // a second cacheTag call after the fetch is fine
  return data;
}
```

`skipped:<type>` appears when the header overflowed WPGraphQL's 4000-char limit (`graphql_query_analyzer_header_length_limit`): ids of that type were dropped, so tag the type-level key as a fallback. The header is only sent when the Query Analyzer is enabled on the CMS — check with `curl -I` against a persisted GET. The parser is pure, dependency-free, and never throws (a missing header yields empty buckets).

### Tagging an entry with its CMS keys: `entryGraphqlKeys` / `collapseGraphqlKeys`

Tagging a read with every raw bucket (above) has two problems in practice. `list:<type>` is emitted for every connection a document reads — a product page reading related products carries `list:product`, so the first new product expires every product page. And a route can carry at most 128 tags on Vercel (per Runtime Cache item AND per cached route response), while a rich page resolves dozens of nodes. The helpers keep what is worth tagging:

```ts
import { entryGraphqlKeys } from '@perimetre/graphql/keys';

/** Vercel allows 128 tags per route; the rest goes to hand tags, menus, settings, Next. */
const MAX_CMS_KEYS = 96;

export async function getPage(id: string) {
  'use cache: remote';
  cacheLife('max');
  cacheTag(...READ_TAGS.page(id)); // hand tags: cms, entry-<id>
  const { data, headers } = await cmsQuery.withMeta(PageByIdDocument, { id });
  cacheTag(...entryGraphqlKeys([headers], MAX_CMS_KEYS));
  return data;
}
```

- `collapseGraphqlKeys(headers[], max, { ignoreTypes?, onCollapse? })` — the node ids and `skipped:<kind>` markers of every response of one read, deduplicated; query id, root, operation and `list:*` keys dropped. Past `max`, the overflow collapses into WPGraphQL's own `skipped:<kind>` keys (one per kind), which Smart Cache purges on any change of that kind — a collapsed read is flushed more often, never less. Keep `max` above what an entry resolves: `skipped:post` is purged by every post save.
- `entryGraphqlKeys(headers[], max, options?)` — the same, or `GRAPHQL_UNKNOWN_DEPENDENCIES` (`['skipped:post', 'skipped:term']`) when no response named a node. That happens on a Smart Cache object-cache hit ("Use Object Cache" answers without running the resolvers, so the analyzer sees nothing); an entry tagged with nothing would miss every change to what it embeds. Tagged with the fallback it goes stale on the next post/term save, and the refill runs the resolvers and gets real keys — self-healing. **Use it for entries only** (a page, a product): a listing, a menu or global settings would collapse into `skipped:post` and be flushed by every post save; tag those with what they list (`type-*`, `index-*`, `menu-*`).
- `ignoreTypes` drops the type-level nodes (`post_type:<name>`, `taxonomy:<name>`) and `skipped:<name>` markers of post types / taxonomies the frontend doesn't render (e.g. `graphql_document`, which every APQ registration publishes). Individual posts and terms are `post:<id>` / `term:<id>` whatever their type, so the webhook side (`createInvalidation`) ignores the purge keys of an unrendered type instead.
- `hasGraphqlNodeKeys(headers)`, `decodeRelayId(key)` — the predicates the above use.

`parseGraphqlKeys` also reads WPGraphQL 2.x's `operation:<Name>` token as the operation (it used to land in `nodeIds`).

## Bring-your-own-fetch

**The package never calls Node's global `fetch` on its own.** That's deliberate: every project ends up wanting some combination of retries, observability wrapping, custom headers, abort-signal plumbing, or buyer-injection on the transport layer, and the cleanest way to support all of those is to make the consumer pass the `fetch` they want used.

| API                             | `fetch` requirement                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `createGraphqlClient`           | Optional. If not provided, graphql-request uses its own built-in fetch.                                        |
| `withInstrumentedFetch`         | Required — it wraps whatever you pass.                                                                         |
| `withRetryFetch`                | Required — it wraps whatever you pass.                                                                         |
| `createTimeoutFetch`            | Required — it wraps whatever you pass.                                                                         |
| `createApqExecutor`             | Required — APQ makes raw POST/GET calls outside graphql-request.                                               |
| `createTrustedDocumentExecutor` | Required — makes raw GET calls outside graphql-request.                                                        |
| `registerTrustedDocuments`      | Required — pushes register mutations to the CMS.                                                               |
| `createWpGraphql`               | Required when `apq` / `trustedDocuments` / `requestTimeoutMs` / `logger` / `startSpan` are set; else optional. |

Pass `globalThis.fetch` if you're happy with the built-in. Compose freely:

```ts
import {
  createRetryFetch,
  createInstrumentedFetch
} from '@perimetre/graphql/middlewares';

const fetchImpl = createInstrumentedFetch({
  fetch: createRetryFetch({
    fetch: globalThis.fetch,
    maxRetries: 4,
    logger: Sentry.logger
  }),
  logger: Sentry.logger,
  startSpan: Sentry.startSpan
});
```

## Custom middlewares

Every layer in `createWpGraphql` is just a plugin under the hood. Add your own to the `plugins` array — they run **before** the built-in observability plugins, so your headers, auth, buyer injection, etc., are always seen by the loggers:

```ts
import { createWpGraphql, type GraphqlClientPlugin } from '@perimetre/graphql';

const withAuth =
  (token: string): GraphqlClientPlugin =>
  () => ({
    headers: { Authorization: `Bearer ${token}` }
  });

export const { client } = createWpGraphql({
  endpoint: process.env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_ENDPOINT!,
  plugins: [withAuth(process.env.WP_AUTH_TOKEN!)],
  logger: Sentry.logger
});
```

Available plugin slots:

- `headers` — merged with any prior headers (later wins on key conflicts).
- `fetch` — sets the `fetch` graphql-request uses (later plugin wins). The package never calls `fetch` on its own; see "Bring-your-own-fetch" below.
- `requestMiddleware` — chained left-to-right; each receives the previous result.
- `responseMiddleware` — chained left-to-right; both run for every response.
- Plus any other `GraphQLClient` option (e.g. `errorPolicy`, `excludeOperationName`).

## Retry on transient failures

`withRetryFetch` adds bounded retries for transient network errors (idempotent queries only), HTTP 429 throttling, and HTTP 502/503/504 from edge proxies. Useful when the upstream is flaky (Shopify storefront API, WordPress behind a busy CDN).

**Mind the outage case.** 429 and 502/503/504 are retried for _every_ request — mutations included (a 504 may come back after the server executed it) — up to `maxRetries` (4) times: against a CMS that is failing, one read becomes five requests. It never retries a timeout or an abort. For a WordPress server transport, prefer `maxRetries: 1` with a short `maxUpstreamWaitMs`, plus the stale-if-error copy; see [`apqPostFallback`](#a-failed-get-is-not-re-sent-as-a-post-apqpostfallback).

```ts
import { createGraphqlClient } from '@perimetre/graphql';
import { withRetryFetch } from '@perimetre/graphql/middlewares';

const client = createGraphqlClient({
  endpoint,
  plugins: [
    withRetryFetch({
      fetch: globalThis.fetch,
      maxRetries: 4,
      logger: Sentry.logger
    })
  ]
});
```

Order matters: place `withRetryFetch` **before** `withInstrumentedFetch` to measure each attempt individually; place it **after** to measure end-to-end including retries.

## Request timeout (server)

A CMS that is down fails fast. A CMS that is overloaded or hung never answers, and every read waits out the platform's own limit (Next's 50 s `'use cache'` fill) before the render fails. `requestTimeoutMs` puts a hard limit on every request a `createWpGraphql` bundle sends — the persisted-query GET, the register POST and the client POST:

```ts
import { PHASE_PRODUCTION_BUILD } from 'next/constants';

export const { executeGraphqlRequest } = createWpGraphql({
  apq: true,
  endpoint,
  fetch: globalThis.fetch,
  persistedDocuments,
  requestTimeoutMs: 15_000,
  requestTimeout: {
    // No limit during `next build`: the build's burst can queue on the CMS,
    // there is no stale copy to serve there, and a failed read fails the build.
    enabled: () => process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD,
    messagePrefix: 'CMS request' // default
  }
});
```

- **Its own words.** On expiry the request rejects with a `RequestTimeoutError` reading `CMS request timed out after 15000ms (no response)`. The platform's "The operation was aborted due to timeout" matches the cancelled-request patterns Sentry filters usually drop, which would hide a CMS that stopped answering.
- **Composed with the caller's signal** (`AbortSignal.any`). A caller abort still rejects with the caller's abort error, and is never re-sent over another transport (see `apqPostFallback`).
- **Server-only.** In a browser (`window` defined) requests go out unchanged.
- **`enabled`** is evaluated per request.
- The limit covers the wait for the response. A body still streaming at expiry rejects with the platform's abort error.
- Pick it well under the platform limit and generous enough for a cold heavy query. Reads with a stale copy should not wait this long — see `withLastGood` — so this limit is for reads that have no copy and for the background refresh.

The same wrapper is available on its own: `createTimeoutFetch({ fetch, timeoutMs, enabled?, messagePrefix? })` and the plugin `withRequestTimeout(…)` from `@perimetre/graphql/middlewares`.

## Stale-if-error: `withLastGood`

`'use cache'` has no stale-if-error. A flushed, expired, evicted or previous-deployment entry is discarded before the function runs, so if the CMS throws on that miss (an expired certificate, a WAF 403, a timeout) nothing is left to serve. `withLastGood` wraps an executor (the data call and `.withMeta`) and keeps a copy of every successful query response in a store you inject. When the CMS fails, or is too slow, a read is answered from that copy.

```ts
// src/server/cms/cache.ts (Next.js on Vercel)
import { withLastGood } from '@perimetre/graphql/last-good';
import { getCache, waitUntil } from '@vercel/functions';
import { cacheLife } from 'next/cache';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import { createHash } from 'node:crypto';

export const cmsQuery = withLastGood(executeGraphqlRequest, {
  // The Vercel Runtime Cache: shared by every instance, survives deploys, and
  // carries no tags, so no `revalidateTag` ever reaches a copy.
  store: getCache({
    namespace: 'cms-last-good',
    // The default key hash is 32-bit: a collision serves one page on another's URL.
    keyHashFunction: (key) => createHash('sha256').update(key).digest('hex')
  }),
  defer: waitUntil, // writes never block the read
  enabled: () => process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD,
  onFallback: ({ reason, operationName, error }) => {
    // Lower the scope's life so the copy isn't pinned; the next visit retries.
    try {
      cacheLife({ revalidate: 60 });
    } catch {
      // Not inside a 'use cache' scope.
    }
    Sentry.logger.warn(`cms.stale_on_${reason}`, { operationName });
  }
});
```

What it does:

- **Stores** every successful hashed query response, keyed by persisted-query hash + operation + stable-stringified variables. Codegen's hash covers the whole document, so a deploy that changes a query's selection never meets a copy of the old shape. It skips empty answers (`isEmptyAnswer`, default: no data, or every root field `null`), skips copies over `maxBytes` (default 1.9 MB, because Vercel's Runtime Cache silently drops items over 2 MB), and writes through `defer`, so the read never waits on the store.
- **A failure**, with a copy: answers from the copy (`stale: true` on `.withMeta`) and calls `onFallback({ reason: 'error' })`. With no copy, the original error is rethrown unchanged. A response with no `data` at all counts as a failure.
- **A slow CMS**: when a copy exists, the live request races a soft deadline, `softTimeoutMs` (3000). For `slowWindowMs` (30 s) after this wrapper saw a failure or a missed deadline, the deadline drops to `slowSoftTimeoutMs` (500). Past the deadline the copy answers (`reason: 'slow'`) and the live request finishes in the background to refresh it. With **no** copy the read awaits the live request: there is nothing else to serve, and the hard limit is `requestTimeoutMs`.
- **Object-cache hits keep their keys.** A WPGraphQL Smart Cache object-cache hit's `X-GraphQL-Keys` names no node, so it is lent the keys stored with the last response that did. A keyed read doesn't lose its tags.
- **Off when `enabled()` is false** (e.g. during `next build`, where no copy is served and the Runtime Cache build client only times out).
- `clock` is injectable for tests.

**Deliberately no circuit breaker.** A breaker is modal: while it's open, every read _without_ a copy fails instead of waiting, and closing it adds recovery time (AWS Builders' Library, "Timeouts, retries and backoff with jitter"). The soft deadline only changes how long a read _with_ a copy waits, and every read still asks the CMS. Because the fallback runs whenever the CMS is merely slow, it gets exercised all the time instead of being discovered broken during an outage ("Avoiding fallback in distributed systems"). Load on a sick CMS stays bounded without a breaker: only cache misses read it, and a scope answered from a copy retries on its shortened life.

**Readers must let errors throw** out of their cached scope. With a copy, the reader never sees the error. Without one, a `catch { return null }` would cache the failure as content for the scope's whole life.

**Not Next.js-specific.** The package never imports Next.js or Vercel. Everything platform-specific is injected: any `{ get, set }` works as the store, `defer` is optional, and `onFallback` is where your framework's cache hint goes. For example, a React Router or Astro server with Redis:

```ts
const cmsQuery = withLastGood(executeGraphqlRequest, {
  store: {
    get: async (key) => JSON.parse((await redis.get(`cms:${key}`)) ?? 'null'),
    set: (key, value, { ttl }) =>
      redis.set(`cms:${key}`, JSON.stringify(value), { EX: ttl })
  },
  onFallback: ({ reason }) => log.warn(`cms.stale_on_${reason}`)
  // Shorten the HTTP cache of a response served stale here, e.g. by setting a
  // flag your loader turns into `Cache-Control: max-age=60`.
});
```

## CMS-coupled invalidation: `@perimetre/graphql/wp-cache`

Tag every cached read with the CMS things it depends on (an entry id, a post type, a taxonomy, a term, a menu location, an options page), never with a frontend path. The Perimetre Core webhook reports what changed in the CMS's own terms, and `createInvalidation` turns that into the same tag strings. A new listing or block needs no new webhook branch: it tags what it reads, and every save of that thing reaches it. Entry reads also carry WPGraphQL's node keys (`entryGraphqlKeys`), and the webhook relays the keys Smart Cache purged, so a change to anything an entry _embeds_ reaches it too.

Each project keeps only its content model, its read tags and its custom events:

```ts
// src/server/cms/tags.ts — the only per-project file
import { createInvalidation, WP_CACHE_TAGS } from '@perimetre/graphql/wp-cache';

export const CMS_TAGS = {
  ...WP_CACHE_TAGS, // cms, entry-<id>, index-<type>, menu-<loc>, options-<page>, taxonomy-<tax>, term-<tax>-<slug>, type-<type>
  form: (id: number | string) => `form-${String(id)}`
};

export const CONTENT_MODEL = {
  types: ['page', 'product', 'document'], // post types the site renders
  taxonomies: ['product_category', 'document_type'],
  menuLocations: ['primary', 'footer'],
  optionsPage: 'stelpro-us-global-settings' // its save also flushes Yoast (options-seo)
  // graphqlSingleNames: { news: 'newsArticle' } when list:<name> differs from the type
};

export const READ_TAGS = {
  page: (id: number) => [CMS_TAGS.all, CMS_TAGS.entry(id)],
  pageIndex: [CMS_TAGS.all, CMS_TAGS.index('page')],
  primaryMenu: [CMS_TAGS.all, CMS_TAGS.menu('primary')]
  // …one row per cached read
} as const;

export const resolveInvalidation = createInvalidation({
  contentModel: CONTENT_MODEL,
  extraEvents: {
    'form.*': ({ raw }) => ({
      tags: raw.form_id ? [CMS_TAGS.form(String(raw.form_id))] : []
    })
  },
  // Optional: entries whose dependents the payload doesn't name.
  lookUpDependents: (payload) =>
    payload.postType === 'document' && !payload.embedders?.length
});
```

`resolveInvalidation(body)` returns `{ event, expire, stale, saved? }`:

- **`expire`**: whatever the change names: the entry, its translations / descendants / embedders, its type, the terms it has or just lost, the node keys Smart Cache purged (posts and terms), menus, options. Flush these with an immediate expiry so the editor's **first** reload is fresh.
- **`stale`**: the catch-all `cms`, `skipped:*` markers, and every tag of a broad flush (an import, an event the mapping doesn't model). Flush these stale-while-revalidate: a site-wide flush serves one stale response per entry instead of a blocking CMS miss for every visitor.
- The **index** (`index-<type>`) is flushed only by events that move a URL (publish, unpublish, trash, delete, or an `old_permalink`). Every route resolves its URL through it, and one product save used to expire 203 of 285 routes. The **taxonomy** (`taxonomy-<tax>`) is flushed only when term membership changed.
- A post type the site doesn't render flushes only its own type/index tags, and its purge keys are ignored (they carry `skipped:post`; every APQ registration publishes a `graphql_document`).
- `options.saved` ignores its `purge_all` (Core purges all of Smart Cache before every options save, because options have no node). An unknown event flushes `cms`, stale. A flush is never empty.

The `/revalidate` handler takes a Web `Request` and flushes nothing itself, so the same code serves Next.js, React Router actions and Astro endpoints:

```ts
// src/app/revalidate/route.ts (Next.js)
import { createRevalidateHandler } from '@perimetre/graphql/wp-cache';
import { revalidateTag } from 'next/cache';

const handle = createRevalidateHandler({
  invalidate: resolveInvalidation,
  secret: () => process.env.REVALIDATION_SECRET, // Authorization: Bearer <secret>, compared in constant time
  dependents: async (saved) => (await listDependents(saved)).map(CMS_TAGS.entry) // optional
});

export async function POST(request: Request) {
  const { body, expire, stale, status } = await handle(request);
  expire.forEach((tag) => revalidateTag(tag, { expire: 0 }));
  stale.forEach((tag) => revalidateTag(tag, 'max'));
  return Response.json(body, { status });
}
```

No `revalidatePath`: a tag flush already expires the HTML of every route that rendered the tagged data. A path flush's implicit tag also discards every _other_ scope read on that path, which means re-reading menus, footer and settings from the CMS.

**Test the contract.** `post(fields)` builds a Core 2.4.0 `post.*` body, and `assertTagContract(resolveInvalidation, rows)` checks that every read × every change that alters it shares an **expired** tag, and that every read carries the catch-all. Add a row per new read:

```ts
import { assertTagContract, post } from '@perimetre/graphql/wp-cache';

test('tag contract', () => {
  assertTagContract(resolveInvalidation, [
    ['page', READ_TAGS.page(30), [post({ post_id: 30, post_type: 'page' })]],
    [
      'page index',
      READ_TAGS.pageIndex,
      [post({ event: 'post.trashed', post_id: 30, post_type: 'page' })]
    ],
    ['primary menu', READ_TAGS.primaryMenu, [{ event: 'menu.saved' }]]
  ]);
});
```

### Cache life: `'max'`, no time floor

Tag CMS reads `cacheLife('max')`. A CMS read changes when the CMS says so, never on a timer. **Never put a time floor on scopes that every route renders** (menus, settings, SEO globals). On stelpro (2026-10-28) an hourly floor on every CMS read took the CMS down an hour after each deploy:

- The shortest `revalidate` on a route wins, and every route renders the layout's reads, so all ~290 prerendered routes went stale at the same minute, one hour after `next build`.
- `'use cache: remote'` entries are keyed by deployment, so they were written at build time and expired **with** the routes. Each route's background revalidation missed every scope it renders.
- One visitor's link prefetches fired 25+ revalidations in a second. The CMS hung (15 s timeouts), the APQ executor re-sent each timeout as a POST (fixed in 0.6, see `apqPostFallback`), and Imunify360 started answering 403.

A jittered or longer floor only moves the herd. Changes reach the site through webhooks instead. In WordPress → Settings → Perimetre Core → Watched Events, turn on **"GraphQL Cache Purged"** (term, media, user and menu-location changes, which reach entries through their node keys) and **"Draft"** (unpublishing). Yoast's own screens send nothing; re-saving the site settings page pushes Yoast changes. Stale-if-error (`withLastGood`) covers the CMS failing on a refill.

## Codegen setup

Two pieces:

1. A Smart Cache–compatible hasher (`hashOperationForWpGraphqlSmartCache`) — produces the same sha256 the server computes for a saved document, so `queryId=<codegenHash>` resolves at runtime.
2. A preset-config helper (`wpGraphqlSmartCachePresetConfig`) you spread into your `@graphql-codegen/client-preset` setup.

```ts
// codegen.ts
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import type { CodegenConfig } from '@graphql-codegen/cli';
import { addTypenameSelectionDocumentTransform } from '@graphql-codegen/client-preset';
import { wpGraphqlSmartCachePresetConfig } from '@perimetre/graphql/codegen';
import invariant from 'tiny-invariant';

invariant(
  process.env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_ENDPOINT,
  'NEXT_PUBLIC_WORDPRESS_GRAPHQL_ENDPOINT is required'
);

const config: CodegenConfig = {
  schema: {
    [process.env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_ENDPOINT]: { headers: {} }
  },
  documents: ['src/**/*graphql.ts'],
  generates: {
    './graphql.schema.json': { plugins: ['introspection'] },
    './schema.graphql': { plugins: ['schema-ast'] },
    'src/server/graphql/__generated__/': {
      documentTransforms: [addTypenameSelectionDocumentTransform],
      preset: 'client',
      presetConfig: {
        ...wpGraphqlSmartCachePresetConfig(),
        fragmentMasking: { unmaskFunctionName: 'getFragmentData' }
      }
    }
  },
  hooks: { afterAllFileWrite: ['prettier --write'] },
  overwrite: true
};

export default config;
```

Drop `wpGraphqlSmartCachePresetConfig()` if you're not using Smart Cache — the rest of the codegen output stays the same.

Don't forget to commit `__generated__/persisted-documents.json` so APQ has the query strings to fall back on (used for the one-off register POST if a document was never registered on the server). Add this to `tsconfig.json` so the JSON import resolves:

```json
{
  "compilerOptions": {
    "resolveJsonModule": true
  }
}
```

### The graphql-php-compatible printer

`hashOperationForWpGraphqlSmartCache` is `sha256(printForWpGraphqlSmartCache(parse(operation)))`. The interesting part is the printer: WPGraphQL Smart Cache derives a saved document's id from the **server-side** print, `sha256(graphql-php print(parse(query)))`. `graphql-js`'s own `print()` is _almost_ identical but diverges in two places for executable documents, which is enough to change the sha256 and make the client hash miss the server's lookup:

1. **Object values** — `graphql-js` prints `{a: b}`; `graphql-php` prints `{ a: b }` (spaces inside the braces).
2. **Trailing newline** — `graphql-php` appends a single `\n` to the whole document; `graphql-js` does not.

`printForWpGraphqlSmartCache` re-implements the executable subset of the AST and matches `graphql-php` on exactly those two productions (everything else — indentation, the `argsLine.length > 80` argument wrapping, lists, directives, fragments — is already byte-identical between the two printers). It also does **not** reorder definitions: the server normalizes the document string in the order it receives it, so reordering (e.g. operations-first) would re-introduce a mismatch for any multi-fragment document.

You normally don't call it directly — `wpGraphqlSmartCachePresetConfig()` wires it into codegen for you — but it's exported from `@perimetre/graphql/print` (and `/codegen`) if you need the raw printer.

## Subpath exports

| Import path                            | Exports                                                                                                                                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@perimetre/graphql`                   | `createGraphqlClient`, `createWpGraphql`, `createPassthroughExecutor`, `createApqExecutor`, `createTrustedDocumentExecutor`, `registerTrustedDocuments`, `TrustedDocumentNotRegisteredError`, types    |
| `@perimetre/graphql/middlewares`       | `withRequestLogger`, `withResponseLogger`, `withInstrumentedFetch`, `withRetryFetch`, `withRequestTimeout`, `createInstrumentedFetch`, `createRetryFetch`, `createTimeoutFetch`, `RequestTimeoutError` |
| `@perimetre/graphql/tanstack`          | `createGraphqlTanstack`                                                                                                                                                                                |
| `@perimetre/graphql/apq`               | `createApqExecutor`, `createPassthroughExecutor`, `errorResponseMeta`                                                                                                                                  |
| `@perimetre/graphql/trusted-documents` | `createTrustedDocumentExecutor`, `registerTrustedDocuments`, `TrustedDocumentNotRegisteredError`                                                                                                       |
| `@perimetre/graphql/codegen`           | `hashOperationForWpGraphqlSmartCache`, `wpGraphqlSmartCachePresetConfig`, `printForWpGraphqlSmartCache`, `trustedDocumentsCodegenHook`                                                                 |
| `@perimetre/graphql/keys`              | `parseGraphqlKeys`, `collapseGraphqlKeys`, `entryGraphqlKeys`, `hasGraphqlNodeKeys`, `decodeRelayId`, `GRAPHQL_UNKNOWN_DEPENDENCIES`, `GRAPHQL_KEYS_HEADER`                                            |
| `@perimetre/graphql/print`             | `printForWpGraphqlSmartCache`                                                                                                                                                                          |
| `@perimetre/graphql/last-good`         | `withLastGood`, `isEmptyGraphqlAnswer`, `stableStringify`, types                                                                                                                                       |
| `@perimetre/graphql/wp-cache`          | `createInvalidation`, `createRevalidateHandler`, `parseWebhookPayload`, `WP_CACHE_TAGS`, `assertTagContract`, `post`, `wpRelayId`, types                                                               |

The `tanstack` subpath is the only one that pulls in `@tanstack/react-query`. Server-only modules can import everything else without dragging the React tree in. The `apq`, `trusted-documents`, `keys`, `last-good`, `wp-cache` and `print` subpaths are pure (no `node:` builtins) and run anywhere; the `codegen` subpath imports `node:crypto` + `node:fs/promises` (Node-only — it's for your `codegen.ts` / deploy scripts).

## Logger interface

Anything implementing `{ debug, info, warn, error }` with `(message: string, attrs?: Record<string, unknown>) => void` signatures works. That covers:

- `Sentry.logger` from `@sentry/nextjs` / `@sentry/node`;
- `console`;
- `pino()`;
- any custom wrapper your project already has (e.g. our `fancyLog`).

```ts
import type { GraphqlLogger } from '@perimetre/graphql';

const projectLogger: GraphqlLogger = {
  debug: (m, attrs) => fancyLog('log', m, LOG_COLOR.gray, attrs),
  info: (m, attrs) => fancyLog('log', m, LOG_COLOR.green, attrs),
  warn: (m, attrs) => fancyLog('log', m, LOG_COLOR.yellow, attrs),
  error: (m, attrs) => fancyLog('error', m, LOG_COLOR.red, attrs)
};
```

## Migrating from copy-paste

Roughly:

1. `npm i @perimetre/graphql`.
2. Replace your hand-rolled `new GraphQLClient(...)` with `createGraphqlClient` (or `createWpGraphql` for Smart Cache projects).
3. Replace your `graphqlOptions` / `graphqlMutationOptions` helpers with what `createGraphqlTanstack` (or `createWpGraphql`) returns.
4. Replace your `executeGraphqlRequest` (if any) with the one returned by `createWpGraphql` or built via `createApqExecutor`.
5. Replace your codegen `hashAlgorithm` with `hashOperationForWpGraphqlSmartCache` (or just spread `wpGraphqlSmartCachePresetConfig()`).
6. Delete the old files.

The public shape (`graphqlClient.request(...)`, `useQuery({ ...graphqlOptions(Doc) })`, etc.) stays identical, so call-sites don't need to change.
