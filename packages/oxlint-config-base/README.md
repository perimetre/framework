# @perimetre/oxlint-config-base

Our ESLint rules, on [Oxlint](https://oxc.rs/docs/guide/usage/linter.html). It runs the same upstream presets and the same [app-best-practices](https://github.com/perimetre/ai-toolkit) conventions as [`@perimetre/eslint-config-base`](https://github.com/perimetre/framework/tree/main/packages/eslint-config-base), adds Oxlint's own `correctness` rules, and checks types with [tsrs](https://github.com/oxc-project/tsrs). On this repo it takes 1.5 seconds where ESLint takes 21.

## Quick start

Start a new project with the [ai-toolkit](https://github.com/perimetre/ai-toolkit) project setup. It sets up ESLint and Prettier today, not Oxlint, so switch afterwards with this prompt. Copy it into your agent, in the project:

```text
Switch this project's linting from ESLint to Oxlint with @perimetre/oxlint-config-base.
It needs Node.js 22.18 or newer.

1. Check that .npmrc has `@perimetre:registry=https://npm.pkg.github.com`. If it
   doesn't, or the install is refused, stop and ask me.
2. Install @perimetre/oxlint-config-base, oxlint and tsrs as dev dependencies
   with the project's package manager. tsrs must be a direct dependency: Oxlint
   looks for it in the project's node_modules/.bin. Add the configs that match
   the project: @perimetre/oxlint-config-react for React,
   @perimetre/oxlint-config-nextjs for Next.js and @perimetre/oxlint-config-trpc
   for tRPC. If a release-age policy blocks the install, stop and ask me
   instead of changing it.
3. Write oxlint.config.ts with defineConfig from oxlint: `extends` lists base,
   then react, nextjs and trpc in that order, and `ignorePatterns` is the
   `ignorePatterns` export of @perimetre/oxlint-config-base, since Oxlint
   ignores it in an extended config.
4. tsrs follows TypeScript 7, where tsconfig `types` defaults to []. Add the
   global types the project uses (node, bun, google.maps...) to
   compilerOptions.types.
5. Set "lint": "oxlint --max-warnings 0" and "lint:fix": "oxlint --fix" in
   package.json.
6. If the project has an ESLint config, run both linters and show me what
   differs before removing ESLint, its configs and eslint.config.mjs.
7. Add a note to AGENTS.md/CLAUDE.md, creating it if needed: lint rules come
   from @perimetre/oxlint-config-*. Read the JSDoc in
   node_modules/@perimetre/oxlint-config-base/index.mjs and restrictions.mjs
   before changing a rule. To let a file use an import the config bans, build
   the options with restrictedImports().
```

Then format with [`@perimetre/oxfmt-config`](https://github.com/perimetre/framework/tree/main/packages/oxfmt-config), and run both on commit with [`@perimetre/lintstaged-config-oxc`](https://github.com/perimetre/framework/tree/main/packages/lintstaged-config-oxc).

## What changes from ESLint

- tsrs checks types the way TypeScript 7 does, so a project missing its global types in `tsconfig.json` sees `no-unsafe-*` errors on every use of them.
- Oxlint doesn't parse JSON, so nothing sorts JSON keys anymore.
- Oxlint has `no-undef`, `no-unnecessary-condition` and `prefer-optional-chain` only as experimental rules, so this config leaves them out.
- A disable comment for a convention rule names `perimetre/no-restricted-syntax`, where ESLint names `no-restricted-syntax`.
- Oxlint's own `correctness` rules catch code that is wrong, like a comparison that is always true.

## Requirements

- Node.js 22.18 or later
- Oxlint 1.95 or later, and tsrs
