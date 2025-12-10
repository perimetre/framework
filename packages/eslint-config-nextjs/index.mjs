import { FlatCompat } from '@eslint/eslintrc';
import reactCompiler from 'eslint-plugin-react-compiler';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

/**
 * Next.js 15 ESLint configuration
 * Extends Next.js official ESLint config and adds React Compiler rules
 * @type {import('eslint').Linter.Config[]}
 */
const config = [
  ...compat.extends('next/core-web-vitals'),
  {
    plugins: {
      'react-compiler': reactCompiler
    },
    rules: {
      'react-compiler/react-compiler': 'error'
    }
  }
];

export default config;
