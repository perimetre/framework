import base from '@perimetre/eslint-config-base';
import end from '@perimetre/eslint-config-base/end';
import nextjs from '@perimetre/eslint-config-nextjs';
import react from '@perimetre/eslint-config-react';
import trpc from '@perimetre/eslint-config-trpc';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
  ...base,
  ...nextVitals,
  ...nextTs,
  ...react,
  ...nextjs,
  ...trpc, // tRPC-specific rule adjustments
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
    files: ['**/*.ts', '**/*.tsx', '**/*.mts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  }
]);

export default eslintConfig;
