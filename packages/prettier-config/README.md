# @perimetre/prettier-config

Prettier configuration for Perimetre projects.

## What it does

Provides consistent code formatting with automatic import organization and Tailwind CSS class sorting.

## Why it exists

Ensures consistent code formatting across all Perimetre projects, eliminating formatting debates and making code reviews focus on logic.

## Usage

```bash
pnpm add -D @perimetre/prettier-config prettier
```

```json
// package.json
{
  "prettier": "@perimetre/prettier-config"
}
```

Or use `prettier.config.mjs`:

```js
import config from '@perimetre/prettier-config';

export default config;
```
