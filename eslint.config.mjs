import baseConfig from '@perimetre/eslint-config-base';
import reactConfig from '@perimetre/eslint-config-react';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import { globalIgnores } from 'eslint/config';

/**
 * Root ESLint configuration for the framework monorepo
 */
export default [
  ...baseConfig,
  globalIgnores(['.turbo', 'examples/**', 'packages/tokens/src/sets/**/*']),
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  // Apply React config to UI package
  ...reactConfig.map((config) => {
    // Explicitly register jsx-a11y plugin for monorepo compatibility
    if (config.plugins && Object.keys(config.plugins).length === 0) {
      return {
        ...config,
        files: ['packages/ui/**/*.{jsx,tsx}'],
        plugins: {
          'jsx-a11y': jsxA11y
        }
      };
    }
    return {
      ...config,
      files: ['packages/ui/**/*.{jsx,tsx}']
    };
  }),
  // Disable JSDoc requirements for story files (Storybook/Ladle documentation)
  {
    files: ['**/*.stories.ts', '**/*.stories.tsx'],
    rules: {
      'jsdoc/require-description': 'off',
      'jsdoc/require-jsdoc': 'off'
    }
  }
];
