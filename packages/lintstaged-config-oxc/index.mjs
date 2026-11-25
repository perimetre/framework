import path from 'node:path';
import process from 'node:process';

/** The files Oxlint lints. */
const LINTABLE = /\.(?:js|jsx|mjs|cjs|ts|tsx|mts|cts)$/;

/**
 * Quotes staged files relative to the working directory.
 * @param files Absolute paths from lint-staged
 * @returns The paths, quoted and space-separated
 * @type {(files: readonly string[]) => string}
 */
const toArguments = (files) =>
  files.map((file) => `"${path.relative(process.cwd(), file)}"`).join(' ');

/**
 * Builds the Oxlint command for the staged files Oxlint lints.
 * @param files Absolute paths from lint-staged
 * @returns The command, or none when no staged file is lintable
 * @type {(files: readonly string[]) => string[]}
 */
export const buildOxlintCommand = (files) => {
  const lintable = files.filter((file) => LINTABLE.test(file));
  return lintable.length > 0 ? [`oxlint --fix ${toArguments(lintable)}`] : [];
};

/**
 * Builds the Oxfmt command for the staged files. Oxfmt skips the files it does
 * not format, and the flag keeps it from failing when none are left.
 * @param files Absolute paths from lint-staged
 * @returns The command
 * @type {(files: readonly string[]) => string}
 */
export const buildOxfmtCommand = (files) =>
  `oxfmt --no-error-on-unmatched-pattern ${toArguments(files)}`;

/**
 * lint-staged configuration for projects on Oxlint and Oxfmt, the counterpart
 * of `@perimetre/lintstaged-config-nextjs`.
 *
 * Both commands run in one task, one after the other, so Oxfmt formats what
 * `oxlint --fix` wrote and two tasks never write the same file at once.
 * @type {import('lint-staged').Configuration}
 */
const config = {
  /**
   * Lints, then formats, every staged file.
   * @param files Absolute paths from lint-staged
   * @returns The commands, run one after the other
   */
  '*': (files) => [...buildOxlintCommand(files), buildOxfmtCommand(files)]
};

export default config;
