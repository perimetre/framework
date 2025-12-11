import { FlatCompat } from '@eslint/eslintrc';
import eslint from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import eslintPluginJsonc from 'eslint-plugin-jsonc';
import perfectionist from 'eslint-plugin-perfectionist';
import playwright from 'eslint-plugin-playwright';
import { defineConfig, globalIgnores } from 'eslint/config';
import { dirname } from 'path';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

/**
 * Our base ESLint configuration
 * It ensures a solid foundation for linting JavaScript and TypeScript projects. It makes sure that:
 * - Code quality and consistency are maintained across the codebase.
 * - Properties are correctly named, sorted, and structured.
 *
 * This configuration should work for both frontend and backend projects. Unrelated with react
 */
export default defineConfig(
  globalIgnores([
    '**/__generated__/',
    'node_modules/',
    '**/node_modules/',
    '**/node_modules/**',
    'dist/',
    '**/dist/**',
    'build/',
    '**/build/**',
    'next-env.d.ts',
    '**/*.d.ts',
    '**/*.d.mts',
    '**/*.d.cts',
    '.idea/',
    '**/.idea/**',
    '.next/',
    '**/.next/**',
    '.github/',
    '**/.github/**',
    'test-results/',
    '**/test-results/**',
    'playwright-report/',
    '**/playwright-report/**',
    'graphql.schema.json',
    'schema.graphql',
    '.claude/',
    '**/.claude/**',
    '.wrangler/',
    '**/.wrangler/**',
    '.turbo/',
    '**/.turbo/**'
  ]),

  // Added flat recommended configs
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked.map((x) => ({
    ...x,
    files: ['**/*.ts', '**/*.tsx']
  })),
  ...tseslint.configs.stylisticTypeChecked.map((x) => ({
    ...x,
    files: ['**/*.ts', '**/*.tsx']
  })),

  // Make sure destructured keys are sorted
  ...compat.plugins('sort-destructure-keys'),
  {
    rules: {
      'sort-destructure-keys/sort-destructure-keys': 'error'
    }
  },

  // Sort various TypeScript constructs
  {
    plugins: {
      perfectionist
    },
    rules: {
      'perfectionist/sort-interfaces': 'error',
      'perfectionist/sort-intersection-types': 'error',
      'perfectionist/sort-modules': 'error',
      'perfectionist/sort-object-types': 'error',
      'perfectionist/sort-union-types': 'error',
      'perfectionist/sort-variable-declarations': 'error'
    }
  },

  // Extra TypeScript rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          fixStyle: 'inline-type-imports'
        }
      ],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              message:
                'Prefer importing individual functions from "lodash". Eg. import uniqBy from "lodash/uniqBy"',
              name: 'lodash'
            },
            {
              message: 'Use dayjs instead',
              name: 'moment'
            }
          ],
          patterns: []
        }
      ]
    }
  },

  // JSON
  ...eslintPluginJsonc.configs['flat/recommended-with-json'].map((x) => ({
    ...x,
    files: ['**/*.json', '**/*.jsonc', '**/*.json5']
  })),
  {
    files: ['**/*.json', '**/*.jsonc', '**/*.json5'],
    rules: {
      'jsonc/no-comments': 'off',
      'jsonc/sort-keys': 'error'
    }
  },

  // JSDoc rules
  {
    ...jsdoc.configs['flat/recommended-typescript'],
    ignores: ['**/src/app/**'],
    rules: {
      ...jsdoc.configs['flat/recommended-typescript'].rules,
      // We are using prettier already, and sometimes it conflicts with this
      'jsdoc/check-alignment': 'off',
      'jsdoc/require-description': 'error',
      'jsdoc/require-jsdoc': [
        'error',
        {
          require: {
            ArrowFunctionExpression: true,
            ClassDeclaration: true,
            ClassExpression: true,
            FunctionDeclaration: true,
            FunctionExpression: true,
            MethodDefinition: true
          }
        }
      ]
    }
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    rules: {
      // We are using typescript already
      'jsdoc/require-param': 'off',
      // We are using typescript already
      'jsdoc/require-param-type': 'off',
      // We are using typescript already
      'jsdoc/require-returns': 'off',
      // We are using typescript already
      'jsdoc/require-returns-type': 'off'
    }
  },
  // Disable JSDoc type checking for .mjs files since we're using JSDoc for TypeScript declaration generation
  {
    files: ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
    rules: {
      'jsdoc/check-tag-names': 'off'
    }
  },

  // Tests
  {
    ...playwright.configs['flat/recommended'],
    files: [
      'tests/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx'
    ],
    rules: {
      ...playwright.configs['flat/recommended'].rules
    }
  }
);
