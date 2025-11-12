# Perimetre Framework Monorepo - Project Context Summary

## Project Overview

**Purpose**: Private monorepo for shared configurations and tooling packages (ESLint, Prettier, TSConfig, Tailwind) used across organization projects.  
**Stack**: Turborepo + pnpm + Changesets + GitHub Package Registry (private)  
**Repository**: `@perimetre/framework` on GitHub

## Technical Architecture

### Core Technologies

- **Monorepo Tool**: Turborepo (caching, parallel builds, dependency management)
- **Package Manager**: pnpm with workspaces
- **Versioning**: Changesets (semantic versioning, changelog generation, PR-based releases)
- **Registry**: GitHub Package Registry (private, org-scoped: `@perimetre/*`)
- **CI/CD**: GitHub Actions (automated testing and publishing)

### Directory Structure

```
framework/
├── .changeset/           # Changesets config
├── .github/workflows/    # CI/CD pipelines
├── packages/
│   ├── eslint-config-base/      # Base ESLint rules
│   ├── eslint-config-nextjs/    # Next.js ESLint (extends base)
│   ├── prettier-config/         # Prettier configuration
│   └── tailwind-config/         # Tailwind CSS configuration
├── package.json                 # Root package (private)
├── pnpm-workspace.yaml          # Workspace configuration
├── turbo.json                   # Turborepo pipeline config
└── .npmrc                       # Registry configuration
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

## Package Relationships

- `@perimetre/eslint-config-base` - standalone base configuration
- `@perimetre/eslint-config-nextjs` - extends base, adds React/Next.js rules
- Packages can depend on each other using `workspace:*`
- Changesets handles cross-package version bumps automatically

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

## Important Notes

- No `dev` scripts needed - packages are configs only, not applications
- All packages are private to organization (access: restricted)
- Uses GitHub Package Registry, NOT npm public registry
- Changesets creates PR for human review before publishing
- Turborepo caches builds to avoid redundant work
- `workspace:*` protocol ensures local development uses local packages

## Commands Reference

```bash
pnpm install              # Install all dependencies
pnpm turbo run build      # Build all packages
pnpm changeset            # Create changeset for version bump
pnpm version              # Apply changesets (usually in CI)
pnpm release              # Build + publish (usually in CI)
```

## Current State

- Initial packages created for ESLint (base + Next.js) and TypeScript configs
- CI/CD pipelines configured for automated publishing
- Changesets configured for PR-based releases
- Authentication handled via GitHub CLI for developers

About contributing and commit guidelines:
@CONTRIBUTING.md

Project readme:
@README.md
