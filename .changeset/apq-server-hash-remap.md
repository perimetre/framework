---
'@perimetre/graphql': patch
---

Fix APQ GETs returning `PersistedQueryNotFound` when graphql-js's `print()` and graphql-php's `Printer::doPrint()` disagree on document normalization. `createApqExecutor` now reads the server-assigned hash from the `x-graphql-query-id` response header on the register POST and uses it for subsequent APQ GETs. On `PersistedQueryNotFound`, the executor re-registers via POST and resumes GETs against the new server hash, instead of permanently falling back to uncached POSTs.
