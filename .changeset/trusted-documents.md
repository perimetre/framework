---
'@perimetre/graphql': minor
---

Add Trusted Documents (Saved Queries / safelisting) as a transport separate from APQ.

Where APQ learns documents at runtime (register-on-miss POST), Trusted Documents safelists every document on the CMS **ahead of time** and the runtime only ever issues GET-by-id — an unknown id is a hard error, never learned. This is the GraphQL "trusted documents" pattern (Benjie Gillam / The Guild; Apollo's analog is `rover persisted-queries publish`), and it adds a security property on top of the caching one: the server executes only operations your developers authored and shipped.

- **`registerTrustedDocuments`** (`@perimetre/graphql/trusted-documents`) — deploy-time registrar. Pushes each `hash → query` from `persisted-documents.json` to the CMS via the `createGraphqlDocument` mutation (needs a WP user with `create_posts`; pass an Application Password / JWT via `headers`). Idempotent (re-registering an existing doc is a `skipped`, not a failure), returns an error-as-values summary, and never throws for per-document failures.
- **`trustedDocumentsCodegenHook`** (`@perimetre/graphql/codegen`) — an `afterAllFileWrite` lifecycle-hook factory for `@graphql-codegen`. Drop it into your `codegen.ts` `hooks` (gated on an env flag) to register the safelist in the same step that emits it — no separate deploy script required.
- **`createTrustedDocumentExecutor`** (`@perimetre/graphql/trusted-documents`) — runtime executor. Sends queries as `GET ?queryId=<hash>` and nothing else; a `PersistedQueryNotFound` response throws `TrustedDocumentNotRegisteredError` instead of registering. Mutations/subscriptions/unhashed queries POST through the underlying client. Transport blips fall back to a POST; a missing-from-safelist id always throws.
- **`createWpGraphql`** gains `trustedDocuments?: boolean`. It's mutually exclusive with `apq` (enabling both throws) and requires `fetch`. The two transports are deliberately distinct paths.

The runtime executor and registrar are pure (no `node:` builtins), so `@perimetre/graphql/trusted-documents` is safe to import from client/Edge bundles; the codegen hook stays on the Node-only `/codegen` subpath since it reads the emitted file.

Validated live against a WPGraphQL Smart Cache endpoint: pre-registered documents resolve GET-only by id, and an unknown id throws `TrustedDocumentNotRegisteredError` with no POST issued.
