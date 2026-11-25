# @perimetre/helpers

Small utilities our projects kept rewriting: arrays, objects, strings, the clipboard, value mappers, type predicates and utility types, plus server-only helpers for CSV files, the file system and URLs. Each group is its own entry, so a project bundles only what it imports.

## Quick start

The [ai-toolkit](https://github.com/perimetre/ai-toolkit) project setup doesn't add this package. To add it, copy this prompt into your agent, in the project:

```text
Set up @perimetre/helpers in this project.

1. Check that .npmrc has `@perimetre:registry=https://npm.pkg.github.com`. If it
   doesn't, or the install is refused, stop and ask me.
2. Install @perimetre/helpers with the project's package manager. If a
   release-age policy blocks the install, stop and ask me instead of
   changing it.
3. Add a note to AGENTS.md/CLAUDE.md, creating it if needed: before writing a
   small utility, check node_modules/@perimetre/helpers/docs/reference.md for
   one. Import the csv, file and url entries in server code only.
```

What each entry exports is in [docs/reference.md](docs/reference.md).
