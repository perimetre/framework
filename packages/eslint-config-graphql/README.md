# @perimetre/eslint-config-graphql

GraphQL ESLint configuration for Perimetre projects.

## What it does

Adds GraphQL-specific linting rules including:

- **Schema validation** - Ensures GraphQL schemas are valid
- **Query validation** - Validates GraphQL queries against schemas
- **Naming conventions** - Enforces GraphQL naming best practices
- **Fragment usage** - Validates proper fragment usage

## Why it exists

Provides GraphQL-specific linting rules for projects using GraphQL, ensuring queries and schemas follow best practices and are type-safe.

## Usage

```bash
pnpm add -D @perimetre/eslint-config-graphql
```

```js
// eslint.config.mjs
import baseConfig from '@perimetre/eslint-config-base';
import graphqlConfig from '@perimetre/eslint-config-graphql';
import endConfig from '@perimetre/eslint-config-base/end';

export default [
  ...baseConfig,
  ...graphqlConfig,
  // Your custom rules here
  ...endConfig
];
```

## Requirements

- GraphQL >= 16
- graphql-tag >= 2
- ESLint >= 9
