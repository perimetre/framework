import reactCompiler from 'eslint-plugin-react-compiler';
import { defineConfig } from 'eslint/config';

/**
 * Next.js 15 ESLint configuration
 * Adds React Compiler rules for Next.js projects
 */
export default defineConfig({
  plugins: {
    'react-compiler': reactCompiler
  },
  rules: {
    'react-compiler/react-compiler': 'error'
  }
});
