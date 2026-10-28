# @perimetre/graphql

## 0.6.0

### Minor Changes

- 492c8a3: Centralize the WPGraphQL transport and cache code that stelpro, oiq and cima each carried a copy of, and fix the APQ fallback that amplified the stelpro outage of 2026-10-28.

  **⚠️ Behaviour change: the persisted-query executors (APQ and Trusted Documents) no longer re-send every failed GET as a POST.** `createApqExecutor` (and `createWpGraphql({ apq: true })`) now falls back to POST only when the server refuses the request _as a GET_: HTTP 414 or 405. A timeout, an abort, a network error, 401/403/429/5xx and GraphQL `errors` in the body are rethrown, with no POST. The old behaviour doubled the load on a hung CMS, made every read wait out its timeout twice, bypassed Smart Cache's network cache, and kept POSTing into a WAF that was already answering 403. `PersistedQueryNotFound` still registers the document with one POST. Pass `apqPostFallback: 'any'` to restore the old behaviour. `createTrustedDocumentExecutor` (`trustedDocuments: true`) follows the same rule: a 414/405 is re-sent as a POST **by id** (no document text), and anything else is rethrown. Pass `trustedDocumentsPostFallback: 'any'` to restore its old behaviour.

  ### Changes
  - **fix: APQ falls back to POST only for GET-specific failures.**
    - New option `apqPostFallback: 'get-specific' | 'any'` on `createWpGraphql`, and `postFallback` on `createApqExecutor`.
    - A non-2xx or GraphQL-errors GET now throws the same graphql-request `ClientError` the client's POST throws (status, headers, body), and honours the client's `errorPolicy` the way the POST did.
    - Errors thrown by `fetch` keep their identity.
    - New per-call option `signal`: it reaches every `fetch` a request makes, and an aborted request is never re-sent.
    - New `errorResponseMeta(error)` returns `{ headers, transport }` of a thrown error. `onResponse` now reports `transport` for errors too.
    - The `createRetryFetch` docs now warn that its 429/5xx retries amplify an outage the same way. Its defaults are unchanged.
    - Log names: `graphql.apq.transport_failed` gains `status` and `fallback`. GraphQL errors log `graphql.apq.errors`; `graphql.apq.errors_fallback_post` remains only under `'any'`. A 414/405 logs `graphql.apq.get_rejected_fallback_post`.
  - **fix: Trusted Documents re-send only GET-specific failures, by id.**
    - New option `trustedDocumentsPostFallback: 'get-specific' | 'any'` on `createWpGraphql`, and `postFallback` on `createTrustedDocumentExecutor`.
    - A 414/405 is re-sent as `POST { queryId, operationName, variables }` with no document text (new transport `'trusted-post'`). WPGraphQL Smart Cache resolves and authorizes it exactly like the GET. Sending `query` with `queryId` would register the document at runtime, which the safelist forbids.
    - GraphQL errors (e.g. "This query document has been blocked.") throw a `ClientError` built from the GET body and honour `errorPolicy`, with no second request. Timeouts, network errors and 401/403/429/5xx are rethrown.
    - Log names: `graphql.trusted.transport_failed` gains `status` and `fallback`. A 414/405 logs `graphql.trusted.get_rejected_post_by_id`. `graphql.trusted.errors_fallback_post` is logged only under `'any'`.
    - Shared types and helpers: `PostFallback` (`ApqPostFallback` is now an alias), `GET_REJECTED_STATUSES`, `persistedQueryClientError`.
  - **feat: server request timeout.** `createWpGraphql({ requestTimeoutMs, requestTimeout: { enabled?, messagePrefix? } })` puts a hard limit on every request the bundle sends, composed with the caller's signal. On expiry it rejects with a `RequestTimeoutError`: `CMS request timed out after <ms>ms (no response)`. The platform's abort message would match Sentry's cancelled-request filters and hide a hung CMS. A caller abort still rejects as an abort. Server-only. `enabled()` is evaluated per request, so you can skip the limit during `next build`. Also exported as `createTimeoutFetch` / `withRequestTimeout`.
  - **feat: keys helpers** in `@perimetre/graphql/keys`:
    - `collapseGraphqlKeys(headers[], max, { ignoreTypes?, onCollapse? })`, `entryGraphqlKeys(headers[], max)`, `GRAPHQL_UNKNOWN_DEPENDENCIES` (`skipped:post`, `skipped:term`), `hasGraphqlNodeKeys()` and `decodeRelayId()`.
    - `parseGraphqlKeys` now reads WPGraphQL 2.x's `operation:<Name>` token as the operation instead of filing it under `nodeIds`.
  - **feat: `withLastGood`** (`@perimetre/graphql/last-good`), stale-if-error for an executor. It stores every successful query response in an injected `{ get, set }` store (untagged; keyed by hash + operation + variables; writes go through `defer`; empty and oversized answers are skipped). When the CMS fails, or misses the soft deadline (3 s, or 500 ms for 30 s after a failure), the read is answered from the copy, `onFallback` is called, and the live request refreshes the copy in the background. With no copy, the read awaits the live request. There is deliberately no circuit breaker. Keys from the stored copy are lent to Smart Cache object-cache hits. `.withMeta` results carry `stale`.
  - **feat: `@perimetre/graphql/wp-cache`**, the CMS-coupled invalidation kit:
    - `createInvalidation({ contentModel, tags?, extraEvents?, lookUpDependents? })` maps a Perimetre Core ≥ 2.4.0 webhook to `{ event, expire, stale, saved? }`.
    - `createRevalidateHandler({ invalidate, secret, dependents? })` takes a Web `Request` and returns `{ status, body, expire, stale }`, checking the secret in constant time. The caller runs `revalidateTag`.
    - Also exported: `parseWebhookPayload`, `WP_CACHE_TAGS`, and the test helpers `post()`, `wpRelayId()` and `assertTagContract()`.

  The package still imports no Next.js or Vercel code. `cacheLife`, `waitUntil`, the Runtime Cache, `revalidateTag` and Sentry are all passed in by the caller, so the same code works under React Router or Astro.

  ### Migration guide

  #### Upgrading any project from 0.5.x to 0.6.0

  Nothing else changes without opting in. Everything new is additive (`requestTimeoutMs`, the keys helpers, `withLastGood`, `@perimetre/graphql/wp-cache`), and the only behaviour change is the GET fallback.
  1. **Bump** `@perimetre/graphql` to `^0.6.0`. No peer dependency changes.
  2. **APQ (`apq: true`)**: the new default needs no code change. If a deployment's GETs fail where its POSTs work (a proxy that mangles query strings), set `apqPostFallback: 'any'`.
  3. **Trusted Documents (`trustedDocuments: true`)**: the new default needs no code change. A 414/405 now POSTs by id. Set `trustedDocumentsPostFallback: 'any'` only if you relied on the full-text POST rescuing other failures. That also only works when the endpoint accepts arbitrary operations, which a safelist shouldn't.
  4. **Catch sites** that relied on the POST rescuing a failed GET now receive the GET's error. A non-2xx or GraphQL-errors GET is a graphql-request `ClientError` with `response.status`, `response.headers` and `response.body`. Use `errorResponseMeta(error)` for `{ headers, transport }`.
  5. **Exhaustive `switch`es on `GraphqlTransport`** need a `'trusted-post'` case.
  6. **Logs and alerts**: move alerts on `graphql.apq.errors_fallback_post` / `graphql.trusted.errors` + POST to `graphql.apq.errors`, `graphql.apq.transport_failed`, `graphql.trusted.errors`, `graphql.trusted.transport_failed` (both now carry `status` and `fallback`), and the new `graphql.apq.get_rejected_fallback_post` / `graphql.trusted.get_rejected_post_by_id`.
  7. **`withRetryFetch` on a CMS transport**: its defaults (4 retries on 429/502/503/504) amplify an outage. Consider `maxRetries: 1` plus `withLastGood`.

  The project-specific steps below remove the local copies this release replaces.

  **microbird-frontend (`^0.4.0`), sprig-dental (`^0.1.0`)**: steps 1–7 only. Their changelogs between their versions and 0.5 also apply (see the entries below).

  **stelpro-frontend.** Delete:
  - `src/server/cms/last-good.ts`
  - `src/server/cms/keys.ts` and `keys.test.ts`
  - `src/server/cms/revalidation.ts`
  - the timeout half of `noStoreFetch` in `src/server/graphql/index.ts`

  Then:
  - `src/server/graphql/index.ts`: make `noStoreFetch` only force `cache: 'no-store'`, and pass `requestTimeoutMs: 15_000` (or `CMS_REQUEST_TIMEOUT_MS`) with `requestTimeout: { enabled: () => process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD }`. The browser is already skipped by the package. The preview client keeps its untimed fetch.
  - `src/server/cms/cache.ts`: `cmsQuery = withLastGood(executeGraphqlRequest, { store: getCache({ namespace: 'cms-last-good', keyHashFunction: sha256 }), defer: waitUntil, enabled: () => !isBuild(), softTimeoutMs: Number(process.env.CMS_SOFT_TIMEOUT_MS) || 3000, onFallback })`. In `onFallback`, call `cacheLife({ revalidate: 60 })` inside a try/catch and log `cms.stale_on_${reason}`. `queryWithKeys` tags with `entryGraphqlKeys([headers], MAX_CMS_KEYS)`.
  - `src/server/cms/tags.ts` stays: `CMS_TAGS = { ...WP_CACHE_TAGS, form }`, plus `CONTENT_MODEL`, `READ_TAGS` and `MAX_CMS_KEYS`. Add `resolveInvalidation = createInvalidation({ contentModel, extraEvents: { 'form.*': … }, lookUpDependents: (p) => p.postType === 'document' && !p.embedders?.length })`.
  - `src/app/revalidate/route.ts` becomes `createRevalidateHandler({ invalidate: resolveInvalidation, secret: () => process.env.REVALIDATION_SECRET, dependents: async (saved) => (await listDependents(saved)).map(CMS_TAGS.entry) })` plus the two `revalidateTag` loops. `dependents.ts` stays.
  - `revalidation.test.ts` keeps only the project's own cases. Its contract becomes `assertTagContract(resolveInvalidation, rows)`. The package runs stelpro's full suite against this configuration.

  **oiq-placepourtoi-frontend.** Delete:
  - `src/server/graphql/last-good.ts` and `last-good.test.ts`
  - `src/server/cms/keys.ts` and `keys.test.ts`
  - `src/server/cms/revalidation.ts`
  - the timeout code in `src/server/graphql/index.ts`: `cmsRequestTimeoutMs` and the `AbortSignal` wrapping

  Then:
  - `src/server/graphql/index.ts` passes `requestTimeoutMs` / `requestTimeout` and exports `executeGraphqlRequest = withLastGood(executeLiveGraphqlRequest, { … })`, wired as for stelpro, with oiq's logger in `onFallback`.
  - `src/server/cms/cache.ts` uses `entryGraphqlKeys([headers], MAX_CMS_KEYS)` in place of `entryKeys`.
  - `src/server/cms/tags.ts` adds `resolveInvalidation = createInvalidation({ contentModel: CONTENT_MODEL })`. oiq has no form or dependents events. `CONTENT_MODEL` lists `activite`, `genie`, `page`, `video` and the taxonomies from its `LIST_KEY_TAGS`. Add `graphqlSingleNames` for any `list:` key that isn't the type name without underscores.
  - `src/app/revalidate/route.ts` uses `createRevalidateHandler`.

  **cima-site (`apps/frontend`).** Delete:
  - `src/server/cms/wordpress/graphql/last-good.ts` and `last-good.test.ts`
  - the timeout code in `src/server/cms/wordpress/graphql/client.ts`
  - `toCmsKeys`, `kindOf` and `UNKNOWN_DEPENDENCIES` in `src/server/cms/wordpress/keys.ts`; `keyedReader` stays and calls `collapseGraphqlKeys` / `GRAPHQL_UNKNOWN_DEPENDENCIES`
  - the payload schema, `LIST_KEY_TAGS`, `movesInIndex`, `changesTermMembership` and `purgedTags` in `src/server/cms/wordpress/revalidation.ts`

  Then:
  - `client.ts` passes `requestTimeoutMs` / `requestTimeout`. `executeGraphqlRequest = withLastGood(executeLiveGraphqlRequest, { store, defer: waitUntil, enabled, isEmptyAnswer: (data) => !isComplete(data) })`, which keeps cima's stricter "never store a `null` root" rule. `cache.ts` keeps reading `.withMeta(...).stale`.
  - `revalidation.ts` keeps only cima's adapter. It calls `createInvalidation({ contentModel: { types: [...RENDERED_TYPES], taxonomies, graphqlSingleNames: { news: 'newsArticle' }, optionsPage: 'cima-site-options' }, lookUpDependents })`, maps `expire` / `stale` onto cima's `Invalidation` (`tags`, `wide`, `broad`), and adds its locale `paths` from `parseWebhookPayload(body)`'s `permalink` / `oldPermalink` / `language`.

  **Stale-if-error store keys changed.** Keys now include the operation name, so copies written by the project-local `last-good.ts` aren't read after the switch. The store fills again on the first successful read of each query; the old entries expire on their TTL.

  **Cache life.** Keep CMS reads on `cacheLife('max')` with no time floor, and turn on the "GraphQL Cache Purged" and "Draft" watched events in Perimetre Core. See the README section "Cache life: `'max'`, no time floor".

## 0.5.0

### Minor Changes

- 0f0a08b: Expose response headers to callers, and add a `parseGraphqlKeys` helper for WPGraphQL's `X-GraphQL-Keys`.
  - Every executor (`createApqExecutor`, `createTrustedDocumentExecutor`, `createPassthroughExecutor`, and `createWpGraphql().executeGraphqlRequest`) now also exposes `.withMeta(document, variables?, options?)`, resolving to `{ data, headers, transport, durationMs }`. `headers` are the raw fetch `Response.headers` of the response that produced `data` — after an APQ miss that is the register POST's (or the fallback POST's), never the GET's that missed. The plain call is unchanged and still resolves to `data` only. New `GraphqlExecutor` type (`ExecuteGraphqlRequest & { withMeta }`); `ExecuteGraphqlRequest` itself is unchanged, so custom executors keep compiling.
  - `GraphqlRequestPlugin.onResponse` now receives `headers` and `transport` next to `data` / `error` / `durationMs` (typed as `GraphqlResponseOutcome`). `headers` are also recovered from a thrown graphql-request `ClientError`; they are `undefined` only when no response arrived.
  - The POST paths (mutations, unhashed documents, every fallback, the passthrough executor) now go through `client.rawRequest` so they carry headers too. Same middlewares and `errorPolicy` as `client.request`.
  - New `@perimetre/graphql/keys` subpath (also re-exported from the root): `parseGraphqlKeys(headers | string)` → `{ nodeIds, lists, skipped, operation?, queryId?, root? }`, pure and unit-tested. `lists` / `skipped` are kept in wire form (`list:post`, `skipped:post`) since those are the keys WPGraphQL Smart Cache purges by.
  - Internals shared by the executors are exported for custom transports: `createExecutor`, `postViaClient`, `GraphqlTransportArgs`, `GraphqlTransportResult`, `GraphqlTransport`, `GraphqlResponseMeta`, `GraphqlExecuteResult`, `ExecuteGraphqlRequestWithMeta`.

  ```ts
  // a Next.js 'use cache: remote' reader tagged with what the CMS resolved
  const { data, headers } = await executeGraphqlRequest.withMeta(
    GetPageDocument,
    { uri }
  );
  const { nodeIds, lists, skipped } = parseGraphqlKeys(headers);
  cacheTag('cms', ...nodeIds, ...lists, ...skipped);
  ```

## 0.4.0

### Minor Changes

- e86e97e: Add per-request transport plugins (`requestPlugins`) with `onRequest` / `onResponse` hooks.

  `createWpGraphql` now accepts a `requestPlugins: GraphqlRequestPlugin[]` array. Unlike `plugins` (which configure the `graphql-request` POST client once, at construction), these run on **every request** and operate at the transport-hint layer — the one layer a `graphql-request` `requestMiddleware` can't reach, because the APQ / Trusted Documents executors issue their cacheable GET via a raw `fetch` that bypasses `client.request` entirely.
  - **New `GraphqlRequestPlugin` type** (exported from `@perimetre/graphql` and `/apq`):

    ```ts
    type GraphqlRequestPlugin = {
      // before the request — shape the transport options (e.g. inject edgeCache)
      onRequest?: (
        context: GraphqlRequestContext,
        options: GraphqlRequestOptions
      ) => GraphqlRequestOptions | undefined;
      // after it settles — observe outcome + timing
      onResponse?: (
        context: GraphqlRequestContext,
        result: { data?: unknown; durationMs: number; error?: unknown }
      ) => void;
    };
    ```

    `onRequest` hooks run left-to-right, each receiving the previous one's output; the caller's own per-call `options` are the chain's initial input, so a plugin supplying a _default_ leaves an already-set field untouched. `onResponse` is observation-only — its return value is ignored and a throw is swallowed so it can't mask the real result.

    ```ts
    createWpGraphql({
      apq: true,
      persistedDocuments,
      fetch,
      requestPlugins: [
        {
          // edge-cache every request during the static build, but never at runtime
          onRequest: (ctx, opts) =>
            isBuild && opts.edgeCache == null
              ? { ...opts, edgeCache: 3600 }
              : opts,
          onResponse: (ctx, { durationMs }) =>
            logger.info('graphql.timing', { op: ctx.operationName, durationMs })
        }
      ]
    });
    ```

  - **New exports** alongside the type: `GraphqlRequestContext` (`{ hash?, operationKind, operationName }` — read-only operation metadata, never the GraphQL inputs), plus the helpers `contextFromDocument`, `resolveRequestOptions`, and `notifyResponse` for callers composing their own executors.
  - **`onRequest` is folded into the TanStack `queryKey`.** `graphqlOptions` resolves the plugin chain to compute the effective `edgeCache` and keys on _that_, so the same operation cached under different resolved TTLs (e.g. build vs runtime) doesn't collide. The executor re-resolves and runs the hooks for real, so `onRequest` **must be pure** (it can run more than once per logical request).
  - Threaded into the APQ executor, the Trusted Documents executor, and the TanStack helper. The passthrough POST executor ignores `requestPlugins` (POSTs aren't edge-cached and have no GET URL to shape).

  **Migration.** None — `requestPlugins` is optional and omitting it leaves every existing call path byte-identical.

## 0.3.0

### Minor Changes

- 3ef73ea: Add a per-request `edgeCache` option for the persisted-query GET transport.

  The server now honours an `?edgeCache=<seconds>` query var: when present, it responds with a matching `Cache-Control: max-age` so the request becomes cacheable at the edge for that long. Without the var, responses stay uncacheable (the global default is `max-age=0`), so opting in is per-call. This release lets callers opt a single query into that edge cache. A query var (not a header) is used because it's guaranteed to reach PHP and is part of the edge cache key, so opted-in and plain requests never collide.
  - **New `GraphqlRequestOptions` type** (`{ edgeCache?: number }`), exported from `@perimetre/graphql` and `/apq`. It's a transport hint, not a GraphQL input.
  - **`graphqlOptions` accepts a third `options` argument** (after `variables`). Pass `{ edgeCache }` to add the `edgeCache` param to the request URL:

    ```ts
    // with variables — options is the third argument
    useQuery(graphqlOptions(GetPostDocument, { slug }, { edgeCache: 300 }));
    // no variables — pass `undefined` in the variables slot
    useQuery(graphqlOptions(GetHomepageDocument, undefined, { edgeCache: 60 }));
    ```

    `edgeCache` is folded into the TanStack `queryKey`, so the same operation cached under different TTLs doesn't collide client-side. Callers that don't pass it hash to the same key as before.

  - **APQ and Trusted Documents executors** append the `edgeCache` param to the persisted-query GET URL (and, for APQ, to the register-on-miss POST), so the server sets `Cache-Control` on the cacheable response. The TTL only takes effect on the GET transport — it's ignored for mutations, subscriptions, unhashed documents, and the passthrough POST transport, none of which are edge-cached.
  - The TTL must be a non-negative **integer** number of seconds; anything else (fractional, negative, non-finite) is dropped. The var is part of the edge cache key, so it's normalized to keep `{ edgeCache: 300 }` from fragmenting into separate `300` / `300.0` entries (shared `applyEdgeCacheParam` helper, also exported).

  **Migration.** None — `edgeCache` is opt-in and the existing `graphqlOptions(doc)` / `graphqlOptions(doc, variables)` call shapes are unchanged.

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
