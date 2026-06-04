# @perimetre/graphql

Reusable GraphQL client toolkit for Perimetre projects (primarily WPGraphQL / WordPress headless). Bundles the `graphql-request` setup, TanStack Query bindings, WPGraphQL Smart Cache APQ routing, and codegen helpers that we use across every project — minus the copy-paste.

APQ is **opt-in** (`apq: true`) and built around a `graphql-php`-compatible hasher, so the codegen hash matches the id WPGraphQL Smart Cache stores the document under — queries hit the cacheable GET path on the first request with **no POST-to-register round trip**. Every other layer (logging, retries, instrumented fetch, TanStack helpers) works with or without APQ.

## What's in the box

The package is opinionated about **what** goes in your `src/server/graphql/index.ts`, but every layer is opt-in. Pick the slice you need and ignore the rest.

| Layer                                      | Use when…                                                        |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `createGraphqlClient`                      | You just want a `graphql-request` `GraphQLClient`.               |
| `withRequestLogger` / `withResponseLogger` | You want structured request/error logs (Sentry, console, pino).  |
| `withInstrumentedFetch`                    | You want DNS/TCP/TLS/TTFB phase timings per request.             |
| `withRetryFetch`                           | You want bounded retries on transient network/upstream failures. |
| `createApqExecutor`                        | APQ (learn-at-runtime) on `wp-graphql-smart-cache`.              |
| `createTrustedDocumentExecutor`            | Trusted Documents (safelist) — GET-by-id only, no runtime learn. |
| `registerTrustedDocuments`                 | Pre-register the safelist on the CMS at deploy time.             |
| `trustedDocumentsCodegenHook`              | Register documents straight from your `codegen.ts` hooks.        |
| `createGraphqlTanstack`                    | You want `graphqlOptions` / `graphqlMutationOptions` helpers.    |
| `createWpGraphql`                          | You want a one-shot, batteries-included factory.                 |
| `hashOperationForWpGraphqlSmartCache`      | You want a Smart Cache-compatible hasher for codegen.            |
| `printForWpGraphqlSmartCache`              | You want the raw `graphql-php`-compatible printer.               |

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

## Bring-your-own-fetch

**The package never calls Node's global `fetch` on its own.** That's deliberate: every project ends up wanting some combination of retries, observability wrapping, custom headers, abort-signal plumbing, or buyer-injection on the transport layer, and the cleanest way to support all of those is to make the consumer pass the `fetch` they want used.

| API                             | `fetch` requirement                                                                                   |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `createGraphqlClient`           | Optional. If not provided, graphql-request uses its own built-in fetch.                               |
| `withInstrumentedFetch`         | Required — it wraps whatever you pass.                                                                |
| `withRetryFetch`                | Required — it wraps whatever you pass.                                                                |
| `createApqExecutor`             | Required — APQ makes raw POST/GET calls outside graphql-request.                                      |
| `createTrustedDocumentExecutor` | Required — makes raw GET calls outside graphql-request.                                               |
| `registerTrustedDocuments`      | Required — pushes register mutations to the CMS.                                                      |
| `createWpGraphql`               | Required when `apq: true` / `trustedDocuments: true` / `logger` / `startSpan` are set; else optional. |

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

| Import path                            | Exports                                                                                                                                                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@perimetre/graphql`                   | `createGraphqlClient`, `createWpGraphql`, `createPassthroughExecutor`, `createApqExecutor`, `createTrustedDocumentExecutor`, `registerTrustedDocuments`, `TrustedDocumentNotRegisteredError`, types |
| `@perimetre/graphql/middlewares`       | `withRequestLogger`, `withResponseLogger`, `withInstrumentedFetch`, `withRetryFetch`, `createInstrumentedFetch`, `createRetryFetch`                                                                 |
| `@perimetre/graphql/tanstack`          | `createGraphqlTanstack`                                                                                                                                                                             |
| `@perimetre/graphql/apq`               | `createApqExecutor`, `createPassthroughExecutor`                                                                                                                                                    |
| `@perimetre/graphql/trusted-documents` | `createTrustedDocumentExecutor`, `registerTrustedDocuments`, `TrustedDocumentNotRegisteredError`                                                                                                    |
| `@perimetre/graphql/codegen`           | `hashOperationForWpGraphqlSmartCache`, `wpGraphqlSmartCachePresetConfig`, `printForWpGraphqlSmartCache`, `trustedDocumentsCodegenHook`                                                              |
| `@perimetre/graphql/print`             | `printForWpGraphqlSmartCache`                                                                                                                                                                       |

The `tanstack` subpath is the only one that pulls in `@tanstack/react-query`. Server-only modules can import everything else without dragging the React tree in. The `apq`, `trusted-documents`, and `print` subpaths are pure (no `node:` builtins) and run anywhere; the `codegen` subpath imports `node:crypto` + `node:fs/promises` (Node-only — it's for your `codegen.ts` / deploy scripts).

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
