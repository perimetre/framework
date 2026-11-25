import playwright from 'eslint-plugin-playwright';
import { fileURLToPath } from 'node:url';
import {
  eslintRecommended,
  jsdocRecommendedTypescript,
  typescriptEslintRecommended,
  typescriptStrictTypeChecked,
  typescriptStylisticTypeChecked
} from './presets.mjs';
import {
  cachedFailureSyntax,
  NAV_LINK_FILES,
  okFalseSyntax,
  restrictedImports,
  restrictedProperties,
  restrictedSyntax,
  SERVER_FILES
} from './restrictions.mjs';

export { restrictedImports, restrictedSyntax } from './restrictions.mjs';

/**
 * Resolves a JS plugin from this package, not from the consumer.
 * Oxlint resolves a bare `jsPlugins` specifier against the config file that
 * extends this one, where pnpm does not expose our dependencies.
 * @param specifier The plugin's package name
 * @returns The absolute path to the plugin's entry
 * @type {(specifier: string) => string}
 */
const resolvePlugin = (specifier) =>
  fileURLToPath(import.meta.resolve(specifier));

/**
 * Sets every rule in a list to `off`.
 * @param names The rule names
 * @returns The rules, switched off
 * @type {(names: string[]) => Record<string, 'off'>}
 */
const off = (names) => Object.fromEntries(names.map((name) => [name, 'off']));

const JS_FILES = ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'];
const TS_FILES = ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'];
const TEST_FILES = [
  'tests/**',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx'
];

/**
 * Files no project lints: build output, generated code and declarations.
 * Oxlint drops `ignorePatterns` from an extended config, so the consumer sets
 * them in its own root config.
 */
export const ignorePatterns = [
  '**/__generated__/',
  'node_modules/',
  'dist/',
  'build/',
  '.next/',
  '.turbo/',
  '.wrangler/',
  '.idea/',
  '.github/',
  '.claude/',
  'test-results/',
  'playwright-report/',
  'next-env.d.ts',
  '**/*.d.ts',
  '**/*.d.mts',
  '**/*.d.cts',
  'graphql.schema.json',
  'schema.graphql'
];

// typescript-eslint's eslint-recommended both switches core rules off, since
// the compiler reports them, and switches a few on, for TypeScript files
const coveredByTypeScript = Object.keys(typescriptEslintRecommended).filter(
  (name) => typescriptEslintRecommended[name] === 'off'
);
const typescriptEslintOn = Object.fromEntries(
  Object.entries(typescriptEslintRecommended).filter(
    ([, setting]) => setting !== 'off'
  )
);

/** The TypeScript presets, plus our own TypeScript rules. */
const typescriptRules = {
  ...typescriptEslintOn,
  ...typescriptStrictTypeChecked,
  ...typescriptStylisticTypeChecked,

  // Ours
  'no-restricted-imports': ['error', restrictedImports()],
  'no-restricted-properties': ['error', ...restrictedProperties],
  'typescript/consistent-type-definitions': ['error', 'type'],
  'typescript/consistent-type-imports': [
    'error',
    { fixStyle: 'inline-type-imports' }
  ],
  // No `as` on network, DB or CMS data; any other `as` says why
  // (app-best-practices: typescript/index.md, code-hygiene/index.md)
  'typescript/no-unsafe-type-assertion': 'warn'
};

/** The JSDoc preset, plus our own JSDoc rules. */
const jsdocRules = {
  ...jsdocRecommendedTypescript,

  // Ours
  // Oxfmt formats comments, and sometimes conflicts with this
  'jsdoc-js/check-alignment': 'off',
  'jsdoc-js/require-description': 'error',
  'jsdoc-js/require-jsdoc': [
    'error',
    {
      require: {
        ArrowFunctionExpression: true,
        ClassDeclaration: true,
        ClassExpression: true,
        FunctionDeclaration: true,
        FunctionExpression: true,
        MethodDefinition: true
      }
    }
  ]
};

/**
 * Our base Oxlint configuration, the Oxlint counterpart of
 * `@perimetre/eslint-config-base`: the same upstream presets, mapped to Oxlint
 * in `presets.mjs`, with our rules on top. It works for frontend and backend
 * projects, with or without React.
 *
 * Every rule is set at the root, so a project can switch one off in its own
 * `rules`. Overrides only switch rules off where the ESLint config did not
 * apply them, except Playwright's, which only exist for test files.
 *
 * eslint-plugin-jsdoc runs as a JS plugin under `jsdoc-js/` for the rules
 * Oxlint's native `jsdoc` plugin does not have.
 *
 * Our conventions come from the ai-toolkit `app-best-practices` skill:
 * https://github.com/perimetre/ai-toolkit/blob/main/plugins/perimetre-apps/skills/app-best-practices
 * Each rule names the topic it enforces, here and in `restrictions.mjs`.
 * @type {import('oxlint').OxlintConfig}
 */
const config = {
  categories: {
    // Oxlint's own base: code that is outright wrong, in every enabled plugin.
    // The presets and our rules below take precedence over it
    correctness: 'error'
  },
  jsPlugins: [
    { name: 'jsdoc-js', specifier: resolvePlugin('eslint-plugin-jsdoc') },
    resolvePlugin('eslint-plugin-perfectionist'),
    resolvePlugin('eslint-plugin-sort-destructure-keys'),
    {
      name: 'perimetre',
      specifier: resolvePlugin('./plugin.mjs')
    }
  ],
  options: {
    typeAware: true
  },
  overrides: [
    {
      files: TS_FILES,
      rules: {
        ...off(coveredByTypeScript),
        // We are using typescript already
        'jsdoc/require-param': 'off',
        // We are using typescript already
        'jsdoc/require-returns': 'off'
      }
    },
    {
      // The one file that wraps next/link
      files: NAV_LINK_FILES,
      rules: {
        'no-restricted-imports': [
          'error',
          restrictedImports({ navLink: false })
        ]
      }
    },
    {
      // A server domain's own files reach into each other
      files: SERVER_FILES,
      rules: {
        'no-restricted-imports': [
          'error',
          restrictedImports({ serverBoundary: false })
        ],
        'perimetre/no-restricted-syntax': [
          'error',
          ...restrictedSyntax,
          ...cachedFailureSyntax
        ]
      }
    },
    {
      // typescript-eslint's presets only apply to TypeScript files
      files: JS_FILES,
      rules: {
        ...off(
          Object.keys(typescriptRules).filter(
            (name) => !(name in eslintRecommended)
          )
        ),
        // We use JSDoc for TypeScript declaration generation in .mjs files
        'jsdoc/check-tag-names': 'off'
      }
    },
    {
      // Next.js routes are documented by their file convention
      files: ['**/src/app/**'],
      rules: off(Object.keys(jsdocRules))
    },
    {
      files: TEST_FILES,
      jsPlugins: [resolvePlugin('eslint-plugin-playwright')],
      rules: {
        ...playwright.configs['flat/recommended'].rules,
        // Mocks return { ok: false } for fetch's Response
        'perimetre/no-restricted-syntax': [
          'error',
          ...restrictedSyntax.filter((entry) => !okFalseSyntax.includes(entry))
        ]
      }
    }
  ],
  plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'jsdoc', 'import'],
  rules: {
    ...eslintRecommended,
    ...typescriptRules,
    ...jsdocRules,

    // Ours
    // Oxfmt formats, so this is off as eslint-config-prettier had it
    'no-unexpected-multiline': 'off',
    // No circular deps (app-best-practices: services/index.md)
    'import/no-cycle': ['error', { ignoreTypes: true }],
    // A disable comment names the rules it disables
    // (app-best-practices: code-hygiene/index.md)
    'unicorn/no-abusive-eslint-disable': 'error',
    'perimetre/no-restricted-syntax': ['error', ...restrictedSyntax],
    // Make sure destructured keys are sorted
    'sort-destructure-keys/sort-destructure-keys': 'error',
    // Sort various TypeScript constructs
    'perfectionist/sort-interfaces': 'error',
    'perfectionist/sort-intersection-types': 'error',
    'perfectionist/sort-modules': 'error',
    'perfectionist/sort-object-types': 'error',
    'perfectionist/sort-union-types': 'error',
    'perfectionist/sort-variable-declarations': 'error'
  }
};

export default config;
