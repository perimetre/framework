# @perimetre/graphql

The GraphQL client our headless WordPress projects share. It talks to WPGraphQL, caches through WPGraphQL Smart Cache, and keeps a page up when the CMS is slow or down.

## Quick start

**Starting a project?** Use the [ai-toolkit](https://github.com/perimetre/ai-toolkit) project setup. It installs this package when the project reads a CMS over GraphQL, and wires codegen, caching and revalidation with it.

**Adding it to a project yourself?** Copy this prompt into your agent, in the project:

```text
Set up @perimetre/graphql in this project.

1. Check that .npmrc has `@perimetre:registry=https://npm.pkg.github.com`. If it
   doesn't, or the install is refused, stop and ask me.
2. Install @perimetre/graphql with the project's package manager, and
   @tanstack/react-query too if the project uses TanStack Query. If a
   release-age policy blocks the install, stop and ask me instead of
   changing it.
3. Add a note to AGENTS.md/CLAUDE.md, creating it if needed: before writing
   GraphQL client code, read node_modules/@perimetre/graphql/docs/reference.md,
   and follow the app-best-practices and app-caching skills if they're
   installed.
4. Read the reference, then tell me which tier fits this project and why,
   before writing any code.
```

Then ask for what you need:

```text
Add a cached CMS read for a page by slug with @perimetre/graphql. Serve the
last good copy when WordPress fails, and tag the entry with its CMS keys so
our revalidation webhook refreshes it.
```

## What you can ask for

- **A client for WPGraphQL** with request logs, retries and phase timings.
- **Cacheable GET requests** through WPGraphQL Smart Cache, with no extra round trip to register a query, or a safelist of trusted documents.
- **Cache tags** from WPGraphQL's `X-GraphQL-Keys`, and a revalidation handler for Perimetre Core's webhooks.
- **A CMS that can't take the site down:** a timeout, a cap on concurrent requests, and the last good response when WordPress fails.
- **TanStack Query helpers**, and codegen hashes that match the ones the server stores.

The full API is in [docs/reference.md](docs/reference.md), which your agent reads.
