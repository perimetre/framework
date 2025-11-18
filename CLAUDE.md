# Perimetre Framework Monorepo - Project Context

## Project Overview

**Purpose**: Private monorepo for shared packages, configurations, and patterns used across Perimetre projects.
**Stack**: Turborepo + pnpm + Changesets + GitHub Package Registry (private)
**Repository**: `@perimetre/framework` on GitHub

## Quick Reference

**Key Resources:**

- Contributing: `@CONTRIBUTING.md` - Development workflow and changeset usage
- README: `@README.md` - Setup instructions for developers
- LLMs/: AI-focused documentation on patterns and best practices
- examples/: Working example projects demonstrating integrations

## Technical Architecture

### Core Technologies

- **Monorepo Tool**: Turborepo (caching, parallel builds, dependency management)
- **Package Manager**: pnpm with workspaces
- **Versioning**: Changesets (semantic versioning, automated releases)
- **Registry**: GitHub Package Registry (private, org-scoped: `@perimetre/*`)
- **CI/CD**: GitHub Actions (automated testing and publishing)

### Directory Structure

```
framework/
├── .changeset/                           # Changesets config
├── .github/workflows/                    # CI/CD pipelines
├── LLMs/                                 # AI documentation (patterns & guides)
│   ├── error-handling-exception.md      # Error-as-values pattern
│   ├── services.md                      # Service layer architecture
│   ├── trpc.md                          # tRPC implementation guide
│   ├── react-hook-form.md               # Form handling patterns
│   ├── graphql.md                       # GraphQL + TanStack Query usage
│   ├── tanstack-query.md                # TanStack Query patterns
│   └── icons.md                         # Icon component patterns
├── examples/                            # Working example projects
│   ├── trpc/                            # Full tRPC + service layer example
│   └── tanstack-query-and-graphql/      # GraphQL + TanStack Query example
├── packages/                            # Published packages
│   ├── eslint-config-base/              # Base ESLint rules
│   ├── eslint-config-nextjs/            # Next.js ESLint config
│   ├── eslint-config-react/             # React ESLint config
│   ├── eslint-config-graphql/           # GraphQL ESLint config
│   ├── eslint-config-trpc/              # tRPC-optimized ESLint config
│   ├── lintstaged-config-nextjs/        # lint-staged for Next.js
│   ├── prettier-config/                 # Prettier configuration
│   ├── service-builder/                 # Type-safe service layer builder
│   ├── helpers/                         # Shared TypeScript utilities
│   ├── icons/                           # Accessible React icon wrapper
│   └── classnames/                      # Classname utility (clsx + tailwind-merge)
├── package.json                         # Root package (private)
├── pnpm-workspace.yaml                  # Workspace configuration
├── turbo.json                           # Turborepo pipeline config
└── .npmrc                               # Registry configuration
```

## Key Configuration Files

### Root package.json

- Scripts: `build`, `lint`, `typecheck`, `changeset`, `version`, `release`
- Workspace root for pnpm

### Package Configuration Pattern

Each package has:

```json
{
  "name": "@perimetre/[package-name]",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com",
    "access": "restricted"
  },
  "repository": {
    "directory": "packages/[package-name]"
  }
}
```

### Authentication Setup

- **For CI/CD**: Uses `GITHUB_TOKEN` automatically
- **For developers**: `npm config set //npm.pkg.github.com/:_authToken "$(gh auth token)"`
- **Registry scope**: `@perimetre:registry=https://npm.pkg.github.com`

## Workflows

### Development Flow

1. Branch from main → Make changes → Run `pnpm turbo run lint build`
2. Create changeset: `pnpm changeset` (select packages, version bump, write summary)
3. Commit with conventional commits → Push → Create PR
4. CI runs linting/build on PR

### Release Flow (Automated)

1. PRs with changesets merge to main
2. Release workflow automatically:
   - Bumps package versions based on changesets
   - Generates/updates CHANGELOG.md files
   - Commits version changes to main
   - Publishes packages to GitHub Package Registry
3. No manual intervention required

### Version Strategy

- **Patch**: Bug fixes, dependency updates (0.0.x)
- **Minor**: New features, backward compatible (0.x.0)
- **Major**: Breaking changes (x.0.0)
- Internal dependencies use `workspace:*` protocol

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

### Package Relationships

- Packages use `workspace:*` protocol for internal dependencies
- Changesets handles cross-package version bumps automatically
- ESLint configs can extend each other (e.g., nextjs extends base)

## GitHub Actions Pipelines

1. **CI Pipeline** (`ci.yml`): Runs on PRs - lint, typecheck, build
2. **Release Pipeline** (`release.yml`): Runs on main when changesets detected - auto-versions and publishes packages

## Usage in Projects

```bash
# One-time auth
gh auth login -h github.com -s read:packages
npm config set //npm.pkg.github.com/:_authToken "$(gh auth token)"

# Install in project
pnpm add @perimetre/eslint-config-nextjs
```

## LLMs Documentation

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

**Key files**: See `examples/trpc/README.md` for complete file listing

### TanStack Query + GraphQL Example (`examples/tanstack-query-and-graphql/`)

GraphQL integration with:

- GraphQL Code Generator setup
- TanStack Query factory pattern
- Server and client component patterns
- Type-safe queries and mutations

**Key files**: See `examples/tanstack-query-and-graphql/README.md` for details

## Important Notes

- Configuration packages are configs only (no `dev` scripts needed)
- Utility packages (service-builder, helpers, icons, classnames) ship built code
- All packages private to organization (access: restricted)
- Uses GitHub Package Registry, NOT npm public registry
- Changesets creates automated version PR after merging
- Turborepo caches builds to avoid redundant work
- `workspace:*` protocol ensures local development uses local packages
- Always use absolute GitHub URLs when referencing documentation

## Commands Reference

```bash
pnpm install              # Install all dependencies
pnpm turbo run build      # Build all packages
pnpm changeset            # Create changeset for version bump
pnpm version              # Apply changesets (usually in CI)
pnpm release              # Build + publish (usually in CI)
```

## Current State

- 12 published packages (configs + utilities)
- CI/CD pipelines with automated releases
- Comprehensive LLMs documentation for AI assistants
- Working examples for tRPC and GraphQL patterns
- Authentication via GitHub CLI for developers

**For contributing and commit guidelines**: `@CONTRIBUTING.md`
**For setup instructions**: `@README.md`
