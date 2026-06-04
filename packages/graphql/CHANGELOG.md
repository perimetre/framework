# @perimetre/graphql

## 0.2.0

### Minor Changes

- 9d3573d: Fix APQ hash mismatch with WPGraphQL Smart Cache, and make APQ opt-in.

  **The mismatch.** WPGraphQL Smart Cache stores each persisted document under `sha256(graphql-php Printer::doPrint(parse(query)))`. The old codegen hasher hashed `graphql-js`'s `print()` output and reordered operations ahead of fragments, so the codegen `queryId` never matched the server's id. The runtime worked around this by POSTing to register on every cold start and reading the server-assigned hash from the `x-graphql-query-id` response header before it could serve APQ GETs.

  **The fix.** New `printForWpGraphqlSmartCache` (exported from `@perimetre/graphql/print` and `/codegen`) reproduces `graphql-php`'s printer byte-for-byte for executable documents — the only divergences from `graphql-js` are object-value brace spacing (`{ a: b }` vs `{a: b}`) and a trailing newline — and it no longer reorders definitions. `hashOperationForWpGraphqlSmartCache` now uses it, so the codegen-embedded `queryId` equals the server's id. Verified against a live WPGraphQL Smart Cache endpoint: 13/13 persisted documents match the `x-graphql-query-id` the server reports.
  - **APQ executor** now does GET-first, POST-fallback: it issues an APQ GET on the first request (a HIT, since the hashes match) and only registers via a single POST when the server reports `PersistedQueryNotFound` (a document never registered on that server). All `x-graphql-query-id` / server-hash tracking is removed.
  - **APQ is now opt-in.** `createWpGraphql` enables APQ only when `apq: true` _and_ `persistedDocuments` are both set. The full toolkit (logging, retries, instrumented fetch, TanStack helpers) works with or without APQ; `persistedDocuments` alone no longer flips the transport.

  **Migration.** Add `apq: true` to your `createWpGraphql` call to keep APQ on, and re-run codegen so `persisted-documents.json` and the embedded `__meta__.hash` values are regenerated with the new hasher. (Hashes change; the persisted-documents map is keyed by the new hash. No call-site changes.)

- 9d3573d: Add Trusted Documents (Saved Queries / safelisting) as a transport separate from APQ.

  Where APQ learns documents at runtime (register-on-miss POST), Trusted Documents safelists every document on the CMS **ahead of time** and the runtime only ever issues GET-by-id — an unknown id is a hard error, never learned. This is the GraphQL "trusted documents" pattern (Benjie Gillam / The Guild; Apollo's analog is `rover persisted-queries publish`), and it adds a security property on top of the caching one: the server executes only operations your developers authored and shipped.
  - **`registerTrustedDocuments`** (`@perimetre/graphql/trusted-documents`) — deploy-time registrar. Pushes each `hash → query` from `persisted-documents.json` to the CMS via the `createGraphqlDocument` mutation (needs a WP user with `create_posts`; pass an Application Password / JWT via `headers`). Idempotent (re-registering an existing doc is a `skipped`, not a failure), returns an error-as-values summary, and never throws for per-document failures.
  - **`trustedDocumentsCodegenHook`** (`@perimetre/graphql/codegen`) — an `afterAllFileWrite` lifecycle-hook factory for `@graphql-codegen`. Drop it into your `codegen.ts` `hooks` (gated on an env flag) to register the safelist in the same step that emits it — no separate deploy script required.
  - **`createTrustedDocumentExecutor`** (`@perimetre/graphql/trusted-documents`) — runtime executor. Sends queries as `GET ?queryId=<hash>` and nothing else; a `PersistedQueryNotFound` response throws `TrustedDocumentNotRegisteredError` instead of registering. Mutations/subscriptions/unhashed queries POST through the underlying client. Transport blips fall back to a POST; a missing-from-safelist id always throws.
  - **`createWpGraphql`** gains `trustedDocuments?: boolean`. It's mutually exclusive with `apq` (enabling both throws) and requires `fetch`. The two transports are deliberately distinct paths.

  The runtime executor and registrar are pure (no `node:` builtins), so `@perimetre/graphql/trusted-documents` is safe to import from client/Edge bundles; the codegen hook stays on the Node-only `/codegen` subpath since it reads the emitted file.

  Validated live against a WPGraphQL Smart Cache endpoint: pre-registered documents resolve GET-only by id, and an unknown id throws `TrustedDocumentNotRegisteredError` with no POST issued.

## 0.1.2

### Patch Changes

- 8b18ff7: Drop the `node:diagnostics_channel` dependency so the package bundles for the browser/Edge.

  The instrumented-fetch middleware statically imported `node:diagnostics_channel` at the top of `middlewares.ts` to capture undici per-phase fetch timings (DNS/connect/TLS/TTFB). Because `index.ts` re-exports a value from that module, any consumer that touched `@perimetre/graphql` — even through a `'use client'` chain that only needs `graphqlOptions` — pulled the Node builtin into the client/Edge graph. Turbopack rejects this with `the chunking context (unknown) does not support external modules (request: node:diagnostics_channel)`, failing the build.

  The undici diagnostic-channel instrumentation has been removed entirely: it was purely observability (it fed extra Sentry span attributes and timing logs) and nothing depended on it. `createInstrumentedFetch` still records coarse, runtime-agnostic timings — `fetchMs` (request settle) and `bodyReadMs` (body drain) — and still opens the `graphql.fetch` Sentry span. The per-phase fields (`beforeConnectMs`, `connectMs`, `sendHeadersMs`, `serverProcessingMs`, `headersToTtfbMs`, `reusedConnection`) are gone from `GraphqlFetchTimings`. `node:diagnostics_channel` was also removed from the tsdown `external` list.

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
