---
'@perimetre/graphql': minor
---

Centralize the WPGraphQL transport and cache code that stelpro, oiq and cima each carried a copy of, and fix the APQ fallback that amplified the stelpro outage of 2026-10-28.

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
