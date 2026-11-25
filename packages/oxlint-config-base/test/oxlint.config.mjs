import base, { ignorePatterns } from '../index.mjs';

/**
 * Loads the config the way a project does, so `oxlint --print-config` fails
 * on any rule Oxlint does not know.
 */
export default { extends: [base], ignorePatterns };
