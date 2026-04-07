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
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  ...baseConfig,
  // Register jsx-a11y plugin before React config (see note below)
  { plugins: { 'jsx-a11y': jsxA11y } },
  ...reactConfig,
  // Your custom rules here
  ...endConfig
];
```

> **Note:** The React config applies jsx-a11y _rules_ but does not register the plugin itself (to avoid "Cannot redefine plugin" errors when consumers also use jsx-a11y). You must register it once before spreading `reactConfig`.

## Requirements

- React >= 19
- ESLint >= 9
