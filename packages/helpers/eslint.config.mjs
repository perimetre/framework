import baseConfig from '@perimetre/eslint-config-base';
import end from '@perimetre/eslint-config-base/end';
import { defineConfig } from 'eslint/config';

export default defineConfig(...baseConfig, end, {
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname
    }
  }
});
