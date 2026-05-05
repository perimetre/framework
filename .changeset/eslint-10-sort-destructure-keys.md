---
'@perimetre/eslint-config-base': patch
---

Bump `eslint-plugin-sort-destructure-keys` from `^2.0.0` to `^3.0.0`. v2 calls `context.getSourceCode()`, an API removed in ESLint 10, causing a `TypeError: context.getSourceCode is not a function` crash on every lint run. v3 uses `context.sourceCode` and declares `eslint: "5 - 10"`.
