// Kept identical in @perimetre/eslint-config-base and
// @perimetre/oxlint-config-base, so both linters enforce the same conventions.
//
// Each rule enforces a convention of the ai-toolkit `app-best-practices`
// skill, where the reasoning lives. The comment above a rule names its topic,
// relative to https://github.com/perimetre/ai-toolkit/blob/main/plugins/perimetre-apps/skills/app-best-practices/references/

/**
 * Points a message at the app-best-practices topic its rule enforces.
 * @param topic The topic file, relative to the skill's references folder
 * @returns The reference, for the end of a message
 * @type {(topic: string) => string}
 */
const see = (topic) =>
  ` See the app-best-practices skill in perimetre/ai-toolkit: references/${topic}`;
/**
 * Builds the options of `no-restricted-imports`. A rule's options are
 * replaced wholesale by every file-scoped block that sets it, so every block,
 * ours or a project's, builds them with this one helper. ESLint sets the core
 * rule, so a project's own `@typescript-eslint/no-restricted-imports` list
 * adds to this one. Oxlint has only the core rule: a project passes its own
 * bans in `paths` and `patterns`.
 * @param options What to allow, and the project's own restrictions
 * @returns The rule's options
 * @example
 * // A project lets its proxy reach into the CMS adapter
 * { files: ['src/proxy.ts'], rules: { 'no-restricted-imports': ['error', restrictedImports({ serverBoundary: false })] } }
 * @type {(options?: { cacheComponents?: boolean, navLink?: boolean, paths?: object[], patterns?: object[], serverBoundary?: boolean }) => { paths: object[], patterns: object[] }}
 */
export const restrictedImports = (options = {}) => {
  const {
    cacheComponents = true,
    navLink = true,
    paths = [],
    patterns = [],
    serverBoundary = true
  } = options;
  return {
    paths: [
      {
        message:
          'Prefer importing individual functions from "lodash". Eg. import uniqBy from "lodash/uniqBy"',
        name: 'lodash'
      },
      { message: 'Use dayjs instead', name: 'moment' },
      // i18n/index.md → Links: internal links render through NavLink
      ...(navLink
        ? [
            {
              message:
                'Internal links render through NavLink (src/components/UI/NavLink).' +
                see('i18n/index.md'),
              name: 'next/link'
            }
          ]
        : []),
      // caching/index.md: one cache model per app
      ...(cacheComponents
        ? [
            {
              importNames: ['unstable_cache'],
              message:
                "Cache with 'use cache' and cacheLife. unstable_cache in a Cache Components project keeps a separate cache. Classic ISR projects: restrictedImports({ cacheComponents: false })." +
                see('caching/index.md'),
              name: 'next/cache'
            }
          ]
        : []),
      // motion/index.md: the motion package, LazyMotion and m.*
      {
        message:
          'Use the motion package, imported from motion/react.' +
          see('motion/index.md'),
        name: 'framer-motion'
      },
      {
        importNames: ['motion'],
        message:
          'Use m.* inside LazyMotion strict, never motion.*.' +
          see('motion/index.md'),
        name: 'motion/react'
      },
      // components/index.md: React 19 without forwardRef
      {
        importNames: ['forwardRef'],
        message:
          'React 19 passes ref as a prop: no forwardRef.' +
          see('components/index.md'),
        name: 'react'
      },
      ...paths
    ],
    patterns: [
      // components/index.md: UI SDK is the only behaviour layer
      {
        group: [
          'radix-ui',
          '@radix-ui/*',
          '@headlessui/react',
          '@base-ui/*',
          '@base-ui-components/*',
          'react-aria',
          'react-aria-components',
          '@react-aria/*'
        ],
        message:
          'UI SDK is the only behaviour layer. See @perimetre/ui-behaviors for what it lacks.' +
          see('components/index.md')
      },
      // components/index.md: the deprecated @perimetre packages
      {
        group: ['@perimetre/ui', '@perimetre/ui/*'],
        message:
          'Deprecated: build the component in the app, from UI SDK and @perimetre/ui-behaviors.' +
          see('components/index.md')
      },
      {
        group: ['@perimetre/icons', '@perimetre/icons/*'],
        message:
          'Deprecated: use Icon from @perimetre/ui-behaviors/react/icon.' +
          see('components/index.md')
      },
      {
        group: ['@perimetre/classnames', '@perimetre/classnames/*'],
        message:
          'Deprecated: use cn from the cn package.' + see('components/index.md')
      },
      {
        group: ['@perimetre/tokens', '@perimetre/tokens/*'],
        message:
          "Deprecated: define tokens in the app's own stylesheet." +
          see('components/index.md')
      },
      // service-adapters/index.md → Boundaries the tooling enforces
      ...(serverBoundary
        ? [
            {
              message:
                'Import a server domain through its composition root, @/server/<domain>, never its files.' +
                see('service-adapters/index.md'),
              regex: '^@/server/[^/]+/.+'
            }
          ]
        : []),
      ...patterns
    ]
  };
};

/**
 * `React.forwardRef`, which an import ban does not catch.
 * components/index.md: React 19 without forwardRef.
 */
export const restrictedProperties = [
  {
    message:
      'React 19 passes ref as a prop: no forwardRef.' +
      see('components/index.md'),
    object: 'React',
    property: 'forwardRef'
  }
];

/**
 * Failure is an Error instance, never `{ ok: false }`.
 * error-handling/index.md: success is `{ ok: true }`, failure an Error.
 */
export const okFalseSyntax = [
  "ReturnStatement > ObjectExpression > Property[key.name='ok'][value.value=false]",
  "ArrowFunctionExpression > ObjectExpression > Property[key.name='ok'][value.value=false]"
].map((selector) => ({
  message:
    'Failure is an Error instance, never { ok: false }: callers narrow with "ok" in result.' +
    see('error-handling/index.md'),
  selector
}));

/** Code that is wrong in every project. */
export const restrictedSyntax = [
  ...okFalseSyntax,
  // postgres-secure-connections.md: the certificate is always checked
  {
    message:
      'The certificate is always checked: fix the CA or hostname instead.' +
      see('postgres-secure-connections.md'),
    selector: "Property[key.name='rejectUnauthorized'][value.value=false]"
  },
  {
    message:
      'NODE_TLS_REJECT_UNAUTHORIZED=0 turns off certificate checks for every TLS connection.' +
      see('postgres-secure-connections.md'),
    selector:
      "AssignmentExpression[left.property.name='NODE_TLS_REJECT_UNAUTHORIZED']"
  },
  {
    message:
      'The certificate is always checked: never set sslmode to no-verify.' +
      see('postgres-secure-connections.md'),
    // The bracket keeps this file from matching its own selector
    selector: 'Literal[value=/sslmode=no-verif[y]/]'
  },
  // caching/index.md: an explicit cacheLife in every 'use cache' scope
  ...[
    'FunctionDeclaration',
    'FunctionExpression',
    'ArrowFunctionExpression'
  ].map((type) => ({
    message:
      "Every 'use cache' scope sets an explicit cacheLife." +
      see('caching/index.md'),
    selector: `${type}:has(ExpressionStatement[directive=/^use cache/]):not(:has(CallExpression[callee.name='cacheLife']))`
  }))
];

/**
 * Server adapters: a value returned from a cached read is cached.
 * caching/index.md: a `return null` inside a cached scope is a cache write.
 */
export const cachedFailureSyntax = [
  "CatchClause ReturnStatement > Literal[raw='null']",
  'CatchClause ReturnStatement > ArrayExpression[elements.length=0]'
].map((selector) => ({
  message:
    'Returning null or [] from a catch caches the failure: return the error value instead.' +
    see('caching/index.md'),
  selector
}));

/** Where the one file that may import next/link lives. */
export const NAV_LINK_FILES = ['**/src/components/UI/NavLink/**'];

/** Where server domains, and their adapters, live. */
export const SERVER_FILES = ['**/src/server/**'];
