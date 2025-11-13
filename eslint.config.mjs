import baseConfig from '@perimetre/eslint-config-base';
import { globalIgnores } from 'eslint/config';

/**
 * Root ESLint configuration for the framework monorepo
 */
export default [
  ...baseConfig,
  globalIgnores(['.turbo']),
  {
    languageOptions: {
      parserOptions: {
        // Disable type-aware linting for the root since we don't have a tsconfig
        projectService: false
      }
    },
    // Override rules that require type information for non-TypeScript files
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off'
    }
  }
];
