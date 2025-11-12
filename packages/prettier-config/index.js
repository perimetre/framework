 
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * Prettier configuration for Perimetre projects
 * @type {import("prettier").Config}
 */
const config = {
  singleQuote: true,
  trailingComma: 'none',
  semi: true,
  tabWidth: 2,
  plugins: [
    require.resolve('prettier-plugin-organize-imports'),
    require.resolve('prettier-plugin-tailwindcss')
  ]
};

export default config;
