import baseConfig from '@perimetre/eslint-config-base';
import { globalIgnores } from 'eslint/config';

/**
 * Root ESLint configuration for the framework monorepo
 */
export default [
  ...baseConfig,
  globalIgnores(['.turbo', 'examples/**']),
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  }
];
