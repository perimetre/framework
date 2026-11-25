import pluginQuery from '@tanstack/eslint-plugin-query';
import { fileURLToPath } from 'node:url';
import { jsxA11yRecommended, reactHooksRecommended } from './presets.mjs';

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
 * TanStack Query's recommended rules. The plugin runs as a JS plugin, so its
 * preset is read from it directly.
 */
const queryRules = Object.assign(
  {},
  ...pluginQuery.configs['flat/recommended'].map((entry) => entry.rules)
);

/**
 * React Oxlint configuration, the Oxlint counterpart of
 * `@perimetre/eslint-config-react`: the same upstream presets, mapped to
 * Oxlint in `presets.mjs`, with our rules on top. Extend it after
 * `@perimetre/oxlint-config-base`.
 *
 * React hooks and the React Compiler rules are native to Oxlint's `react`
 * plugin. `boolean-prop-naming` and `jsx-sort-props` are not, so they run
 * through eslint-plugin-react as a JS plugin under `react-js/`, because `react`
 * is reserved for the native plugin.
 * @type {import('oxlint').OxlintConfig}
 */
const config = {
  jsPlugins: [
    resolvePlugin('@tanstack/eslint-plugin-query'),
    { name: 'react-js', specifier: resolvePlugin('eslint-plugin-react') }
  ],
  overrides: [
    // Ladle
    {
      files: ['**/*.stories.tsx', '**/*.stories.ts', '.ladle/**'],
      rules: {
        'jsdoc-js/require-jsdoc': 'off',
        'typescript/no-explicit-any': 'off'
      }
    }
  ],
  plugins: ['react', 'jsx-a11y'],
  rules: {
    ...reactHooksRecommended,
    ...jsxA11yRecommended,
    ...queryRules,

    // Ours
    'react/jsx-boolean-value': 'error',
    'react/react-in-jsx-scope': 'off',
    'react/self-closing-comp': 'error',
    // Make sure booleans are named consistently
    'react-js/boolean-prop-naming': [
      'error',
      {
        rule: '^(asChild|required|open|disabled)|((can|show|allow|is|has)[A-Z]([A-Za-z0-9]?))+',
        validateNested: true
      }
    ],
    // Sort the props so that they keep a consistent order
    'react-js/jsx-sort-props': [
      'error',
      {
        callbacksLast: true,
        multiline: 'last',
        reservedFirst: true,
        shorthandFirst: true
      }
    ]
  }
};

export default config;
