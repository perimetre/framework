---
'@perimetre/graphql': minor
---

Fix APQ hash mismatch with WPGraphQL Smart Cache, and make APQ opt-in.

**The mismatch.** WPGraphQL Smart Cache stores each persisted document under `sha256(graphql-php Printer::doPrint(parse(query)))`. The old codegen hasher hashed `graphql-js`'s `print()` output and reordered operations ahead of fragments, so the codegen `queryId` never matched the server's id. The runtime worked around this by POSTing to register on every cold start and reading the server-assigned hash from the `x-graphql-query-id` response header before it could serve APQ GETs.

**The fix.** New `printForWpGraphqlSmartCache` (exported from `@perimetre/graphql/print` and `/codegen`) reproduces `graphql-php`'s printer byte-for-byte for executable documents — the only divergences from `graphql-js` are object-value brace spacing (`{ a: b }` vs `{a: b}`) and a trailing newline — and it no longer reorders definitions. `hashOperationForWpGraphqlSmartCache` now uses it, so the codegen-embedded `queryId` equals the server's id. Verified against a live WPGraphQL Smart Cache endpoint: 13/13 persisted documents match the `x-graphql-query-id` the server reports.

- **APQ executor** now does GET-first, POST-fallback: it issues an APQ GET on the first request (a HIT, since the hashes match) and only registers via a single POST when the server reports `PersistedQueryNotFound` (a document never registered on that server). All `x-graphql-query-id` / server-hash tracking is removed.
- **APQ is now opt-in.** `createWpGraphql` enables APQ only when `apq: true` _and_ `persistedDocuments` are both set. The full toolkit (logging, retries, instrumented fetch, TanStack helpers) works with or without APQ; `persistedDocuments` alone no longer flips the transport.

**Migration.** Add `apq: true` to your `createWpGraphql` call to keep APQ on, and re-run codegen so `persisted-documents.json` and the embedded `__meta__.hash` values are regenerated with the new hasher. (Hashes change; the persisted-documents map is keyed by the new hash. No call-site changes.)
