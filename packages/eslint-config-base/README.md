# @perimetre/eslint-config-base

The ESLint rules every Périmètre TypeScript project shares: typescript-eslint's strict type-checked rules, JSDoc on functions, sorted keys and types, Playwright rules for tests, and the [app-best-practices](https://github.com/perimetre/ai-toolkit) conventions a linter can check.

## Quick start

**Starting a project?** Use the [ai-toolkit](https://github.com/perimetre/ai-toolkit) project setup. It installs this config and the others the project needs, with Prettier and lint-staged.

**Adding it to a project yourself?** Copy this prompt into your agent, in the project:

```text
Set up @perimetre/eslint-config-base in this TypeScript project.

1. Check that .npmrc has `@perimetre:registry=https://npm.pkg.github.com`. If it
   doesn't, or the install is refused, stop and ask me.
2. Install @perimetre/eslint-config-base and eslint as dev dependencies with the
   project's package manager. Add the configs that match the project:
   @perimetre/eslint-config-react for React, @perimetre/eslint-config-nextjs
   for Next.js, @perimetre/eslint-config-trpc for tRPC and
   @perimetre/eslint-config-graphql for GraphQL documents. If a release-age
   policy blocks the install, stop and ask me instead of changing it.
3. Write eslint.config.mjs, replacing any older ESLint config: spread `base`
   first, then react, nextjs, graphql and trpc in that order, then `end` from
   @perimetre/eslint-config-base/end last. The react config needs
   `{ plugins: { 'jsx-a11y': jsxA11y } }` from eslint-plugin-jsx-a11y before
   it. Set parserOptions `projectService: true` and `tsconfigRootDir:
   import.meta.dirname`.
4. Add "lint": "eslint . --max-warnings 0" to package.json.
5. Add a note to AGENTS.md/CLAUDE.md, creating it if needed: lint rules come
   from @perimetre/eslint-config-*. The project's own import bans go in
   @typescript-eslint/no-restricted-imports; the shared ones use the core
   no-restricted-imports rule. To let a file use an import the shared list
   bans, set the core rule for that file with restrictedImports() from
   @perimetre/eslint-config-base (JSDoc in
   node_modules/@perimetre/eslint-config-base/restrictions.mjs).
6. Run the lint script and show me what it reports. Don't fix anything yet.
```

## What it checks beyond typescript-eslint

- Banned imports: `next/link` outside NavLink, `unstable_cache`, Radix and other behaviour libraries, `framer-motion`, `forwardRef`, the deprecated `@perimetre` packages, and a server domain's internal files.
- `{ ok: false }` returns, turned-off certificate checks, `'use cache'` without `cacheLife`, and a `catch` that caches a failure.
- Import cycles, and disable comments that don't name a rule.
- Casts with `as`, as a warning.

Each message names the app-best-practices topic behind it, so you can read why.

Your project's own import bans live in `@typescript-eslint/no-restricted-imports`, next to ours, which use the core `no-restricted-imports` rule. A project on classic ISR allows `unstable_cache` with `restrictedImports({ cacheComponents: false })`.

## Requirements

- ESLint 9
- TypeScript, with a `tsconfig.json`
