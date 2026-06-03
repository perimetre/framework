---
'@perimetre/graphql': patch
---

Drop the `node:diagnostics_channel` dependency so the package bundles for the browser/Edge.

The instrumented-fetch middleware statically imported `node:diagnostics_channel` at the top of `middlewares.ts` to capture undici per-phase fetch timings (DNS/connect/TLS/TTFB). Because `index.ts` re-exports a value from that module, any consumer that touched `@perimetre/graphql` — even through a `'use client'` chain that only needs `graphqlOptions` — pulled the Node builtin into the client/Edge graph. Turbopack rejects this with `the chunking context (unknown) does not support external modules (request: node:diagnostics_channel)`, failing the build.

The undici diagnostic-channel instrumentation has been removed entirely: it was purely observability (it fed extra Sentry span attributes and timing logs) and nothing depended on it. `createInstrumentedFetch` still records coarse, runtime-agnostic timings — `fetchMs` (request settle) and `bodyReadMs` (body drain) — and still opens the `graphql.fetch` Sentry span. The per-phase fields (`beforeConnectMs`, `connectMs`, `sendHeadersMs`, `serverProcessingMs`, `headersToTtfbMs`, `reusedConnection`) are gone from `GraphqlFetchTimings`. `node:diagnostics_channel` was also removed from the tsdown `external` list.
