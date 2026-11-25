# @perimetre/lintstaged-config-nextjs

Runs `eslint --fix` on the files you stage, before each commit, so a lint error stops the commit instead of reaching review.

## Quick start

**Starting a project?** Use the [ai-toolkit](https://github.com/perimetre/ai-toolkit) project setup. It installs this config with Husky.

**Adding it to a project yourself?** Copy this prompt into your agent, in the project:

```text
Set up @perimetre/lintstaged-config-nextjs in this project. It needs ESLint set
up already.

1. Check that .npmrc has `@perimetre:registry=https://npm.pkg.github.com`. If it
   doesn't, or the install is refused, stop and ask me.
2. Install @perimetre/lintstaged-config-nextjs, lint-staged and husky as dev
   dependencies with the project's package manager. If a release-age policy
   blocks the install, stop and ask me instead of changing it.
3. Create lint-staged.config.mjs that default-exports the default export of
   @perimetre/lintstaged-config-nextjs.
4. Run husky init if .husky doesn't exist, and make .husky/pre-commit run
   lint-staged with the project's package manager.
5. Stage one file and run lint-staged once, so we see it work.
```

Projects on Oxlint and Oxfmt use [`@perimetre/lintstaged-config-oxc`](https://github.com/perimetre/framework/tree/main/packages/lintstaged-config-oxc).
