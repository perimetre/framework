import baseConfig from '@perimetre/eslint-config-base';
import end from '@perimetre/eslint-config-base/end';

/**
 * ESLint configuration for the classnames package
 *
 * Why this package needs its own ESLint config:
 * - It uses TypeScript (.ts) files
 * - Other packages use .mjs files (JavaScript with JSDoc), which don't trigger type-aware linting
 * - The base config applies strictTypeChecked rules ONLY to .ts/.tsx files
 * - Type-aware rules require TypeScript's type system and proper project configuration
 *
 * What this config does:
 * - Imports the base ESLint config (applies strict type-checking for .ts files)
 * - Imports the end config (enables projectService for type-aware linting)
 * - Sets tsconfigRootDir so ESLint can find our tsconfig.json
 */
export default [
  ...baseConfig,
  ...end,
  {
    languageOptions: {
      parserOptions: {
        // Tell ESLint where to find tsconfig.json for type-aware linting
        tsconfigRootDir: import.meta.dirname
      }
    }
  }
];
