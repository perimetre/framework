import baseConfig from '@perimetre/eslint-config-base';
import endConfig from '@perimetre/eslint-config-base/end';

export default [
  ...baseConfig,
  {
    files: ['src/**/*', '**/*.test.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  {
    files: ['tsdown.config.ts'],
    languageOptions: {
      parserOptions: {
        allowDefaultProject: true
      }
    }
  },
  ...endConfig
];
