import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { defineConfig } from 'eslint/config';

/**
 * End configuration for ESLint
 * This should be added at the end of your ESLint config array to apply Prettier formatting rules
 */
export default defineConfig(eslintPluginPrettierRecommended, {
  languageOptions: {
    parserOptions: {
      allowDefaultProject: ['*.config.mjs', '*.config.js', '*.config.ts'],
      projectService: true
    }
  }
});
