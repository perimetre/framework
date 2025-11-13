import path from 'path';
import process from 'node:process';

/**
 * Builds the ESLint command for lint-staged.
 * @see https://nextjs.org/docs/app/api-reference/config/eslint#running-lint-on-staged-files
 * @type {import('lint-staged').GenerateTask}
 */
export const buildEslintCommand = (filenames) =>
  `eslint --fix ${filenames
    .map((f) => `"${path.relative(process.cwd(), f)}"`)
    .join(' ')}`;

/**
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*.{js,jsx,ts,tsx,json,mjs,cjs,mts}': [buildEslintCommand]
};
