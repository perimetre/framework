# @perimetre/lintstaged-config-oxc

[`@perimetre/lintstaged-config-nextjs`](https://github.com/perimetre/framework/tree/main/packages/lintstaged-config-nextjs) for projects on Oxlint and Oxfmt. Before each commit it runs `oxlint --fix` on your staged code, then Oxfmt on every staged file, so Oxfmt formats what Oxlint fixed. A lint error stops the commit.

## Quick start

Set up [`@perimetre/oxlint-config-base`](https://github.com/perimetre/framework/tree/main/packages/oxlint-config-base) and [`@perimetre/oxfmt-config`](https://github.com/perimetre/framework/tree/main/packages/oxfmt-config) first. The [ai-toolkit](https://github.com/perimetre/ai-toolkit) project setup doesn't install Oxc yet, so copy this prompt into your agent, in the project:

```text
Set up @perimetre/lintstaged-config-oxc in this project. It needs Oxlint and
Oxfmt set up already.

1. Check that .npmrc has `@perimetre:registry=https://npm.pkg.github.com`. If it
   doesn't, or the install is refused, stop and ask me.
2. Install @perimetre/lintstaged-config-oxc, lint-staged and husky as dev
   dependencies with the project's package manager, and remove
   @perimetre/lintstaged-config-nextjs if it's there. If a release-age policy
   blocks the install, stop and ask me instead of changing it.
3. Make lint-staged.config.mjs default-export the default export of
   @perimetre/lintstaged-config-oxc, replacing any other lint-staged config.
4. Run husky init if .husky doesn't exist, and make .husky/pre-commit run
   lint-staged with the project's package manager.
5. Stage one file and run lint-staged once, so we see it work.
```

## Requirements

- lint-staged 16
- Oxlint 1.95 or later, and Oxfmt 0.80 or later
