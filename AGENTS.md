# Perimetre Framework Monorepo - Project Context

## Project Overview

**Purpose**: Private monorepo for shared packages, configurations, and patterns used across Perimetre projects.
**Stack**: Turborepo + pnpm + Changesets + GitHub Package Registry (private)
**Repository**: `@perimetre/framework` on GitHub

## Quick Reference

**Key Resources:**

- Contributing: `@CONTRIBUTING.md` - Development workflow and changeset usage
- README: `@README.md` - Setup instructions for developers
- Pattern guides: ai-toolkit repo, plugin `perimetre-apps` (`app-code-review/references/*.md`, `app-caching`, `seo`)
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
├── examples/                            # Working example projects
│   ├── trpc/                            # Full tRPC + service layer example
│   ├── tanstack-query-and-graphql/      # GraphQL + TanStack Query example
│   └── ui-sdk-forms/                    # React Hook Form + UI SDK form controls
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
│   ├── classnames/                      # Classname utility (clsx + tailwind-merge)
│   ├── ui/                              # React component library (brand-aware, deprecated for new work)
│   └── ui-behaviors/                    # UI behaviours and primitives on UI SDK (apps own the components)
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
- **@perimetre/icons** - Accessible React icon wrapper with TypeScript enforcement. **Deprecated**: use `Icon` from `@perimetre/ui-behaviors/react/icon`. Kept published for the apps that install it
- **@perimetre/classnames** - Utility combining clsx + tailwind-merge. **Deprecated**: use the `cn` package (https://github.com/shadcn-ui/cn) directly, `cn` from `cn` and `createCn` from `cn/config`. Kept published for the apps that install it

### UI Behaviours and Components

- **@perimetre/ui-behaviors** - A library of UI behaviours built on UI SDK (https://ui-sdk.dev), for an agent to build an app's own components with. It is not a component library: it ships no styles, and apps own their components. `Icon` (`react/icon`) is its one React component, there because every app needs the same one and it has nothing to style; everything else is framework-free. It has no root import: every folder under `src/` is its own entry, like `@perimetre/ui-behaviors/primitives/magnify`. `behaviors/` holds functions shaped like UI SDK's (`createFollowPoint`, `createScrub`, `createAutoProgress`, `createLinkedHighlight`, `bindGoogleMap`), `primitives/` holds `magnify`, `sequence` and `locator` (`definePrimitive`, rendered by the app with `createParts`), and `utilities/` holds pure functions (`sortByDistance`, `accessibleIcon`, `createPlacesSession`). Use UI SDK directly for what it covers (accordion, tabs, drawer, carousel, form controls). When working on this package, follow the `create-ui-behavior` skill (`.agents/skills/create-ui-behavior/SKILL.md`): what belongs here, UI SDK's naming and shape, and what every addition needs (story, test, the shipped skill, a changeset). Never add a component, a style or `"use client"`. Nothing under `packages/ui-behaviors` mentions `@perimetre/ui`, `@perimetre/icons`, `@perimetre/classnames` or `@perimetre/tokens`: the deprecated packages point to it, never the reverse. See `packages/ui-behaviors/README.md`, and `packages/ui/docs/migrating-to-ui-behaviors.md` for the migration guide
- **@perimetre/ui** - React component library with brand-aware theming built on Tailwind CSS v4 and Radix UI primitives. Supports visual polymorphism across multiple brands (Acorn, Sprig, Stelpro) with three-tier design token system. **Deprecated**: kept published and working for the apps that install it, with no new components. New components are written in the app, from UI SDK and `@perimetre/ui-behaviors`
- **@perimetre/tokens** - Design tokens as W3C DTCG JSON sets, built to CSS custom properties per brand. **Deprecated as a package**: each app still defines its own tokens, in its own stylesheet, and its components read them. Existing sets still release through `tokens-release.yml` for the apps that install them; no new brand or token is added

### Package Relationships

- Packages use `workspace:*` protocol for internal dependencies
- Changesets handles cross-package version bumps automatically
- ESLint configs can extend each other (e.g., nextjs extends base)

## GitHub Actions Pipelines

1. **CI Pipeline** (`ci.yml`): Runs on PRs - lint, typecheck, build
2. **Release Pipeline** (`release.yml`): Runs on main when changesets detected - auto-versions and publishes packages
3. **Tests Pipeline** (`tests.yml`): Runs every package's `test` task (`pnpm test`) on PRs and on main, behind one aggregate `Tests` check. Each package's tests are a Turbo task cached on its inputs, with `.turbo/cache` kept between runs. The Changesets release PR is skipped: `.github/scripts/release-only-diff.mjs` detects a diff that only bumps versions, writes changelogs and deletes changesets, since Turbo always hashes `package.json` and would re-run everything

## Usage in Projects

```bash
# One-time auth
gh auth login -h github.com -s read:packages
npm config set //npm.pkg.github.com/:_authToken "$(gh auth token)"

# Install in project
pnpm add @perimetre/eslint-config-nextjs
```

## Pattern Guides

The pattern guides that used to live in `LLMs/` now live in the [ai-toolkit](https://github.com/perimetre/ai-toolkit) repo, plugin `perimetre-apps`: see the `app-code-review` skill's `references/*.md` (services, error handling, tRPC, TanStack Query, GraphQL, forms, icons), plus the `app-caching` and `seo` skills.

**Access pattern**: Always use absolute GitHub URLs when referencing docs:

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

### UI SDK Forms Example (`examples/ui-sdk-forms/`)

React Hook Form + Zod with UI SDK form controls:

- `register()` for `Input`, `Textarea` and a native `<select>`
- `Controller` for `Checkbox`, `RadioGroup`, `Select` and `Combobox`
- Errors through `Field invalid` and `FieldError`

Standalone, not part of the pnpm workspace: install with `pnpm install --ignore-workspace`.

**Key files**: See `examples/ui-sdk-forms/README.md` for details

## Important Notes

- Configuration packages are configs only (no `dev` scripts needed)
- Utility packages (service-builder, helpers, icons, classnames) ship built code
- All packages private to organization (access: restricted)
- Uses GitHub Package Registry, NOT npm public registry
- Changesets creates automated version PR after merging
- Turborepo caches builds to avoid redundant work
- `workspace:*` protocol ensures local development uses local packages
- Always use absolute GitHub URLs when referencing documentation

## Writing Documentation

Two rules hold for every doc in this repo.

**Reference the source, document the delta.** When something is built on another project or package, link its docs and write only what we add or do differently. Never retell what the source already says: the copy goes stale and nobody knows which one to trust. `packages/ui-behaviors` documents what it adds to UI SDK and nothing of UI SDK itself. A package README does not repeat this file, and this file does not repeat a package README.

**Write for the reader the file has.**

| File                                | Reader                                | Holds                                                     |
| ----------------------------------- | ------------------------------------- | --------------------------------------------------------- |
| `README.md` (root and each package) | A person                              | What it is, why it exists, how to start, where to go next |
| `SKILL.md` and its `references/`    | An agent doing the work               | Rules, entry points, file paths, what gets missed         |
| JSDoc                               | An agent or a person at the call site | The API: every option, reason, part and CSS variable      |
| `AGENTS.md`                         | An agent working in this repo         | How the repo is laid out and how to work in it            |
| `CONTRIBUTING.md`                   | A person contributing                 | Changesets and versioning                                 |

A README never lists exports, file paths inside `node_modules` or implementation rules. Those belong to the skill or the JSDoc. When a README and a skill say the same thing, cut it from the README.

**Update a README when** one of these changes, in the same pull request:

- **The root `README.md`:** a package is added, removed, renamed or deprecated; the setup, the checks to run or the release flow changes; an example is added or removed.
- **A package `README.md`:** what a person can do with the package changes, or how they start. A new export alone is not a reason: update the skill or the JSDoc.

Keep a README short enough to read in two minutes. Link to the package README from the root rather than describing the package twice.

`CLAUDE.md` is a symlink to this file. Edit `AGENTS.md`.

## Troubleshooting

### Named `group/` and `peer/` in PUI components

When using named Tailwind groups or peers (e.g., `group/myName`, `peer/myName`) inside `@perimetre/ui` components, you **must** include both the unprefixed and `pui:`-prefixed marker class. The `@custom-variant pui` integration used by consumer apps generates selectors that reference the unprefixed group name, while the DOM class includes the `pui:` prefix.

```tsx
{
  /* Always use both */
}
<div className="group/myName pui:group/myName">
  <div className="pui:group-hover/myName:opacity-100">...</div>
</div>;
```

See `packages/ui/docs/tailwind-named-groups-and-peers.md` for full details.

## Commands Reference

```bash
pnpm install              # Install all dependencies
pnpm turbo run build      # Build all packages
pnpm test                 # Run every package's tests (turbo run test)
pnpm changeset            # Create changeset for version bump
pnpm version              # Apply changesets (usually in CI)
pnpm release              # Build + publish (usually in CI)
```

## Current State

- 14 published packages (7 configs + 4 utilities + UI behaviours + the deprecated component library)
- CI/CD pipelines with automated releases
- Pattern guides maintained in the ai-toolkit repo (`perimetre-apps` plugin)
- Working examples for tRPC, GraphQL and UI SDK form patterns
- Apps own their components, built from UI SDK and `@perimetre/ui-behaviors`. `@perimetre/ui` is deprecated
- Authentication via GitHub CLI for developers

**For contributing and commit guidelines**: `@CONTRIBUTING.md`
**For setup instructions**: `@README.md`

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
