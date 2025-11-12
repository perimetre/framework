import graphqlPlugin from '@graphql-eslint/eslint-plugin';

/**
 * GraphQL ESLint configuration
 * This configuration ensures that GraphQL queries and schemas follow best practices.
 */
export default [
  {
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
  }
];
