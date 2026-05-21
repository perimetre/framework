import { defineConfig } from 'tsdown';

export default defineConfig({
  // Wildcard entry: any `.ts` directly under `src/` becomes a top-level
  // bundle in `dist/`, which lines up 1:1 with the `./*` wildcard in
  // `package.json#exports`. Adding a new module is a matter of dropping a
  // file in `src/` — no config edit needed.
  entry: ['./src/*.ts'],
  format: ['esm', 'cjs'],
  declaration: true,
  external: [
    '@graphql-typed-document-node/core',
    '@tanstack/react-query',
    'graphql',
    'graphql-request',
    'node:diagnostics_channel'
  ]
});
