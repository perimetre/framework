# @perimetre/eslint-config-nextjs

ESLint configuration for Next.js projects at Perimetre.

## What it does

Adds Next.js-specific linting rules using `@next/eslint-plugin-next` (flat config) including:

- **React Compiler validation** - Ensures proper React 19 compiler usage
- **Next.js core-web-vitals** - Validates Next.js patterns, conventions, and performance best practices

## Why it exists

Provides Next.js-specific linting rules that complement our base and React configurations, ensuring projects follow Next.js best practices. Uses `@next/eslint-plugin-next` directly instead of `eslint-config-next` to avoid plugin conflicts (e.g., duplicate `react-hooks` registration) when composed with `@perimetre/eslint-config-react`.

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
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  ...baseConfig,
  // Register jsx-a11y plugin before React config (required, see react config docs)
  { plugins: { 'jsx-a11y': jsxA11y } },
  ...reactConfig,
  ...nextjsConfig,
  // Your custom rules here
  ...endConfig
];
```

## Requirements

- Next.js >= 15
- ESLint >= 9
