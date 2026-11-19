---
'@perimetre/graphql': minor
---

Add an opt-in limit on concurrent CMS requests: `createWpGraphql({ maxConcurrentRequests, concurrencyLimit })`, and `createConcurrencyLimitFetch` / `withConcurrencyLimit` from `@perimetre/graphql/middlewares`. At most that many requests are in flight at once per process (shared across Next.js bundles by endpoint); the rest wait in line, inside the caller's signal and `requestTimeoutMs`. Unset: no limit, nothing wrapped. Read it from an env var such as `CMS_MAX_CONCURRENCY`, unset or empty meaning off. Ported from oiq-placepourtoi's CMS transport, where it kept a prefetch herd at 4 requests in flight instead of 17–18.
