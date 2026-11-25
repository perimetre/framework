/**
 * Oxfmt configuration for Perimetre projects, the Oxfmt counterpart of
 * `@perimetre/prettier-config`. It formats like the Prettier config:
 *
 * - `printWidth` is Prettier's 80, since Oxfmt defaults to 100.
 * - `sortImports` sorts like prettier-plugin-organize-imports: package imports
 *   before relative ones, alphabetical, no blank line added between them, and
 *   blank-line-separated groups kept apart. Unlike the plugin, it does not
 *   remove unused imports; Oxlint's `no-unused-vars` reports them.
 * - `sortTailwindcss` replaces prettier-plugin-tailwindcss. For Tailwind v4,
 *   set `sortTailwindcss.stylesheet` to your CSS entry in your own config.
 * - `sortPackageJson` is off: Prettier left `package.json` key order alone.
 *
 * Oxfmt has no `extends`: spread this object into your `oxfmt.config.ts`.
 * @type {import('oxfmt').OxfmtConfig}
 */
const config = {
  printWidth: 80,
  semi: true,
  singleQuote: true,
  sortImports: {
    groups: [
      ['builtin', 'external', 'internal', 'subpath', 'unknown'],
      ['parent', 'sibling', 'index']
    ],
    newlinesBetween: false,
    partitionByNewline: true
  },
  sortPackageJson: false,
  sortTailwindcss: true,
  tabWidth: 2,
  trailingComma: 'none'
};

export default config;
