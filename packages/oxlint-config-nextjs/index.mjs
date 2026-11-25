import { nextCoreWebVitals } from './presets.mjs';

/**
 * Next.js Oxlint configuration, the Oxlint counterpart of
 * `@perimetre/eslint-config-nextjs`: `@next/eslint-plugin-next`
 * `core-web-vitals`, mapped to Oxlint's native `nextjs` plugin in
 * `presets.mjs`, with our rules on top. Extend it after
 * `@perimetre/oxlint-config-react`.
 *
 * The React Compiler rules come from `@perimetre/oxlint-config-react`, where
 * Oxlint's native `react` plugin runs them, so there is no
 * eslint-plugin-react-compiler here.
 * @type {import('oxlint').OxlintConfig}
 */
const config = {
  overrides: [
    {
      // Next.js 16 runs src/proxy.ts (app-best-practices:
      // project-structure/index.md). `perimetre/no-restricted-syntax` is
      // the JS plugin @perimetre/oxlint-config-base loads
      files: [
        '**/src/middleware.ts',
        '**/src/middleware.js',
        'middleware.ts',
        'middleware.js'
      ],
      rules: {
        'perimetre/no-restricted-syntax': [
          'error',
          {
            message:
              'The proxy file is src/proxy.ts: a middleware.ts never runs, so nothing in it takes effect. See the app-best-practices skill in perimetre/ai-toolkit: references/project-structure/index.md',
            selector: 'Program'
          }
        ]
      }
    }
  ],
  plugins: ['nextjs'],
  rules: {
    ...nextCoreWebVitals
  }
};

export default config;
