# @perimetre/ui

## 13.3.0

### Minor Changes

- bbba3e2: Added image carousel component

## 13.2.0

### Minor Changes

- 5fb0425: Added badge component

## 13.1.4

### Patch Changes

- 20e696a: Fixes radio button scoping

## 13.1.3

### Patch Changes

- 0d163f1: Splitting tailwind utilities

## 13.1.2

### Patch Changes

- 87f1246: Updates preflight declaration

## 13.1.1

### Patch Changes

- 49fcd47: Fix TypeScript declaration file resolution for deep imports. The package.json exports now correctly maps type declarations to match the nested directory structure created by vite-plugin-dts. This supports both directory imports (e.g., `@perimetre/ui/components/Field/FieldInput` → `./dist/components/Field/FieldInput/index.d.ts`) and direct file imports (e.g., `@perimetre/ui/components/Button/brands/Button.acorn.brand.js` → `./dist/components/Button/brands/Button.acorn.brand.d.ts`).

## 13.1.0

### Minor Changes

- 7b8b010: Tokenizing ui

## 13.0.0

### Major Changes

- 027a5a5: UI Refactor

## 0.0.1

### Patch Changes

- 1a4325a: Initial export
