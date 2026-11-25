---
'@perimetre/eslint-config-base': minor
'@perimetre/eslint-config-nextjs': minor
---

Enforce more of the app-best-practices conventions: banned and deprecated imports (next/link outside NavLink, unstable_cache, Radix and other behaviour layers, framer-motion, forwardRef, the deprecated @perimetre packages, reaching into a server domain), `{ ok: false }` returns, disabled certificate checks, `'use cache'` without `cacheLife`, cached failures in server adapters, import cycles, bare disable comments, `middleware.ts`, and unsafe type assertions as a warning. Exceptions go through the exported `restrictedImports()` helper
