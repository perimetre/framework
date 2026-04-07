# @perimetre/eslint-config-nextjs

## 1.0.0

### Major Changes

- b0508e0: ### `@perimetre/eslint-config-nextjs` (major)

  **BREAKING:** Replaced `eslint-config-next` (FlatCompat wrapper) with `@next/eslint-plugin-next` native flat config.

  **Why:** The old approach used `FlatCompat` to wrap the legacy `eslint-config-next`, which internally registered `eslint-plugin-react-hooks` v5. When composed with `@perimetre/eslint-config-react` (which registers v7), ESLint threw "Cannot redefine plugin `react-hooks`". This made the two configs unusable together, forcing projects like sprig-dental to skip `eslint-config-nextjs` entirely.

  **How to update:**
  - `@next/eslint-plugin-next` is now `^16.0.0` — requires Next.js >= 15
  - The following dependencies were **removed** from the package (no longer needed):
    - `@eslint/eslintrc`
    - `eslint-config-next`
    - `eslint-plugin-react-hooks` (provided by `@perimetre/eslint-config-react`)
  - If your project depended on `eslint-config-next` rules beyond core-web-vitals being pulled in transitively, add `@next/eslint-plugin-next` directly

  No changes to how you consume the config:

  ```js
  export default [
    ...baseConfig,
    { plugins: { 'jsx-a11y': jsxA11y } },
    ...reactConfig,
    ...nextjsConfig,
    ...endConfig
  ];
  ```

  ### `@perimetre/eslint-config-react` (minor)

  Added documentation comments explaining the `jsx-a11y` plugin registration requirement. The react config applies jsx-a11y rules but intentionally does not register the plugin (to avoid "Cannot redefine plugin" errors). Consumers must register it before spreading the react config:

  ```js
  import jsxA11y from 'eslint-plugin-jsx-a11y';
  { plugins: { 'jsx-a11y': jsxA11y } },
  ...reactConfig,
  ```

## 0.1.4

### Patch Changes

- 6b4d7e9: Update package versions

## 0.1.3

### Patch Changes

- de6a3aa: Fix next peer dependencies

## 0.1.2

### Patch Changes

- 94bf27b: Updates packages

## 0.1.1

### Patch Changes

- dacc762: New License

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
