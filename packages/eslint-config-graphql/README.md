# @perimetre/eslint-config-graphql

Lints GraphQL operations, in `.graphql` files and in `gql` tags inside TypeScript, with `@graphql-eslint`'s recommended operation rules.

Prettier can't format GraphQL inside a `gql()` call, so format those by hand.

## Quick start

The [ai-toolkit](https://github.com/perimetre/ai-toolkit) project setup installs it when the project has GraphQL documents. To add it yourself, use the prompt in [`@perimetre/eslint-config-base`](https://github.com/perimetre/framework/tree/main/packages/eslint-config-base#quick-start), which adds it for those projects.

There is no Oxlint version: `@graphql-eslint` needs a custom parser, which Oxlint's JS plugins can't load.

## Requirements

- graphql 16
- graphql-tag 2
- ESLint 9
