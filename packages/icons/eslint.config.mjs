import baseConfig from '@perimetre/eslint-config-base';
import end from '@perimetre/eslint-config-base/end';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  ...baseConfig,
  end,
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        projectService: true,
        sourceType: 'module',
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  // A deprecated package, built on what the conventions now ban
  {
    rules: {
      'no-restricted-imports': 'off'
    }
  }
);
