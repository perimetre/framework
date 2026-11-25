import base, { ignorePatterns } from '@perimetre/oxlint-config-base';
import trpc from '../index.mjs';

/**
 * Loads the config the way a project does, so `oxlint --print-config` fails
 * on any rule Oxlint does not know.
 */
export default { extends: [base, trpc], ignorePatterns };
