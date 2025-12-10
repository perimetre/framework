# @perimetre/eslint-config-base

## 0.2.6

### Patch Changes

- 6276838: Fix json parser override

## 0.2.5

### Patch Changes

- 485ba17: Fixes json import

## 0.2.4

### Patch Changes

- 671fd20: Fixes json parsing on base eslint config

## 0.2.3

### Patch Changes

- 8ff19e0: Fix build script that would npm install in a loop

## 0.2.2

### Patch Changes

- 94bf27b: Updates packages

## 0.2.1

### Patch Changes

- dacc762: New License

## 0.2.0

### Minor Changes

- 51477e5: Removes root dir config that would not work

## 0.1.2

### Patch Changes

- 95e1a13: Fix TypeScript parser configuration to support JSON files and config files. Added `extraFileExtensions` for `.json` files and `allowDefaultProject` for config files like `*.config.mjs`, `*.config.js`, and `*.config.ts`.

## 0.1.1

### Patch Changes

- 2c0a097: Updated ignored paths

## 0.1.0

### Minor Changes

- e5ab0c0: Add TypeScript declaration generation and migrate to ESLint 9 best practices
  - Add TypeScript declaration files (.d.mts) generation for all packages
  - Migrate from deprecated tseslint.config() to modern defineConfig() from eslint/config
  - Add proper package exports configuration for better module resolution
  - Add generated declaration files to global ignores
  - Fix ESLint configuration to follow 2025 ESLint 9 flat config best practices
  - Update turbo.json to cache TypeScript declaration outputs

## 0.0.2

### Patch Changes

- d37fcc5: Version bump for all packages

## 0.0.1

### Patch Changes

- efb2c25: Added Prettier config
  Fixed Eslint set-up
