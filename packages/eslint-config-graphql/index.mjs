import graphqlPlugin from '@graphql-eslint/eslint-plugin';
import { defineConfig } from 'eslint/config';

/**
 * GraphQL ESLint configuration
 * This configuration ensures that GraphQL queries and schemas follow best practices.
 */
export default defineConfig({
  files: ['src/**/*graphql'],
  languageOptions: {
    parser: graphqlPlugin.parser
  },
  plugins: {
    '@graphql-eslint': graphqlPlugin
  },
  rules: {
    ...graphqlPlugin.configs['flat/operations-recommended'].rules
  }
});
