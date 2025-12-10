import eslintPluginJsonc from 'eslint-plugin-jsonc';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { defineConfig } from 'eslint/config';

// Extract the JSONC parser from the plugin's config
const jsoncParser =
  eslintPluginJsonc.configs['flat/recommended-with-json'][1].languageOptions
    .parser;

/**
 * End configuration for ESLint
 * This should be added at the end of your ESLint config array to apply Prettier formatting rules
 */
export default defineConfig(
  // Prettier recommended config (applies to all files)
  eslintPluginPrettierRecommended,

  // TypeScript parser options (only for TS/JS files, not JSON)
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx',
      '**/*.mjs',
      '**/*.cjs'
    ],
    languageOptions: {
      parserOptions: {
        allowDefaultProject: ['*.config.mjs', '*.config.js', '*.config.ts'],
        projectService: true
      }
    }
  },

  // Force JSONC parser for JSON files (fixes Next.js compat overriding the parser)
  // This must come after all other configs to ensure JSON files use the correct parser
  {
    files: ['**/*.json', '**/*.jsonc', '**/*.json5'],
    languageOptions: {
      parser: jsoncParser
    }
  }
);
