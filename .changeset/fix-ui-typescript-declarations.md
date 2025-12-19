---
'@perimetre/ui': patch
---

Fix TypeScript declaration file resolution for deep imports. The package.json exports now correctly maps type declarations to match the nested directory structure created by vite-plugin-dts. This supports both directory imports (e.g., `@perimetre/ui/components/Field/FieldInput` → `./dist/components/Field/FieldInput/index.d.ts`) and direct file imports (e.g., `@perimetre/ui/components/Button/brands/Button.acorn.brand.js` → `./dist/components/Button/brands/Button.acorn.brand.d.ts`).
