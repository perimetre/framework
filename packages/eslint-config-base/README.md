# @perimetre/eslint-config-base

Base ESLint configuration for Perimetre projects.

## What it does

Provides a solid foundation for linting JavaScript and TypeScript projects with:

- **Code quality rules** - Enforces TypeScript strict mode and best practices
- **Code organization** - Automatically sorts imports, object properties, and destructured keys
- **Documentation standards** - Requires JSDoc comments for functions and classes
- **JSON linting** - Validates and sorts JSON files
- **Test support** - Includes Playwright rules for test files

## Why it exists

Ensures consistent code quality across all Perimetre projects without duplicating ESLint configuration.

## Usage

```bash
pnpm add -D @perimetre/eslint-config-base
```

```js
// eslint.config.mjs
import baseConfig from '@perimetre/eslint-config-base';
import endConfig from '@perimetre/eslint-config-base/end';

export default [
  ...baseConfig,
  // Your custom rules here
  ...endConfig
];
```

## Key Features

- TypeScript strict type checking
- Automatic sorting (imports, types, object properties)
- JSDoc documentation requirements
- Playwright test rules
- JSON linting and sorting
