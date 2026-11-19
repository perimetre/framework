---
'@perimetre/graphql': minor
---

`edgeCache` now expires on time behind Cloudways' Varnish. A positive `edgeCache=N` also sends `edgeWindow=floor(now / N)` (N capped at 3600, as Perimetre Core caps it). Varnish on Cloudways ignores the `s-maxage` Perimetre Core sends and keeps each copy for the server's Cache Lifetime (default 30 days), so search could serve week-old results and a build could reuse an earlier build's reads. Varnish keys copies by full URL, so each window gets its own entry: every request in a window shares one copy and the next window reads fresh. `edgeCache=0` and requests without `edgeCache` are unchanged. New exports: `EDGE_WINDOW_PARAM`, `EDGE_CACHE_MAX_TTL`; `applyEdgeCacheParam` takes an optional clock. Also set the server's Varnish Cache Lifetime to its 4-hour minimum as a backstop.
