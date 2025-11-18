import baseConfig from '@perimetre/eslint-config-base';
import endConfig from '@perimetre/eslint-config-base/end';

export default [
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  ...endConfig
];
