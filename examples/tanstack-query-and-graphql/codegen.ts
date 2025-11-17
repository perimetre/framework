// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
const { loadEnvConfig } = require('@next/env');
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
loadEnvConfig(process.cwd());

import type { CodegenConfig } from '@graphql-codegen/cli';
import { addTypenameSelectionDocumentTransform } from '@graphql-codegen/client-preset';
import invariant from 'tiny-invariant';

invariant(
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
  'NEXT_PUBLIC_WORDPRESS_GRAPHQL_ENDPOINT is required'
);

const schemaEndpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;

const schema: CodegenConfig['schema'] = [
  {
    [schemaEndpoint]: {
      headers: {
        // TODO: Add when authentication is needed
        // Authorization: `Bearer ${schemaToken}`
      }
    }
  }
];

const config: CodegenConfig = {
  config: {
    /**
     * https://github.com/hasura/graphql-engine/issues/3451#issuecomment-1819859763
     */
    onFieldTypeConflict: (existing: unknown) => existing
  },
  // Specify all the places where GraphQL is defined
  documents: ['src/**/*graphql.ts'],
  generates: {
    // Run introspection to generate schema as json for the autocomplete extension
    './graphql.schema.json': {
      plugins: ['introspection']
    },
    // Generate the schema as SDL including directives
    './schema.graphql': {
      plugins: ['schema-ast'],
      config: {
        includeDirectives: true
      }
    },
    // Generate types for client usage
    'src/server/graphql/__generated__/': {
      preset: 'client',
      // config: {
      //   documentMode: 'string'
      // },
      // Ref: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#the-usefragment-helper
      presetConfig: {
        // Rename the default unmasking function as it's not a real hook
        fragmentMasking: { unmaskFunctionName: 'getFragmentData' }
      },

      documentTransforms: [addTypenameSelectionDocumentTransform]
    }
  },
  overwrite: true,
  schema,
  // Run prettier after codegen
  hooks: { afterAllFileWrite: ['prettier --write'] }
};

export default config;
