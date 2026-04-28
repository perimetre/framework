---
'@perimetre/ui': patch
---

Fix brand registry losing the active brand during the client-component SSR
pass. The previous `cache()`-based ref only worked inside React Server
Component renders, so when Next.js SSR'd a client component (e.g.
`FieldCheckboxRadio`), `getActiveBrand()` returned the default brand and
the SSR'd HTML used acorn variants while the client hydration used the
real brand. This produced hydration mismatches like
`pui:size-4` (server) vs `pui:size-4.5` (client) on Sprig checkboxes.

The registry now uses `AsyncLocalStorage` on the server, which propagates
through the entire request — RSC render, client component SSR, and any
`await` in between — while remaining concurrency-safe across simultaneous
requests. Public API (`setActiveBrand`/`getActiveBrand`/`getBrandVariant`)
is unchanged.
