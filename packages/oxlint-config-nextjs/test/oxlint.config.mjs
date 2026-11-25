import base, { ignorePatterns } from '@perimetre/oxlint-config-base';
import react from '@perimetre/oxlint-config-react';
import nextjs from '../index.mjs';

/**
 * Loads the config the way a project does, so `oxlint --print-config` fails
 * on any rule Oxlint does not know.
 */
export default { extends: [base, react, nextjs], ignorePatterns };
