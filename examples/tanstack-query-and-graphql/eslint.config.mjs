import base from '@perimetre/eslint-config-base';
import end from '@perimetre/eslint-config-base/end';
import nextjs from '@perimetre/eslint-config-nextjs';
import react from '@perimetre/eslint-config-react';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
  ...base,
  ...nextVitals,
  ...nextTs,
  ...react,
  ...nextjs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts'
  ]),
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
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              message: 'Import from "@/server/graphql"',
              name: 'graphql-request'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['**/*.json'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off'
    }
  }
]);

export default eslintConfig;
