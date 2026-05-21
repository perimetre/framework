# tanstack-query-and-graphql example

### What this example is NOT

- For the sake of brevity, this is not an example on how the files are organized and/or where they should live.

---

## Important files to note for React Query:

- [`./src/app/layout.tsx`](./src/app/layout.tsx): Sets up the React Query provider
- [`./src/shared/react-query/index.tsx`](./src/shared/react-query/index.tsx): Defines the React Query client
- [`./src/components/Providers/ReactQueryClientProvider/index.tsx`](./src/components/Providers/ReactQueryClientProvider/index.tsx): Creates and exports the React Query client provider

## Usage examples:

- [`./src/app/basic/client-component/page.tsx`](./src/app/basic/client-component/page.tsx): Example of a Client Component using React Query to fetch and mutate data from a REST API
- [`./src/app/basic/server-component/page.tsx`](./src/app/basic/server-component/page.tsx): Example of a Server Component using React Query to prefetch data from a REST API
  - - [`./src/app/basic/server-component/post-list.tsx`](./src/app/basic/server-component/posts-list.tsx): A client Component that uses prefetched data from the server

---

## Important files to note for GraphQL:

This example uses [`@perimetre/graphql`](../../packages/graphql) for the GraphQL client setup and the TanStack helpers. It demonstrates the Tier 2 + Tier 3 path (lean `graphql-request` + structured logging + TanStack helpers, no Smart Cache / APQ). For a project on `wp-graphql-smart-cache`, swap `createPassthroughExecutor` for `createApqExecutor` and spread `wpGraphqlSmartCachePresetConfig()` into your codegen — see the comments in `codegen.ts`.

- [`./.env`](./env): Holds the GraphQL endpoint
- [`./.graphqlrc.yml`](./.graphqlrc.yml): Declare what files will have GraphQL queries on them
- [`./codegen.ts`](./codegen.ts): GraphQL codegen configuration file (with a commented-in path to opt into WPGraphQL Smart Cache persisted queries via `@perimetre/graphql/codegen`)
- [`./tsconfig.json`](./tsconfig.json): TypeScript configuration file with GraphQL plugin
- [`./package.json`](./package.json): Codegen commands under `scripts` section + concurrently setup for `dev` script that runs both Next.js and codegen in watch mode
- [`./src/server/graphql/index.ts`](./src/server/graphql/index.ts): Builds the GraphQL client via `createGraphqlClient` from `@perimetre/graphql`, with `withRequestLogger` / `withResponseLogger` plugged in for structured logs
- [`./src/shared/react-query/graphql.ts`](./src/shared/react-query/graphql.ts): Exports the project's `graphqlOptions` / `graphqlMutationOptions` helpers via `createGraphqlTanstack` from `@perimetre/graphql/tanstack`

## GraphQL Usage Examples:

- [`./src/app/graphql/graphql.ts`](./src/app/graphql/graphql.ts): GraphQL queries and mutations definition file using the GraphQLZero API
- [`./src/app/graphql/client-component/page.tsx`](./src/app/graphql/client-component/page.tsx): Example of a Client Component using React Query to fetch and mutate data from a GraphQL API
- [`./src/app/graphql/server-component/page.tsx`](./src/app/graphql/server-component/page.tsx): Example of a Server Component using React Query to prefetch data from a GraphQL API
  - [`./src/app/graphql/server-component/posts-list.tsx`](./src/app/graphql/server-component/posts-list.tsx): A client Component that uses prefetched GraphQL data from the server
