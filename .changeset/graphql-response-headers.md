---
'@perimetre/graphql': minor
---

Expose response headers to callers, and add a `parseGraphqlKeys` helper for WPGraphQL's `X-GraphQL-Keys`.

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
