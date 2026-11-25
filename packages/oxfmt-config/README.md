# @perimetre/oxfmt-config

[`@perimetre/prettier-config`](https://github.com/perimetre/framework/tree/main/packages/prettier-config) on [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html), which formats in a fraction of the time. On this repo, formatted by Prettier, Oxfmt changed one import order and the imports inside Markdown code blocks, which Prettier leaves alone. It doesn't remove unused imports the way Prettier's plugin did; Oxlint reports them instead.

## Quick start

Start a new project with the [ai-toolkit](https://github.com/perimetre/ai-toolkit) project setup. It sets up Prettier today, not Oxfmt, so switch afterwards with this prompt. Copy it into your agent, in the project:

```text
Switch this project's formatting from Prettier to Oxfmt with @perimetre/oxfmt-config.
It needs Node.js 22.18 or newer.

1. Check that .npmrc has `@perimetre:registry=https://npm.pkg.github.com`. If it
   doesn't, or the install is refused, stop and ask me.
2. Install @perimetre/oxfmt-config and oxfmt as dev dependencies with the
   project's package manager. If a release-age policy blocks the install, stop
   and ask me instead of changing it.
3. Write oxfmt.config.ts with defineConfig from oxfmt, spreading the default
   export of @perimetre/oxfmt-config: Oxfmt has no `extends`. With Tailwind v4,
   set sortTailwindcss.stylesheet to the global stylesheet.
4. Set "format": "oxfmt" and "format:check": "oxfmt --check" in package.json.
   Keep .prettierignore: Oxfmt reads it.
5. Run oxfmt --check and tell me how many files it would change. Remove
   Prettier and its config once I agree.
```

## Requirements

- Node.js 22.18 or later
- Oxfmt 0.80 or later
