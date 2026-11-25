# @perimetre/prettier-config

How Périmètre projects format code: single quotes, no trailing commas, sorted imports and sorted Tailwind classes.

## Quick start

**Starting a project?** Use the [ai-toolkit](https://github.com/perimetre/ai-toolkit) project setup. It installs this config.

**Adding it to a project yourself?** Copy this prompt into your agent, in the project:

```text
Set up @perimetre/prettier-config in this project.

1. Check that .npmrc has `@perimetre:registry=https://npm.pkg.github.com`. If it
   doesn't, or the install is refused, stop and ask me.
2. Install @perimetre/prettier-config and prettier as dev dependencies with the
   project's package manager. If a release-age policy blocks the install, stop
   and ask me instead of changing it.
3. Set "prettier": "@perimetre/prettier-config" in package.json, and delete any
   other Prettier config file.
4. Add "format": "prettier --write ." to package.json.
5. Run prettier --check . and tell me how many files it would change. Don't
   format them yet.
```

[`@perimetre/oxfmt-config`](https://github.com/perimetre/framework/tree/main/packages/oxfmt-config) formats the same way with Oxfmt.
