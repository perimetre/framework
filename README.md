# @perimetre/framework

Shared configurations and tooling for Perimetre projects.

## Packages

- `@perimetre/eslint-config-base` - Base ESLint configuration
- `@perimetre/eslint-config-nextjs` - ESLint configuration for Next.js
- `@perimetre/prettier-config` - Prettier configuration
- `@perimetre/tailwind-config` - Tailwind CSS configuration

## Setup for Contributors

### Prerequisites

1. Install [pnpm](https://pnpm.io/installation)
2. Install [GitHub CLI](https://cli.github.com/)

### Initial Setup

1. Clone the repository:
   \`\`\`bash
   gh repo clone perimetre/framework
   cd framework
   \`\`\`

2. Authenticate with GitHub Package Registry:
   \`\`\`bash
   gh auth login
   gh auth token | npm config set //npm.pkg.github.com/:\_authToken /dev/stdin
   npm config set @perimetre:registry https://npm.pkg.github.com
   \`\`\`

3. Install dependencies:
   \`\`\`bash
   pnpm install
   \`\`\`

## Development Workflow

### Making Changes

1. Create a feature branch:
   \`\`\`bash
   git checkout -b feature/your-feature
   \`\`\`

2. Make your changes to packages

3. Run tests and linting:
   \`\`\`bash
   pnpm turbo run lint build
   \`\`\`

4. Create a changeset:
   \`\`\`bash
   pnpm changeset
   \`\`\`

5. Commit your changes:
   \`\`\`bash
   git add .
   git commit -m "feat: your feature description"
   \`\`\`

6. Push and create a pull request:
   \`\`\`bash
   git push -u origin feature/your-feature
   \`\`\`

### Release Process

Releases are automated when PRs are merged to main:

1. Changesets creates a "Version Packages" PR
2. Review and merge the PR
3. Packages are automatically published to GitHub Package Registry

## Using Packages in Projects

\`\`\`bash

# Authenticate (one-time)

gh auth token | npm config set //npm.pkg.github.com/:\_authToken /dev/stdin
npm config set @perimetre:registry https://npm.pkg.github.com

# Install packages

pnpm add @perimetre/eslint-config-nextjs
\`\`\`
