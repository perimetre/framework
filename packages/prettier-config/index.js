 
import organizeImports from 'prettier-plugin-organize-imports';
import tailwindcss from 'prettier-plugin-tailwindcss';

/**
 * Prettier configuration for Perimetre projects
 * @type {import("prettier").Config}
 */
const config = {
  singleQuote: true,
  trailingComma: 'none',
  semi: true,
  tabWidth: 2,
  plugins: [organizeImports, tailwindcss]
};

export default config;
