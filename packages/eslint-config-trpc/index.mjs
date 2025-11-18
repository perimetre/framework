import { defineConfig } from 'eslint/config';

/**
 * ESLint configuration for tRPC projects
 *
 * This configuration extends the base config with tRPC-specific rule adjustments.
 * Based on official tRPC examples and production usage.
 *
 * Key adjustments:
 * - Disables strict type-safety rules that conflict with tRPC's advanced generics
 * - Maintains code quality rules (unused vars, formatting, etc.)
 * - Optimized for tRPC v11+ with React Query integration
 * @see https://github.com/trpc/examples-next-prisma-starter
 * @see https://trpc.io/docs
 */
export default defineConfig({
  files: ['**/*.ts', '**/*.tsx'],
  rules: {
    // Core tRPC type-safety rule adjustments
    // These are necessary because tRPC's generics appear 'unsafe' to ESLint
    // but are actually type-safe at runtime
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',

    // Additional rules needed for tRPC patterns
    '@typescript-eslint/restrict-template-expressions': 'off', // Numbers in template strings (IDs, durations)
    '@typescript-eslint/unbound-method': 'off', // Router.push and other methods
    '@typescript-eslint/no-empty-object-type': 'off', // Empty Meta type for procedures
    '@typescript-eslint/no-floating-promises': 'off', // Mutation calls don't need await
    '@typescript-eslint/require-await': 'off', // Async routers may return static data

    // JSDoc can be verbose for self-documenting tRPC procedures
    'jsdoc/require-description': 'off',
    'jsdoc/require-jsdoc': 'off'
  }
});
