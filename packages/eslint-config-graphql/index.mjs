import graphqlPlugin from '@graphql-eslint/eslint-plugin';

/**
 * GraphQL ESLint configuration
 * This configuration ensures that GraphQL queries and schemas follow best practices.
 * It works with both .graphql files and GraphQL code in .ts/.tsx/.js/.jsx files with gql tags/functions.
 *
 * Note: This config is designed to be composed with other configs that target the same file types.
 * The processor extracts GraphQL from code files, and subsequent configs lint those extracted blocks.
 *
 * Limitations:
 * - Automatic formatting via Prettier does not work for GraphQL inside gql() function calls
 * - This is a known limitation of eslint-plugin-prettier with processors
 * - GraphQL inside gql() calls must be formatted manually
 */
export default [
  // Step 1: Process TypeScript/JavaScript files to extract GraphQL operations (gql tags/functions)
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    processor: graphqlPlugin.processor
  },
  // Step 2: Lint ALL .graphql files (both standalone and processor-extracted)
  {
    files: ['**/*.graphql'],
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
