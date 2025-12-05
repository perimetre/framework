# @perimetre/helpers

## 5.1.1

### Patch Changes

- 94bf27b: Updates packages

## 5.1.0

### Minor Changes

- bcce6b1: New `ForceRequiredProps` type

## 5.0.1

### Patch Changes

- dacc762: New License

## 5.0.0

### Major Changes

- c6d2150: Complete rewrite and modernization of @perimetre/helpers package

  ## Breaking Changes

  **IMPORTANT**: This is a major version with breaking changes. All imports must be updated.

  ### Required Migration

  The package no longer supports barrel imports. You must import from specific modules:

  ```typescript
  // ❌ OLD (no longer works)
  import { insertIntoArray, slugify } from '@perimetre/helpers';

  // ✅ NEW (required)
  import { insertIntoArray } from '@perimetre/helpers/array';
  import { slugify } from '@perimetre/helpers/string';
  ```

  ## New Features

  ### Tree-Shakeable Architecture
  - Each helper module is completely isolated
  - Client-safe modules don't bundle Node.js dependencies
  - Importing `@perimetre/helpers/array` won't include csv-parse, faker, or fs

  ### Zero Configuration
  - Wildcard exports automatically expose new helpers
  - No package.json updates needed when adding helpers
  - Modern ESM-only package with full TypeScript support

  ### Clean Structure
  - Flat source structure under `src/`
  - No barrel exports (index.ts anti-pattern removed)
  - Single wildcard export pattern for all modules

  ## Available Modules

  **Client-safe (work in browser and Node.js):**
  - `@perimetre/helpers/array` - Array manipulation
  - `@perimetre/helpers/clipboard` - Browser clipboard utilities
  - `@perimetre/helpers/object` - Object manipulation
  - `@perimetre/helpers/string` - String utilities (slugify, etc.)
  - `@perimetre/helpers/predicates` - Type predicates
  - `@perimetre/helpers/predicates/value` - Value predicates
  - `@perimetre/helpers/predicates/array` - Array predicates
  - `@perimetre/helpers/predicates/object` - Object predicates
  - `@perimetre/helpers/types` - TypeScript utility types
  - `@perimetre/helpers/mappers` - Value mappers

  **Server-only (require Node.js):**
  - `@perimetre/helpers/csv` - CSV parsing/generation
  - `@perimetre/helpers/file` - File system utilities
  - `@perimetre/helpers/url` - URL utilities

  ## Migration Guide

  See MIGRATION.md in the package for detailed migration examples.
