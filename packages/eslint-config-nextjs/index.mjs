import reactCompiler from 'eslint-plugin-react-compiler';

/**
 * Next.js 15 ESLint configuration
 */
export default [
  {
    plugins: {
      'react-compiler': reactCompiler
    },
    rules: {
      'react-compiler/react-compiler': 'error'
    }
  }
];
