import nextPlugin from '@next/eslint-plugin-next';
import reactCompiler from 'eslint-plugin-react-compiler';
import { defineConfig } from 'eslint/config';

/**
 * Next.js ESLint configuration
 * Uses `@next/eslint-plugin-next` directly (flat config) to avoid plugin conflicts
 * with eslint-config-react (which registers react-hooks separately).
 */
export default defineConfig(
  nextPlugin.configs['core-web-vitals'],
  {
    plugins: {
      'react-compiler': reactCompiler
    },
    rules: {
      'react-compiler/react-compiler': 'error'
    }
  },
  {
    // Next.js 16 runs src/proxy.ts (app-best-practices:
    // project-structure/index.md)
    files: [
      '**/src/middleware.ts',
      '**/src/middleware.js',
      'middleware.ts',
      'middleware.js'
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          message:
            'The proxy file is src/proxy.ts: a middleware.ts never runs, so nothing in it takes effect. See the app-best-practices skill in perimetre/ai-toolkit: references/project-structure/index.md',
          selector: 'Program'
        }
      ]
    }
  }
);
