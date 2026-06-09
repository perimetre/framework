---
'@perimetre/graphql': minor
---

Add a per-request `edgeCache` option for the persisted-query GET transport.

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
