# Contributing to Perimetre Framework

Thank you for contributing to the Perimetre Framework monorepo! This guide will help you understand our development workflow, versioning process, and how to submit changes.

## Overview

This monorepo uses [Changesets](https://github.com/changesets/changesets) to manage versioning and changelog generation. Changesets allow you to declare version bumps and document changes alongside your code.

## When to Create a Changeset

Create a changeset when you:

- Add new features
- Fix bugs
- Make breaking changes
- Update dependencies that affect consumers

**Skip changesets for:**

- Documentation-only changes
- Internal tooling updates that don't affect published packages
- CI/CD configuration changes

## Creating a Changeset

### 1. Make Your Code Changes

```bash
git checkout -b feature/your-feature
# Make your changes...
```

### 2. Run the Changeset Command

```bash
pnpm changeset
```

### 3. Follow the Interactive Prompts

**Which packages changed?**

- Use arrow keys and spacebar to select affected packages
- Select all packages that have changes

**What type of change?**

- **Patch (0.0.x)** - Bug fixes, dependency updates, internal improvements
- **Minor (0.x.0)** - New features, backward-compatible additions
- **Major (x.0.0)** - Breaking changes, API changes, removal of features

**Write a summary:**

- Write a clear, concise description
- This becomes your changelog entry
- Use imperative mood: "Add feature" not "Added feature"
- Example: "Add support for TypeScript 5.0"

### 4. Commit the Changeset File

**IMPORTANT**: You MUST commit the changeset `.md` file(s) to your branch!

```bash
# Add your code changes AND the changeset file
git add .
git commit -m "feat: add new feature"

# Push to trigger pre-push validation
git push
```

The changeset files are NOT in `.gitignore` - they must be committed and pushed with your PR. The CI will consume (delete) them later during the automated release process.

## Semantic Versioning Guide

### Patch (0.0.x) - Bug Fixes & Updates

```markdown
- Fix linting rule configuration
- Update dependency versions
- Improve error messages
- Fix documentation typos
```

### Minor (0.x.0) - New Features

```markdown
- Add new ESLint rules
- Add new configuration options
- Extend Tailwind theme
- Add new utility functions
```

### Major (x.0.0) - Breaking Changes

```markdown
- Remove deprecated rules
- Change default configuration
- Require new peer dependencies
- Rename exported functions
```

## How Changesets Work

### Developer Workflow

1. **Create changeset** with your PR (you choose the version bump)
2. **Commit changeset file** (`.changeset/random-name.md`)
3. **Create PR** and merge to main

### Automated Release Workflow

1. **Changesets bot** detects changesets on main
2. **Version PR created** automatically with:
   - Updated package.json versions
   - Generated CHANGELOG.md entries
   - Consumed (deleted) changeset files
3. **Merge version PR** to trigger automated publishing
4. **Packages published** to GitHub Package Registry

### "Consuming Changesets"

When the version command runs (in the Version PR):

- All `.changeset/*.md` files are read
- Package versions are bumped according to your specifications
- CHANGELOG.md files are generated/updated
- Changeset files are **deleted (consumed)**
- All changes (version bumps, CHANGELOGs, deleted changesets) are **automatically committed and pushed** by the CI

The CI has write permissions (`contents: write`) to automatically commit and push the version changes back to the Version PR.

## Internal Dependencies

When you update a package that other packages depend on:

- The dependent packages automatically get a **patch** bump
- This is controlled by `"updateInternalDependencies": "patch"` in `.changeset/config.json`

**Example:**

- You bump `@perimetre/eslint-config-base` from 1.0.0 → 1.1.0 (minor)
- `@perimetre/eslint-config-nextjs` automatically bumps from 1.0.0 → 1.0.1 (patch)

## Example Changeset File

`.changeset/cool-feature.md`:

```markdown
---
'@perimetre/eslint-config-base': minor
'@perimetre/eslint-config-nextjs': patch
---

Add support for TypeScript 5.0 strict rules and update Next.js recommended config
```

## Changelog Generation

Changelogs are **automatically generated** during the version step:

```markdown
# @perimetre/eslint-config-base

## 1.1.0

### Minor Changes

- abc1234: Add support for TypeScript 5.0 strict rules and update Next.js recommended config
```

- Commit hashes are included automatically
- Your changeset description becomes the changelog entry
- Entries are grouped by version and change type

## Commands Reference

```bash
# Create a changeset (run this after making changes)
pnpm changeset

# Check changeset status (see which packages will be published)
pnpm changeset status

# Apply changesets and update versions (usually automated in CI)
pnpm changeset version

# Build and publish packages (usually automated in CI)
pnpm release
```

## Common Scenarios

### Scenario 1: Bug Fix in One Package

```bash
# Fix bug in eslint-config-base
pnpm changeset
# Select: @perimetre/eslint-config-base
# Choose: patch
# Write: "Fix import resolution for TypeScript configs"
```

### Scenario 2: New Feature Across Multiple Packages

```bash
# Add feature to both configs
pnpm changeset
# Select: @perimetre/eslint-config-base, @perimetre/eslint-config-nextjs
# Choose: minor for both
# Write: "Add new accessibility linting rules"
```

### Scenario 3: Breaking Change

```bash
# Remove deprecated rules
pnpm changeset
# Select: @perimetre/eslint-config-base
# Choose: major
# Write: "Remove deprecated 'no-console' rule override"
```

## Pre-Push Validation

This repository has a **pre-push hook** that validates changesets before you push to remote:

- **What it does**: Checks if you have changesets for modified packages
- **When it runs**: Automatically before `git push`
- **What happens**: Prompts you to create a changeset if one is missing

### Bypassing the Hook

If you need to bypass the validation (e.g., for documentation-only changes):

```bash
git push --no-verify
```

**When to bypass:**

- Documentation-only changes
- CI/CD configuration updates
- Changes that don't affect published packages
- Work-in-progress branches (though creating a changeset is still recommended)

### Hook Behavior

The hook uses `pls-changeset-me` which:

1. Detects modified packages in your commits
2. Checks if corresponding changesets exist
3. Prompts you to create one if missing
4. Allows you to skip if the change doesn't need a changeset

## Best Practices

1. **Create changesets with your PR** - Don't wait until later
2. **Be descriptive** - Write clear, helpful changelog entries
3. **Choose versions carefully** - Follow semantic versioning principles
4. **One changeset per logical change** - Don't combine unrelated changes
5. **Review the version PR** - Always check automated version bumps before merging
6. **Trust the pre-push hook** - It will remind you to create changesets

## Troubleshooting

**No changeset created?**

- Ensure you're in the monorepo root
- Run `pnpm changeset` again
- Check `.changeset/` directory for the new `.md` file

**Version PR not created?**

- Ensure changesets were merged to main
- Check GitHub Actions for errors
- Verify `.github/workflows/release.yml` is configured

**Wrong version bump?**

- You can manually edit the `.changeset/*.md` file before committing
- Change the version type in the frontmatter (major/minor/patch)

**Pre-push hook blocking you?**

- If you have package changes, create a changeset with `pnpm changeset`
- If the change doesn't need a changeset (docs/config), use `git push --no-verify`
- If the hook seems wrong, check your staged changes with `git diff origin/main...HEAD`

## Additional Resources

- [Changesets Documentation](https://github.com/changesets/changesets)
- [Semantic Versioning Guide](https://semver.org/)
- [Project README](./README.md)
