import { FlatCompat } from '@eslint/eslintrc';
import eslint from '@eslint/js';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importX from 'eslint-plugin-import-x';
import jsdoc from 'eslint-plugin-jsdoc';
import eslintPluginJsonc from 'eslint-plugin-jsonc';
import perfectionist from 'eslint-plugin-perfectionist';
import playwright from 'eslint-plugin-playwright';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import { defineConfig, globalIgnores } from 'eslint/config';
import { dirname } from 'path';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';
import {
  cachedFailureSyntax,
  NAV_LINK_FILES,
  okFalseSyntax,
  restrictedImports,
  restrictedProperties,
  restrictedSyntax,
  SERVER_FILES
} from './restrictions.mjs';

export { restrictedImports, restrictedSyntax } from './restrictions.mjs';

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
      // The core rule, not typescript-eslint's: a project's own
      // `@typescript-eslint/no-restricted-imports` list, which the ai-toolkit
      // setup writes, then adds to ours instead of replacing it
      'no-restricted-imports': ['error', restrictedImports()],
      // No `as` on network, DB or CMS data; any other `as` says why
      // (app-best-practices: typescript/index.md, code-hygiene/index.md)
      '@typescript-eslint/no-unsafe-type-assertion': 'warn',
      'no-restricted-properties': ['error', ...restrictedProperties]
    }
  },
  {
    // The one file that wraps next/link
    files: NAV_LINK_FILES,
    rules: {
      'no-restricted-imports': ['error', restrictedImports({ navLink: false })]
    }
  },

  // Rules every file follows. Our conventions come from the ai-toolkit
  // `app-best-practices` skill, and each rule names the topic it enforces:
  // https://github.com/perimetre/ai-toolkit/blob/main/plugins/perimetre-apps/skills/app-best-practices
  {
    plugins: {
      'import-x': importX,
      unicorn: eslintPluginUnicorn
    },
    rules: {
      // No circular deps (app-best-practices: services/index.md)
      'import-x/no-cycle': 'error',
      'no-restricted-syntax': ['error', ...restrictedSyntax],
      // A disable comment names the rules it disables
      // (app-best-practices: code-hygiene/index.md)
      'unicorn/no-abusive-eslint-disable': 'error'
    },
    settings: {
      // TypeScript's extensions and parser, so import-x follows .ts imports
      ...Object.fromEntries(
        Object.entries(importX.flatConfigs.typescript.settings).filter(
          ([key]) => key !== 'import-x/resolver'
        )
      ),
      'import-x/resolver-next': [createTypeScriptImportResolver()]
    }
  },
  {
    // A server domain's own files reach into each other
    files: SERVER_FILES,
    rules: {
      'no-restricted-imports': [
        'error',
        restrictedImports({ serverBoundary: false })
      ],
      'no-restricted-syntax': [
        'error',
        ...restrictedSyntax,
        ...cachedFailureSyntax
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
      ...playwright.configs['flat/recommended'].rules,
      // Mocks return { ok: false } for fetch's Response
      'no-restricted-syntax': [
        'error',
        ...restrictedSyntax.filter((entry) => !okFalseSyntax.includes(entry))
      ]
    }
  }
);
