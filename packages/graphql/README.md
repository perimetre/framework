# @perimetre/graphql

Reusable GraphQL client toolkit for Perimetre projects (primarily WPGraphQL / WordPress headless). Bundles the `graphql-request` setup, TanStack Query bindings, WPGraphQL Smart Cache APQ routing, and codegen helpers that we use across every project — minus the copy-paste.

## What's in the box

The package is opinionated about **what** goes in your `src/server/graphql/index.ts`, but every layer is opt-in. Pick the slice you need and ignore the rest.

| Layer                                      | Use when…                                                        |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `createGraphqlClient`                      | You just want a `graphql-request` `GraphQLClient`.               |
| `withRequestLogger` / `withResponseLogger` | You want structured request/error logs (Sentry, console, pino).  |
| `withInstrumentedFetch`                    | You want DNS/TCP/TLS/TTFB phase timings per request.             |
| `withRetryFetch`                           | You want bounded retries on transient network/upstream failures. |
| `createApqExecutor`                        | You're on `wp-graphql-smart-cache` + persisted documents.        |
| `createGraphqlTanstack`                    | You want `graphqlOptions` / `graphqlMutationOptions` helpers.    |
| `createWpGraphql`                          | You want a one-shot, batteries-included factory.                 |
| `hashOperationForWpGraphqlSmartCache`      | You want a Smart Cache-compatible hasher for codegen.            |

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
- `createApqExecutor` when `persistedDocuments` AND `fetch` are set, otherwise `createPassthroughExecutor`;
- TanStack helpers always (free with `@tanstack/react-query` already in your deps).

Disable APQ at any time by removing the `persistedDocuments` field — the rest of the setup keeps working.

## Bring-your-own-fetch

**The package never calls Node's global `fetch` on its own.** That's deliberate: every project ends up wanting some combination of retries, observability wrapping, custom headers, abort-signal plumbing, or buyer-injection on the transport layer, and the cleanest way to support all of those is to make the consumer pass the `fetch` they want used.

| API                     | `fetch` requirement                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `createGraphqlClient`   | Optional. If not provided, graphql-request uses its own built-in fetch.             |
| `withInstrumentedFetch` | Required — it wraps whatever you pass.                                              |
| `withRetryFetch`        | Required — it wraps whatever you pass.                                              |
| `createApqExecutor`     | Required — APQ makes raw POST/GET calls outside graphql-request.                    |
| `createWpGraphql`       | Required when `persistedDocuments` / `logger` / `startSpan` are set; else optional. |

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

Don't forget to commit `__generated__/persisted-documents.json` so APQ has hashes to register against at runtime. Add this to `tsconfig.json` so the JSON import resolves:

```json
{
  "compilerOptions": {
    "resolveJsonModule": true
  }
}
```

## Subpath exports

| Import path                      | Exports                                                                                                                             |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `@perimetre/graphql`             | `createGraphqlClient`, `createWpGraphql`, `createPassthroughExecutor`, `createApqExecutor`, types                                   |
| `@perimetre/graphql/middlewares` | `withRequestLogger`, `withResponseLogger`, `withInstrumentedFetch`, `withRetryFetch`, `createInstrumentedFetch`, `createRetryFetch` |
| `@perimetre/graphql/tanstack`    | `createGraphqlTanstack`                                                                                                             |
| `@perimetre/graphql/apq`         | `createApqExecutor`, `createPassthroughExecutor`                                                                                    |
| `@perimetre/graphql/codegen`     | `hashOperationForWpGraphqlSmartCache`, `wpGraphqlSmartCachePresetConfig`                                                            |

The `tanstack` subpath is the only one that pulls in `@tanstack/react-query`. Server-only modules can import everything else without dragging the React tree in.

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
