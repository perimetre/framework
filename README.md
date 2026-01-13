# @perimetre/framework

Shared packages, configurations, and architectural patterns for Perimetre projects.

## Packages

### Configuration Packages

- `@perimetre/eslint-config-base` - Base ESLint rules for TypeScript projects
- `@perimetre/eslint-config-nextjs` - Next.js ESLint configuration (extends base)
- `@perimetre/eslint-config-react` - React ESLint with hooks, a11y, and TanStack Query rules
- `@perimetre/eslint-config-graphql` - GraphQL ESLint configuration
- `@perimetre/eslint-config-trpc` - tRPC-optimized ESLint configuration
- `@perimetre/lintstaged-config-nextjs` - lint-staged configuration for Next.js projects
- `@perimetre/prettier-config` - Prettier configuration

### Utility Packages

- `@perimetre/service-builder` - Type-safe service layer builder with error-as-values pattern
- `@perimetre/helpers` - Shared TypeScript utilities (Faker, CSV parsing)
- `@perimetre/icons` - Accessible React icon wrapper with TypeScript enforcement
- `@perimetre/classnames` - Classname utility combining clsx and tailwind-merge

### Component Libraries

- `@perimetre/ui` - Reusable React component library with brand-aware theming built on Tailwind CSS v4 and Radix UI primitives

## Documentation

### LLMs Directory

AI-focused documentation for patterns and best practices:

- `LLMs/error-handling-exception.md` - Error-as-values pattern with TypeScript
- `LLMs/services.md` - Service layer architecture guide
- `LLMs/trpc.md` - tRPC implementation patterns for Next.js
- `LLMs/react-hook-form.md` - Form handling patterns
- `LLMs/graphql.md` - GraphQL + TanStack Query usage
- `LLMs/tanstack-query.md` - TanStack Query patterns
- `LLMs/icons.md` - Icon implementation guide

### Examples Directory

Working example projects:

- `examples/trpc/` - Full tRPC + service layer implementation
- `examples/tanstack-query-and-graphql/` - GraphQL + TanStack Query integration

## Setup for Contributors

### Prerequisites

1. Install [pnpm](https://pnpm.io/installation)
2. Install [GitHub CLI](https://cli.github.com/)

### Initial Setup

1. Clone the repository:

   ```bash
   gh repo clone perimetre/framework
   cd framework
   ```

2. Authenticate with GitHub Package Registry:

   ```bash
   gh auth login -h github.com -s read:packages
   > Select SSH
   npm config set //npm.pkg.github.com/:_authToken "$(gh auth token)"
   npm config set @perimetre:registry https://npm.pkg.github.com
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

## Development Workflow

### Making Changes

1. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature
   ```

2. Make your changes to packages

3. Run tests and linting:

   ```bash
   pnpm turbo run lint build
   ```

4. Create a changeset:

   ```bash
   pnpm changeset
   ```

5. Commit your changes:

   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

6. Push and create a pull request:
   ```bash
   git push -u origin feature/your-feature
   ```

### Release Process

Releases are automated when PRs are merged to main:

1. Changesets creates a "Version Packages" PR
2. Review and merge the PR
3. Packages are automatically published to GitHub Package Registry

## Using Packages in Projects

### Local Development Setup

1. Create `.npmrc` in your project root:

   ```ini
   @perimetre:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${NPM_TOKEN}
   ```

2. Set up authentication token:

   ```bash
   gh auth login -h github.com -s read:packages
   > Select SSH
   npm config set //npm.pkg.github.com/:_authToken "$(gh auth token)"
   npm config set @perimetre:registry https://npm.pkg.github.com
   ```

3. Install packages:
   ```bash
   pnpm add @perimetre/eslint-config-nextjs
   ```

### CI/CD Setup (Cloudflare, Vercel, etc.)

1. Create a GitHub Personal Access Token:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Create token with `read:packages` scope
   - Or use: `gh auth token` (for temporary token)

2. Add environment variable to your CI/CD platform:
   - **Variable name**: `NPM_TOKEN`
   - **Value**: Your GitHub PAT
   - **Scope**: Both production and preview environments

3. Ensure `.npmrc` is committed to your project (the token uses environment variable substitution, so it's safe)
