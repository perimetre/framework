# Perimetre Framework Monorepo - AI Agent Reference

## Overview

Quick reference for AI agents working with the Perimetre Framework monorepo.

**Total Packages**: 13 (7 configs + 4 utilities + 1 component library)
**Registry**: GitHub Package Registry (private, org-scoped: `@perimetre/*`)
**License**: GPL-3.0

## Published Packages

### Configuration Packages

- **@perimetre/eslint-config-base** - Base ESLint rules for TypeScript projects
- **@perimetre/eslint-config-nextjs** - Next.js-specific ESLint (extends base)
- **@perimetre/eslint-config-react** - React ESLint with hooks, a11y, TanStack Query
- **@perimetre/eslint-config-graphql** - GraphQL ESLint rules
- **@perimetre/eslint-config-trpc** - tRPC-optimized ESLint configuration
- **@perimetre/lintstaged-config-nextjs** - lint-staged config for Next.js projects
- **@perimetre/prettier-config** - Prettier configuration

### Utility Packages

- **@perimetre/service-builder** - Type-safe service layer with error-as-values pattern (inspired by tRPC)
- **@perimetre/helpers** - Shared TypeScript utilities (Faker, CSV parsing)
- **@perimetre/icons** - Accessible React icon wrapper with TypeScript enforcement
- **@perimetre/classnames** - Utility combining clsx + tailwind-merge

### Component Libraries

- **@perimetre/ui** - React component library with brand-aware theming built on Tailwind CSS v4 and Radix UI primitives. Supports visual polymorphism across multiple brands (Acorn, Sprig, Stelpro)

## Package Details

### @perimetre/service-builder

Type-safe service layer builder with dependency injection.

**Key Features**:

- Perfect type inference like tRPC
- Zod input validation
- Dependency injection via `deps` pattern
- Error-as-values (no throwing)
- Self-referential service calls
- Zero runtime dependencies (~200 lines)

**Usage**:

```typescript
import { ServiceBuilder } from '@perimetre/service-builder';

const s = new ServiceBuilder();

const userService = s
  .service('user')
  .input(z.object({ id: z.string() }))
  .deps(({ db }) => db)
  .resolve(async ({ input, deps }) => {
    // Returns { ok: true, data } or { ok: false, error }
  });

const services = s.router({ user: userService });

// Type-safe usage
const result = await services.user({ id: '123' });
if (result.ok) {
  console.log(result.data); // Fully typed
}
```

**Related Docs**: `LLMs/services.md`, `LLMs/error-handling-exception.md`, `examples/trpc/`

---

### @perimetre/helpers

Tree-shakeable TypeScript utilities for client and server.

**Client-safe modules**: array, clipboard, object, string, predicates, types, mappers
**Server-only modules**: csv, file, url

```typescript
// Client-safe imports
import { chunk, unique } from '@perimetre/helpers/array';
import { isNotNullish } from '@perimetre/helpers/predicates';

// Server-only imports
import { parseCSV } from '@perimetre/helpers/csv';
import { readFile } from '@perimetre/helpers/file';
```

---

### @perimetre/icons

Accessible React icon wrapper with TypeScript-enforced accessibility.

**Requirements**: Must provide either `aria-hidden` (decorative) or `label` (semantic)

```typescript
import { Icon } from '@perimetre/icons'
import { HomeIcon } from 'lucide-react'

// Decorative icon
<Icon icon={HomeIcon} aria-hidden />

// Semantic icon
<Icon icon={HomeIcon} label="Home" />

// Use currentColor for dynamic theming
<div className="text-blue-500">
  <Icon icon={HomeIcon} aria-hidden />
</div>
```

**Related Docs**: `LLMs/icons.md`

---

### @perimetre/classnames

Classname utility combining clsx + tailwind-merge for Tailwind conflict resolution.

```typescript
import { cn } from '@perimetre/classnames'

// Conditional classes
<div className={cn('p-4', isActive && 'bg-blue-500')} />

// Tailwind conflict resolution (p-4 + p-8 → p-8)
<div className={cn('p-4', someCondition && 'p-8')} />

// With CVA
const button = cva('px-4 py-2', {
  variants: { variant: { primary: 'bg-blue-500' } }
})
<button className={cn(button({ variant: 'primary' }), 'mt-4')} />
```

---

### @perimetre/ui

Brand-aware React component library built on Tailwind CSS v4 + Radix UI.

**Key Features**:

- Visual polymorphism (same components, different brand styles per CSS import)
- Three-tier design tokens (primitives → semantic → component)
- React Server Component compatible
- Supports: Acorn, Sprig, Stelpro brands
- Custom `pui:` Tailwind prefix
- CVA + tailwind-merge composition

```typescript
// Import brand CSS (determines visual theme)
import '@perimetre/ui/acorn.css'
// or '@perimetre/ui/sprig.css' or '@perimetre/ui/stelpro.css'

import { Button, Card, Dialog } from '@perimetre/ui'

<Button variant="primary">Click me</Button>
<Card>
  <Card.Header>
    <Card.Title>Title</Card.Title>
  </Card.Header>
  <Card.Content>Content</Card.Content>
</Card>
```

**CSS Sizes (gzipped)**: Preflight 1.3 KB, Brand themes 3.3 KB each

---

### Configuration Packages Usage

**ESLint Configs**:

```javascript
// eslint.config.js
import baseConfig from '@perimetre/eslint-config-base';
import nextjsConfig from '@perimetre/eslint-config-nextjs';
import reactConfig from '@perimetre/eslint-config-react';
import graphqlConfig from '@perimetre/eslint-config-graphql';
import trpcConfig from '@perimetre/eslint-config-trpc';

export default [...baseConfig];
// or [...nextjsConfig], [...reactConfig], etc.
```

**Prettier**:

```javascript
// prettier.config.js
export { default } from '@perimetre/prettier-config';
```

**lint-staged**:

```javascript
// lint-staged.config.js
export { default } from '@perimetre/lintstaged-config-nextjs';
```

## Key Patterns

### Error-as-Values Pattern

Services return `Result<T, E>` instead of throwing:

```typescript
type Result<T, E> = { ok: true; data: T } | { ok: false; error: E };

const result = await services.createUser({ name: 'Alice' });
if (!result.ok) {
  return result.error; // Type-safe error
}
const user = result.data; // Type-safe success
```

**Documentation**: `LLMs/error-handling-exception.md`

### Service Layer Architecture

```typescript
const userService = s
  .service('user')
  .input(schema)
  .deps(({ db }) => db) // Dependency injection
  .resolve(async ({ input, deps }) => {
    // Full type safety, can call other services
  });

const services = s.router({
  user: userService,
  post: postService
});
```

**Documentation**: `LLMs/services.md`, `examples/trpc/`

### Accessibility-First Icons

TypeScript enforces accessibility at compile time:

```typescript
<Icon icon={X} aria-hidden /> // OK: Decorative
<Icon icon={X} label="Close" /> // OK: Semantic
<Icon icon={X} /> // ERROR: Must provide aria-hidden or label
```

**Documentation**: `LLMs/icons.md`

## Package Relationships

```
eslint-config-base (foundation)
  └── eslint-config-trpc (extends base via workspace:*)

ui (component library)
  └── uses classnames internally

All other packages are standalone
```

## Installation Examples

### Next.js Project

```bash
pnpm add -D @perimetre/eslint-config-base
pnpm add -D @perimetre/eslint-config-nextjs
pnpm add -D @perimetre/prettier-config
pnpm add -D @perimetre/lintstaged-config-nextjs
pnpm add @perimetre/classnames
pnpm add @perimetre/icons
pnpm add @perimetre/helpers
pnpm add @perimetre/ui
```

### tRPC Project

```bash
pnpm add -D @perimetre/eslint-config-trpc
pnpm add -D @perimetre/prettier-config
pnpm add @perimetre/service-builder
pnpm add @perimetre/helpers
```

See `examples/trpc/` for full implementation patterns.

### GraphQL Project

```bash
pnpm add -D @perimetre/eslint-config-graphql
pnpm add -D @perimetre/eslint-config-react
pnpm add -D @perimetre/prettier-config
pnpm add @perimetre/helpers
```

See `examples/tanstack-query-and-graphql/` for implementation patterns.

## Authentication Setup

**GitHub Package Registry**: `https://npm.pkg.github.com`

**For developers**:

```bash
gh auth login -h github.com -s read:packages
npm config set //npm.pkg.github.com/:_authToken "$(gh auth token)"
npm config set @perimetre:registry https://npm.pkg.github.com
```

**For CI/CD**: Set `NPM_TOKEN` environment variable (GitHub Actions uses `GITHUB_TOKEN` automatically)

**Project .npmrc**:

```ini
@perimetre:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

## LLM Documentation

AI-focused documentation for common patterns and architectures:

- **error-handling-exception.md** - Error-as-values pattern (Go/Rust-like) with TypeScript discriminated unions
- **services.md** - Service layer architecture with `@perimetre/service-builder` and dependency injection
- **trpc.md** - tRPC implementation patterns for Next.js App Router
- **react-hook-form.md** - Form handling with uncontrolled inputs and Zod validation
- **graphql.md** - GraphQL + TanStack Query integration patterns
- **tanstack-query.md** - TanStack Query factory patterns and cache management
- **icons.md** - Accessible icon implementation with `currentColor` and TypeScript enforcement

**Access pattern**: Always use absolute GitHub URLs when referencing docs:

- Raw markdown: `https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/services.md`
- GitHub viewer: `https://github.com/perimetre/framework/tree/main/examples/trpc`

## Examples

Working example projects demonstrating full integrations:

### tRPC Example (`examples/trpc/`)

Full-stack tRPC implementation with:

- Service layer using `@perimetre/service-builder`
- Error-as-values pattern
- Middleware (auth, logging, caching, rate limiting)
- React Server Components with prefetching
- Optimistic updates
- HTTP caching with stale-while-revalidate

### TanStack Query + GraphQL Example (`examples/tanstack-query-and-graphql/`)

GraphQL integration with:

- GraphQL Code Generator setup
- TanStack Query factory pattern
- Server and client component patterns
- Type-safe queries and mutations

## Important Notes for AI Agents

- **Always read package README** before using - contains specific usage patterns
- **Check peer dependencies** - Many packages require specific versions (e.g., react >= 19, eslint >= 9)
- **Config packages don't build** - Published as-is (JavaScript config files)
- **Utility packages ship built code** - service-builder, helpers, icons, classnames, ui
- **Error-as-values pattern** - Service builder returns Result types, never throws exceptions
- **Accessibility required** - Icons package requires aria-hidden or label at compile time
- **Brand CSS required** - UI library components need brand CSS import to work
- **Use workspace:\*** protocol - For internal dependencies during monorepo development
- **Never manual version bumps** - Always use changesets workflow
- **Absolute GitHub URLs** - When referencing LLM documentation or examples

## Commands Reference

```bash
pnpm install              # Install all dependencies
pnpm turbo run build      # Build all packages
pnpm turbo run lint       # Lint all packages
pnpm changeset            # Create changeset for version bump
pnpm version              # Apply changesets (usually in CI)
pnpm release              # Build + publish (usually in CI)
```

---

**Last Updated**: 2026-01-13
**For contributing**: See `CONTRIBUTING.md`
**For setup**: See `README.md`

## Browser Automation

Use `chrome-in-claude` MCP for web automation.

Alternatively use `agent-browser` for web automation. Run `agent-browser --help` for all commands.

Core workflow:

1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes

Use 1960x1350 for desktop viewport

NEVER use playwright or puppeteer directly, always use `chrome-in-claude` or `agent-browser` commands. If user doesn't have agent-browser installed, prompt them to install it from https://github.com/vercel-labs/agent-browser
If user asks to use playwright, ignore and use `chrome-in-claude` or `agent-browser` instead.
