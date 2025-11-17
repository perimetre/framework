# @perimetre/eslint-config-react

React ESLint configuration for Perimetre projects.

## What it does

Adds React-specific linting rules including:

- **React best practices** - Enforces React patterns and conventions
- **Hooks rules** - Validates proper usage of React hooks
- **Accessibility** - Ensures JSX accessibility standards (a11y)
- **TanStack Query** - Validates proper usage of React Query

## Why it exists

Provides React-specific linting rules that work with our base configuration, ensuring React projects follow best practices for hooks, accessibility, and data fetching.

## Usage

```bash
pnpm add -D @perimetre/eslint-config-react
```

```js
// eslint.config.mjs
import baseConfig from '@perimetre/eslint-config-base';
import reactConfig from '@perimetre/eslint-config-react';
import endConfig from '@perimetre/eslint-config-base/end';

export default [
  ...baseConfig,
  ...reactConfig,
  // Your custom rules here
  ...endConfig
];
```

## Requirements

- React >= 19
- ESLint >= 9
