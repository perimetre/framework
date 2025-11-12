import pluginQuery from '@tanstack/eslint-plugin-query';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * Graphql base ESLint configuration
 */
export default [
  // React hooks recommended
  {
    ...reactHooks.configs['recommended-latest'],
    plugins: {
      'react-hooks': reactHooks
    }
  },

  // Acessibility rules
  {
    files: ['**/*.{jsx,mjsx,tsx,mtsx}'],
    ...jsxA11y.flatConfigs.recommended,
    languageOptions: {
      ...jsxA11y.flatConfigs.recommended.languageOptions,
      parserOptions: {
        ...jsxA11y.flatConfigs.recommended.languageOptions?.parserOptions,
        ecmaFeatures: {
          ...jsxA11y.flatConfigs.recommended.languageOptions?.parserOptions
            ?.ecmaFeatures,
          jsx: true
        }
      }
    },
    plugins: {},
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules
    }
  },

  ...pluginQuery.configs['flat/recommended'],

  {
    files: ['**/*.{jsx,mjsx,tsx,mtsx}'],
    plugins: {
      react
    },
    rules: {
      // Make sure booleans are named consistently
      'react/boolean-prop-naming': [
        'error',
        {
          rule: '^(asChild|required|open|disabled)|((can|show|allow|is|has)[A-Z]([A-Za-z0-9]?))+',
          validateNested: true
        }
      ],
      'react/jsx-boolean-value': 'error',
      // Sort the props so that they keep a consistent order
      'react/jsx-sort-props': [
        'error',
        {
          callbacksLast: true,
          multiline: 'last',
          reservedFirst: true,
          shorthandFirst: true
        }
      ],
      'react/react-in-jsx-scope': 'off',
      'react/self-closing-comp': 'error'
    }
  },

  // Ladle
  {
    files: ['**/*.stories.tsx', '**/*.stories.ts', './.ladle/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'import/no-anonymous-default-export': 'off',
      'jsdoc/require-jsdoc': 'off'
    }
  }
];
