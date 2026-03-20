import baseConfig from '@perimetre/eslint-config-base';
import end from '@perimetre/eslint-config-base/end';

export default [
  ...baseConfig,
  ...end,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname
      }
    }
  }
];
