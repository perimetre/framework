/* eslint-disable jsdoc/check-tag-names */
/**
 * Prettier configuration for Perimetre projects
 * @type {import("prettier").Config}
 */
const config = {
  singleQuote: true,
  trailingComma: 'none',
  semi: true,
  tabWidth: 2,
  plugins: ['prettier-plugin-organize-imports', 'prettier-plugin-tailwindcss']
};

export default config;
