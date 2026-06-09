---
'@perimetre/graphql': minor
---

Add per-request transport plugins (`requestPlugins`) with `onRequest` / `onResponse` hooks.

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
