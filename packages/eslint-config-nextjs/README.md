# @perimetre/eslint-config-nextjs

ESLint configuration for Next.js projects at Perimetre.

## What it does

Adds Next.js-specific linting rules including:

- **React Compiler validation** - Ensures proper React 19 compiler usage
- **Next.js best practices** - Validates Next.js patterns and conventions

## Why it exists

Provides Next.js-specific linting rules that complement our base and React configurations, ensuring projects follow Next.js best practices.

## Usage

```bash
pnpm add -D @perimetre/eslint-config-nextjs
```

```js
// eslint.config.mjs
import baseConfig from '@perimetre/eslint-config-base';
import reactConfig from '@perimetre/eslint-config-react';
import nextjsConfig from '@perimetre/eslint-config-nextjs';
import endConfig from '@perimetre/eslint-config-base/end';

export default [
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  // Your custom rules here
  ...endConfig
];
```

## Requirements

- Next.js >= 15
- ESLint >= 9
