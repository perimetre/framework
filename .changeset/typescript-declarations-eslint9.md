---
'@perimetre/eslint-config-base': minor
'@perimetre/eslint-config-graphql': minor
'@perimetre/eslint-config-nextjs': minor
'@perimetre/eslint-config-react': minor
---

Add TypeScript declaration generation and migrate to ESLint 9 best practices

- Add TypeScript declaration files (.d.mts) generation for all packages
- Migrate from deprecated tseslint.config() to modern defineConfig() from eslint/config
- Add proper package exports configuration for better module resolution
- Add generated declaration files to global ignores
- Fix ESLint configuration to follow 2025 ESLint 9 flat config best practices
- Update turbo.json to cache TypeScript declaration outputs
