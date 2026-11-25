// The upstream presets our ESLint config extends, mapped to Oxlint's rule
// names, keeping the rules Oxlint implements outside nursery. Each preset lists
// what it leaves out. Oxlint ships no presets of its own, and an unknown rule
// is a config error, so these are kept in step with upstream by hand.

/**
 * `@next/eslint-plugin-next` `core-web-vitals`, mapped to Oxlint.
 * @type {Record<string, import("oxlint").AllowWarnDeny | [import("oxlint").AllowWarnDeny, ...unknown[]]>}
 */
export const nextCoreWebVitals = {
  'nextjs/google-font-display': 'warn',
  'nextjs/google-font-preconnect': 'warn',
  'nextjs/next-script-for-ga': 'warn',
  'nextjs/no-async-client-component': 'warn',
  'nextjs/no-before-interactive-script-outside-document': 'warn',
  'nextjs/no-css-tags': 'warn',
  'nextjs/no-head-element': 'warn',
  'nextjs/no-html-link-for-pages': 'error',
  'nextjs/no-img-element': 'warn',
  'nextjs/no-page-custom-font': 'warn',
  'nextjs/no-styled-jsx-in-document': 'warn',
  'nextjs/no-sync-scripts': 'error',
  'nextjs/no-title-in-document-head': 'warn',
  'nextjs/no-typos': 'warn',
  'nextjs/no-unwanted-polyfillio': 'warn',
  'nextjs/inline-script-id': 'error',
  'nextjs/no-assign-module-variable': 'error',
  'nextjs/no-document-import-in-page': 'error',
  'nextjs/no-duplicate-head': 'error',
  'nextjs/no-head-import-in-document': 'error',
  'nextjs/no-script-component-in-head': 'error'
};
