# @perimetre/eslint-config-trpc

ESLint configuration optimized for tRPC projects.

## Installation

```bash
pnpm add -D @perimetre/eslint-config-trpc
```

## Usage

In your `eslint.config.mjs`:

```javascript
import base from '@perimetre/eslint-config-base';
import end from '@perimetre/eslint-config-base/end';
import trpc from '@perimetre/eslint-config-trpc';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  ...base,
  ...nextVitals,
  ...nextTs,
  trpc, // Add tRPC config
  ...end
]);
```

## What it does

This configuration **minimally** disables only the strict TypeScript safety rules that fundamentally conflict with tRPC's advanced generic types, while keeping as many rules enabled as possible.

### Disabled Rules (Minimal Set)

Only these rules are disabled - the bare minimum for tRPC compatibility:

**Core tRPC type inference conflicts:**

- `@typescript-eslint/no-unsafe-assignment` - tRPC's generics are type-safe but appear unsafe
- `@typescript-eslint/no-unsafe-call` - Calling tRPC procedures
- `@typescript-eslint/no-unsafe-member-access` - Accessing tRPC router properties
- `@typescript-eslint/no-unsafe-return` - Returning tRPC results
- `@typescript-eslint/no-unsafe-argument` - Passing arguments to tRPC procedures

**Additional tRPC patterns:**

- `@typescript-eslint/restrict-template-expressions` - Numbers in log messages (IDs, durations)
- `@typescript-eslint/unbound-method` - Router.push and other framework methods
- `@typescript-eslint/no-empty-object-type` - Empty Meta type for procedures
- `@typescript-eslint/no-floating-promises` - Mutation calls don't require await
- `@typescript-eslint/require-await` - Async routers may return static data
- `jsdoc/require-description` - tRPC procedures are self-documenting
- `jsdoc/require-jsdoc` - tRPC procedures are self-documenting

### Still Enforced

**All other strict rules remain active**, including:

- Unused variables
- Import organization
- Code formatting (Prettier)
- React best practices
- Nullish coalescing preference (`??` instead of `||`)
- Promise handling (with exceptions for mutations)
- Type inference
- And 100+ other quality rules

## Why These Rules?

tRPC uses complex TypeScript generics for type inference. While these are type-safe at runtime, ESLint's static analysis sees them as potentially unsafe. This is a known limitation documented in official tRPC examples.

## Reference

Based on:

- [tRPC Prisma Starter](https://github.com/trpc/examples-next-prisma-starter)
- [tRPC WebSockets Starter](https://github.com/trpc/examples-next-prisma-websockets-starter)
- Production usage in cpsst-booking
