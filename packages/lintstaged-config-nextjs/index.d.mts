/**
 * Builds the ESLint command for lint-staged.
 * @see https://nextjs.org/docs/app/api-reference/config/eslint#running-lint-on-staged-files
 * @type {import('lint-staged').GenerateTask}
 */
export const buildEslintCommand: import('lint-staged').GenerateTask;
declare const _default: {
  '*.{js,jsx,ts,tsx,json,mjs,cjs,mts}': import('lint-staged').SyncGenerateTask[];
};
export default _default;
