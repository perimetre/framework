---
'@perimetre/eslint-config-nextjs': major
'@perimetre/eslint-config-react': patch
---

### `@perimetre/eslint-config-nextjs` (major)

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
