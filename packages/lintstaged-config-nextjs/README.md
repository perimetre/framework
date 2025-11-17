# @perimetre/lintstaged-config-nextjs

Lint-staged configuration for Next.js projects at Perimetre.

## What it does

Automatically runs ESLint on staged files before commits, fixing issues when possible.

## Why it exists

Prevents committing code with linting errors by catching and fixing issues automatically during the commit process.

## Usage

```bash
pnpm add -D @perimetre/lintstaged-config-nextjs lint-staged
```

```js
// lint-staged.config.mjs
import config from '@perimetre/lintstaged-config-nextjs';

export default config;
```

Or use `package.json`:

```json
{
  "lint-staged": "@perimetre/lintstaged-config-nextjs"
}
```

## Requirements

- lint-staged >= 16
