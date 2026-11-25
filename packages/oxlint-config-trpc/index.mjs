/**
 * Oxlint configuration for tRPC projects, the Oxlint counterpart of
 * `@perimetre/eslint-config-trpc`. Extend it after
 * `@perimetre/oxlint-config-base`.
 *
 * It switches off the type-aware rules that read tRPC's generics as unsafe,
 * and the JSDoc requirements for self-documenting procedures.
 * @see https://github.com/perimetre/framework/tree/main/packages/eslint-config-trpc
 * @type {import('oxlint').OxlintConfig}
 */
const config = {
  rules: {
    // tRPC's generics appear unsafe to the type checker but are type-safe
    'typescript/no-unsafe-argument': 'off',
    'typescript/no-unsafe-assignment': 'off',
    'typescript/no-unsafe-call': 'off',
    'typescript/no-unsafe-member-access': 'off',
    'typescript/no-unsafe-return': 'off',

    // Numbers in template strings (IDs, durations)
    'typescript/restrict-template-expressions': 'off',
    // Router.push and other methods
    'typescript/unbound-method': 'off',
    // Empty Meta type for procedures
    'typescript/no-empty-object-type': 'off',
    // Mutation calls don't need await
    'typescript/no-floating-promises': 'off',
    // Async routers may return static data
    'typescript/require-await': 'off',

    // JSDoc can be verbose for self-documenting tRPC procedures
    'jsdoc-js/require-description': 'off',
    'jsdoc-js/require-jsdoc': 'off'
  }
};

export default config;
