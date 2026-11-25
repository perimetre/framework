import base, { restrictedImports } from '@perimetre/eslint-config-base';
import end from '@perimetre/eslint-config-base/end';
import react from '@perimetre/eslint-config-react';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import { defineConfig } from 'eslint/config';

const eslintConfig = defineConfig([
  ...base,
  // React is used by the stories only. The package itself has none.
  ...react.map((config) => {
    // Explicitly register jsx-a11y plugin for monorepo compatibility
    if (config.plugins && Object.keys(config.plugins).length === 0) {
      return {
        ...config,
        plugins: {
          'jsx-a11y': jsxA11y
        }
      };
    }
    return config;
  }),
  // The deprecated packages point here. Nothing here points back. The base
  // config bans them too; this keeps the package's own message
  {
    rules: {
      'no-restricted-imports': [
        'error',
        restrictedImports({
          patterns: [
            {
              group: [
                '@perimetre/ui',
                '@perimetre/ui/*',
                '@perimetre/icons',
                '@perimetre/classnames',
                '@perimetre/tokens',
                '@perimetre/tokens/*'
              ],
              message:
                'Deprecated. @perimetre/ui-behaviors must not depend on it.'
            }
          ]
        })
      ]
    }
  },
  ...end,
  // Override parser options to use correct project root
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  {
    rules: {
      'react/prop-types': 'off'
    }
  }
]);

export default eslintConfig;
