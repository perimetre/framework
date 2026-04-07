import nextPlugin from '@next/eslint-plugin-next';
import reactCompiler from 'eslint-plugin-react-compiler';
import { defineConfig } from 'eslint/config';

/**
 * Next.js ESLint configuration
 * Uses @next/eslint-plugin-next directly (flat config) to avoid plugin conflicts
 * with eslint-config-react (which registers react-hooks separately).
 */
export default defineConfig(nextPlugin.configs['core-web-vitals'], {
  plugins: {
    'react-compiler': reactCompiler
  },
  rules: {
    'react-compiler/react-compiler': 'error'
  }
});
