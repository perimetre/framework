import base from '@perimetre/eslint-config-base';
import end from '@perimetre/eslint-config-base/end';
import react from '@perimetre/eslint-config-react';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import { defineConfig } from 'eslint/config';

const eslintConfig = defineConfig([
  ...base,
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
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              message: 'Use `cn` from "@perimetre/classnames" instead',
              name: 'clsx'
            },
            {
              importNames: ['cva', 'compose', 'cx'],
              message: 'Use `cva` from "@/lib/cva" instead',
              name: 'cva'
            }
          ],
          patterns: [
            {
              group: ['@radix-ui/*', '!@radix-ui/react-icons'],
              message: 'Import Radix UI components from "radix-ui" instead'
            }
          ]
        }
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
