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
  },
  // Disable JSDoc requirements for story files (Storybook/Ladle documentation)
  {
    files: ['**/*.stories.ts', '**/*.stories.tsx'],
    rules: {
      'jsdoc/require-description': 'off',
      'jsdoc/require-jsdoc': 'off'
    }
  }
];
