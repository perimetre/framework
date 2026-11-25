// The upstream presets our ESLint config extends, mapped to Oxlint's rule
// names, keeping the rules Oxlint implements outside nursery. Each preset lists
// what it leaves out. Oxlint ships no presets of its own, and an unknown rule
// is a config error, so these are kept in step with upstream by hand.

/**
 * `@eslint/js` `recommended`, mapped to Oxlint.
 * Left out, not in Oxlint: `no-dupe-args`, `no-octal`.
 * Left out, only in Oxlint's nursery: `no-undef`.
 * @type {Record<string, import("oxlint").AllowWarnDeny | [import("oxlint").AllowWarnDeny, ...unknown[]]>}
 */
export const eslintRecommended = {
  'constructor-super': 'error',
  'for-direction': 'error',
  'getter-return': 'error',
  'no-async-promise-executor': 'error',
  'no-case-declarations': 'error',
  'no-class-assign': 'error',
  'no-compare-neg-zero': 'error',
  'no-cond-assign': 'error',
  'no-const-assign': 'error',
  'no-constant-binary-expression': 'error',
  'no-constant-condition': 'error',
  'no-control-regex': 'error',
  'no-debugger': 'error',
  'no-delete-var': 'error',
  'no-dupe-class-members': 'error',
  'no-dupe-else-if': 'error',
  'no-dupe-keys': 'error',
  'no-duplicate-case': 'error',
  'no-empty': 'error',
  'no-empty-character-class': 'error',
  'no-empty-pattern': 'error',
  'no-empty-static-block': 'error',
  'no-ex-assign': 'error',
  'no-extra-boolean-cast': 'error',
  'no-fallthrough': 'error',
  'no-func-assign': 'error',
  'no-global-assign': 'error',
  'no-import-assign': 'error',
  'no-invalid-regexp': 'error',
  'no-irregular-whitespace': 'error',
  'no-loss-of-precision': 'error',
  'no-misleading-character-class': 'error',
  'no-new-native-nonconstructor': 'error',
  'no-nonoctal-decimal-escape': 'error',
  'no-obj-calls': 'error',
  'no-prototype-builtins': 'error',
  'no-redeclare': 'error',
  'no-regex-spaces': 'error',
  'no-self-assign': 'error',
  'no-setter-return': 'error',
  'no-shadow-restricted-names': 'error',
  'no-sparse-arrays': 'error',
  'no-this-before-super': 'error',
  'no-unexpected-multiline': 'error',
  'no-unreachable': 'error',
  'no-unsafe-finally': 'error',
  'no-unsafe-negation': 'error',
  'no-unsafe-optional-chaining': 'error',
  'no-unused-labels': 'error',
  'no-unused-private-class-members': 'error',
  'no-unused-vars': 'error',
  'no-useless-backreference': 'error',
  'no-useless-catch': 'error',
  'no-useless-escape': 'error',
  'no-with': 'error',
  'require-yield': 'error',
  'use-isnan': 'error',
  'valid-typeof': 'error'
};

/**
 * eslint-plugin-jsdoc `flat/recommended-typescript`, mapped to Oxlint.
 * @type {Record<string, import("oxlint").AllowWarnDeny | [import("oxlint").AllowWarnDeny, ...unknown[]]>}
 */
export const jsdocRecommendedTypescript = {
  'jsdoc/check-access': 'warn',
  'jsdoc-js/check-alignment': 'warn',
  'jsdoc-js/check-param-names': 'warn',
  'jsdoc/check-property-names': 'warn',
  'jsdoc/check-tag-names': ['warn', { typed: true }],
  'jsdoc-js/check-types': 'warn',
  'jsdoc-js/check-values': 'warn',
  'jsdoc/empty-tags': 'warn',
  'jsdoc-js/escape-inline-tags': 'warn',
  'jsdoc/implements-on-classes': 'warn',
  'jsdoc-js/multiline-blocks': 'warn',
  'jsdoc/no-defaults': 'warn',
  'jsdoc-js/no-multi-asterisks': 'warn',
  'jsdoc-js/no-types': 'warn',
  'jsdoc-js/reject-any-type': 'warn',
  'jsdoc-js/reject-function-type': 'warn',
  'jsdoc-js/require-jsdoc': 'warn',
  'jsdoc-js/require-next-type': 'warn',
  'jsdoc/require-param': 'warn',
  'jsdoc/require-param-description': 'warn',
  'jsdoc/require-param-name': 'warn',
  'jsdoc/require-property': 'warn',
  'jsdoc/require-property-description': 'warn',
  'jsdoc/require-property-name': 'warn',
  'jsdoc/require-returns': 'warn',
  'jsdoc-js/require-returns-check': 'warn',
  'jsdoc/require-returns-description': 'warn',
  'jsdoc/require-throws-type': 'warn',
  'jsdoc/require-yields': 'warn',
  'jsdoc-js/require-yields-check': 'warn',
  'jsdoc/require-yields-type': 'warn',
  'jsdoc-js/tag-lines': 'warn',
  'jsdoc-js/ts-no-empty-object-type': 'warn',
  'jsdoc-js/valid-types': 'warn'
};

/**
 * typescript-eslint's `eslint-recommended`, which it applies to TypeScript files, mapped to Oxlint.
 * @type {Record<string, import("oxlint").AllowWarnDeny | [import("oxlint").AllowWarnDeny, ...unknown[]]>}
 */
export const typescriptEslintRecommended = {
  'constructor-super': 'off',
  'getter-return': 'off',
  'no-class-assign': 'off',
  'no-const-assign': 'off',
  'no-dupe-class-members': 'off',
  'no-dupe-keys': 'off',
  'no-func-assign': 'off',
  'no-import-assign': 'off',
  'no-new-native-nonconstructor': 'off',
  'no-obj-calls': 'off',
  'no-redeclare': 'off',
  'no-setter-return': 'off',
  'no-this-before-super': 'off',
  'no-unreachable': 'off',
  'no-unsafe-negation': 'off',
  'no-var': 'error',
  'no-with': 'off',
  'prefer-const': 'error',
  'prefer-rest-params': 'error',
  'prefer-spread': 'error'
};

/**
 * typescript-eslint `strictTypeChecked`, mapped to Oxlint.
 * Left out, only in Oxlint's nursery: `@typescript-eslint/no-unnecessary-condition`.
 * @type {Record<string, import("oxlint").AllowWarnDeny | [import("oxlint").AllowWarnDeny, ...unknown[]]>}
 */
export const typescriptStrictTypeChecked = {
  'typescript/await-thenable': 'error',
  'typescript/ban-ts-comment': ['error', { minimumDescriptionLength: 10 }],
  'no-array-constructor': 'error',
  'typescript/no-array-delete': 'error',
  'typescript/no-base-to-string': 'error',
  'typescript/no-confusing-void-expression': 'error',
  'typescript/no-deprecated': 'error',
  'typescript/no-duplicate-enum-values': 'error',
  'typescript/no-duplicate-type-constituents': 'error',
  'typescript/no-dynamic-delete': 'error',
  'typescript/no-empty-object-type': 'error',
  'typescript/no-explicit-any': 'error',
  'typescript/no-extra-non-null-assertion': 'error',
  'typescript/no-extraneous-class': 'error',
  'typescript/no-floating-promises': 'error',
  'typescript/no-for-in-array': 'error',
  'typescript/no-implied-eval': 'error',
  'typescript/no-invalid-void-type': 'error',
  'typescript/no-meaningless-void-operator': 'error',
  'typescript/no-misused-new': 'error',
  'typescript/no-misused-promises': 'error',
  'typescript/no-misused-spread': 'error',
  'typescript/no-mixed-enums': 'error',
  'typescript/no-namespace': 'error',
  'typescript/no-non-null-asserted-nullish-coalescing': 'error',
  'typescript/no-non-null-asserted-optional-chain': 'error',
  'typescript/no-non-null-assertion': 'error',
  'typescript/no-redundant-type-constituents': 'error',
  'typescript/no-require-imports': 'error',
  'typescript/no-this-alias': 'error',
  'typescript/no-unnecessary-boolean-literal-compare': 'error',
  'typescript/no-unnecessary-template-expression': 'error',
  'typescript/no-unnecessary-type-arguments': 'error',
  'typescript/no-unnecessary-type-assertion': 'error',
  'typescript/no-unnecessary-type-constraint': 'error',
  'typescript/no-unnecessary-type-conversion': 'error',
  'typescript/no-unnecessary-type-parameters': 'error',
  'typescript/no-unsafe-argument': 'error',
  'typescript/no-unsafe-assignment': 'error',
  'typescript/no-unsafe-call': 'error',
  'typescript/no-unsafe-declaration-merging': 'error',
  'typescript/no-unsafe-enum-comparison': 'error',
  'typescript/no-unsafe-function-type': 'error',
  'typescript/no-unsafe-member-access': 'error',
  'typescript/no-unsafe-return': 'error',
  'typescript/no-unsafe-unary-minus': 'error',
  'no-unused-expressions': 'error',
  'no-unused-vars': 'error',
  'no-useless-constructor': 'error',
  'typescript/no-useless-default-assignment': 'error',
  'typescript/no-wrapper-object-types': 'error',
  'typescript/only-throw-error': 'error',
  'typescript/prefer-as-const': 'error',
  'typescript/prefer-literal-enum-member': 'error',
  'typescript/prefer-namespace-keyword': 'error',
  'typescript/prefer-promise-reject-errors': 'error',
  'typescript/prefer-reduce-type-parameter': 'error',
  'typescript/prefer-return-this-type': 'error',
  'typescript/related-getter-setter-pairs': 'error',
  'typescript/require-await': 'error',
  'typescript/restrict-plus-operands': [
    'error',
    {
      allowAny: false,
      allowBoolean: false,
      allowNullish: false,
      allowNumberAndString: false,
      allowRegExp: false
    }
  ],
  'typescript/restrict-template-expressions': [
    'error',
    {
      allowAny: false,
      allowBoolean: false,
      allowNever: false,
      allowNullish: false,
      allowNumber: false,
      allowRegExp: false
    }
  ],
  'typescript/return-await': ['error', 'error-handling-correctness-only'],
  'typescript/triple-slash-reference': 'error',
  'typescript/unbound-method': 'error',
  'typescript/unified-signatures': 'error',
  'typescript/use-unknown-in-catch-callback-variable': 'error'
};

/**
 * typescript-eslint `stylisticTypeChecked`, mapped to Oxlint.
 * Left out, only in Oxlint's nursery: `@typescript-eslint/prefer-optional-chain`.
 * @type {Record<string, import("oxlint").AllowWarnDeny | [import("oxlint").AllowWarnDeny, ...unknown[]]>}
 */
export const typescriptStylisticTypeChecked = {
  'typescript/adjacent-overload-signatures': 'error',
  'typescript/array-type': 'error',
  'typescript/ban-tslint-comment': 'error',
  'typescript/class-literal-property-style': 'error',
  'typescript/consistent-generic-constructors': 'error',
  'typescript/consistent-indexed-object-style': 'error',
  'typescript/consistent-type-assertions': 'error',
  'typescript/consistent-type-definitions': 'error',
  'typescript/dot-notation': 'error',
  'typescript/no-confusing-non-null-assertion': 'error',
  'no-empty-function': 'error',
  'typescript/no-inferrable-types': 'error',
  'typescript/non-nullable-type-assertion-style': 'error',
  'typescript/prefer-find': 'error',
  'typescript/prefer-for-of': 'error',
  'typescript/prefer-function-type': 'error',
  'typescript/prefer-includes': 'error',
  'typescript/prefer-nullish-coalescing': 'error',
  'typescript/prefer-regexp-exec': 'error',
  'typescript/prefer-string-starts-ends-with': 'error'
};
