# @perimetre/graphql

## 0.1.1

### Patch Changes

- fdb6853: Fix APQ GETs returning `PersistedQueryNotFound` when graphql-js's `print()` and graphql-php's `Printer::doPrint()` disagree on document normalization. `createApqExecutor` now reads the server-assigned hash from the `x-graphql-query-id` response header on the register POST and uses it for subsequent APQ GETs. On `PersistedQueryNotFound`, the executor re-registers via POST and resumes GETs against the new server hash, instead of permanently falling back to uncached POSTs.

## 0.1.0

### Minor Changes

- e4c5cbc: Introduce `@perimetre/graphql`: a reusable GraphQL client toolkit for Perimetre WPGraphQL projects.

  Bundles the patterns we copy-paste across `microbird-frontend`, `stelpro-frontend`, `sprig-dental`, and `perimetre-epicelk-app` into one tiered, middleware-composable package. Every layer is opt-in; pick the slice your project needs.

  **Surface**
  - `createGraphqlClient({ endpoint, options, plugins })` — bare `graphql-request` client with optional plugin composition (headers merge, fetch wrap, request/response middleware chain).
  - `createWpGraphql({ endpoint, fetch?, persistedDocuments?, logger?, startSpan?, captureException?, plugins? })` — batteries-included one-shot factory. Each layer (logging, fetch timings, APQ routing, TanStack helpers) lights up only when the corresponding option is passed.
  - Subpath wildcard exports (`@perimetre/graphql/<name>`) cover every module under `src/` — no `package.json` edit needed when adding new files.

  **Modules (all importable as `@perimetre/graphql/<name>`)**
  - `./middlewares` — `withRequestLogger`, `withResponseLogger`, `withInstrumentedFetch`, `withRetryFetch`, plus their non-plugin `create*Fetch` factories.
    - Logger interface is structural (`{ debug, info, warn, error }`) so it matches `Sentry.logger`, `console`, `pino`, etc.
    - Instrumented fetch records DNS/TCP/TLS/TTFB phase timings via `node:diagnostics_channel` and emits Sentry spans when a `startSpan` tracer is passed.
    - Retry fetch handles transient socket errors (idempotent queries only), HTTP 429, and HTTP 502/503/504 with exponential backoff + `Retry-After`.
  - `./apq` — `createApqExecutor` for the WPGraphQL Smart Cache APQ flow (first-hit POST-to-register, subsequent-hit GET via `queryId`; fallback to standard POST on `PersistedQueryNotFound` or transport failures). `createPassthroughExecutor` for projects without APQ.
  - `./tanstack` — `createGraphqlTanstack({ client, executor, startSpan? })` returns `graphqlOptions` / `graphqlMutationOptions` matching the helper shapes already in use across reference projects.
  - `./codegen` — `hashOperationForWpGraphqlSmartCache` (sha256 hasher byte-compatible with WPGraphQL Smart Cache's `graphql-php` printer) and `wpGraphqlSmartCachePresetConfig()` (drop-in `presetConfig` spread for `@graphql-codegen/client-preset`).

  **Design notes**
  - The package never calls Node's global `fetch` on its own. Every module that needs `fetch` takes it as a parameter so consumers retain full control over retries, instrumentation, custom headers, abort-signal plumbing, etc.
  - `graphql`, `graphql-request`, and `@graphql-typed-document-node/core` ship as regular `dependencies` so consumers only need to `pnpm add @perimetre/graphql` (plus `@tanstack/react-query` if they want the TanStack helpers — kept as an optional peer dependency).
  - Flat `src/` layout with no barrel files; `tsdown` uses a wildcard entry (`./src/*.ts`) paired with the wildcard `./*` package.json export so adding a module is a single-file drop.
