# @perimetre/service-builder

How our apps write business logic: services with Zod-validated inputs, dependencies passed in rather than imported, and errors returned as values instead of thrown. It works like tRPC's builder, in about 200 lines, with Zod as its only peer.

## Quick start

**Starting a project?** Use the [ai-toolkit](https://github.com/perimetre/ai-toolkit) project setup. It installs this package when the project has tRPC or reads an external source, like a CMS or a store.

**Adding it to a project yourself?** Copy this prompt into your agent, in the project:

```text
Set up @perimetre/service-builder in this project.

1. Check that .npmrc has `@perimetre:registry=https://npm.pkg.github.com`. If it
   doesn't, or the install is refused, stop and ask me.
2. Install @perimetre/service-builder and zod with the project's package
   manager. If a release-age policy blocks the install, stop and ask me
   instead of changing it.
3. Add a note to AGENTS.md/CLAUDE.md, creating it if needed: business logic
   lives in services built with @perimetre/service-builder. Before writing
   one, read node_modules/@perimetre/service-builder/docs/reference.md, and
   follow the app-best-practices skill if it's installed. A service returns
   `{ ok: true, ... }` on success and an Error instance on failure, never
   `{ ok: false }`.
```

Then ask for a service:

```text
Add a users service with @perimetre/service-builder. getById takes an id,
reads the user from our database, and returns a NotFoundError when there is
none. Call it from the user page.
```

## Why errors as values

A service can fail in ways its caller should handle: a missing record, a refused payment. When it returns those failures, TypeScript lists them in its return type, so the caller can't forget one. A thrown error never shows up in a type.

The full API and its patterns are in [docs/reference.md](docs/reference.md), which your agent reads.
