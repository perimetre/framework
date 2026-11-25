# @perimetre/fancy-log

Coloured, timestamped log lines with a level, for reading a server's output at a glance. Objects and errors print in full, the way `console` prints them.

```
2024-01-15T10:30:00.000Z DEBUG Query result { rows: 42 }
2024-01-15T10:30:00.000Z  INFO Server started on port 3000
2024-01-15T10:30:00.000Z  WARN Missing environment variable
2024-01-15T10:30:00.000Z ERROR Database connection failed Error: ...
```

## Quick start

The [ai-toolkit](https://github.com/perimetre/ai-toolkit) project setup doesn't add this package. To add it, copy this prompt into your agent, in the project:

```text
Set up @perimetre/fancy-log in this project.

1. Check that .npmrc has `@perimetre:registry=https://npm.pkg.github.com`. If it
   doesn't, or the install is refused, stop and ask me.
2. Install @perimetre/fancy-log with the project's package manager. If a
   release-age policy blocks the install, stop and ask me instead of
   changing it.
3. Add a note to AGENTS.md/CLAUDE.md, creating it if needed: server logs go
   through debug, info, warn and error from @perimetre/fancy-log, not console.
   Their types are in node_modules/@perimetre/fancy-log.
```
