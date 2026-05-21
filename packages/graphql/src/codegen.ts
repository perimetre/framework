import { Kind, parse, print } from 'graphql';
import { createHash } from 'node:crypto';

/**
 * Hashes a GraphQL operation roughly the way WPGraphQL Smart Cache does:
 * `sha256(graphql-js print(parse(operation)))`, with operations reordered
 * to come before fragments. Used as the codegen-side `__meta__.hash`.
 *
 * NOTE: `graphql-js` `print()` and `graphql-php` `Printer::doPrint()` do
 * **not** match byte-for-byte on every document (description formatting,
 * argument layout, and trailing whitespace can diverge), so the codegen
 * hash is best treated as a stable client-side identifier rather than a
 * guaranteed server lookup key. The runtime `createApqExecutor` handles
 * the divergence by reading the server-assigned hash from the
 * `x-graphql-query-id` header on the register POST and using it for the
 * subsequent APQ GETs.
 *
 * Pass this as `presetConfig.persistedDocuments.hashAlgorithm` in your
 * `codegen.ts` to embed the hash on every generated document.
 */
export const hashOperationForWpGraphqlSmartCache = (
  operation: string
): string => {
  const doc = parse(operation);
  const reordered = {
    ...doc,
    definitions: [
      ...doc.definitions.filter((d) => d.kind === Kind.OPERATION_DEFINITION),
      ...doc.definitions.filter((d) => d.kind !== Kind.OPERATION_DEFINITION)
    ]
  };
  return createHash('sha256').update(print(reordered)).digest('hex');
};

/**
 * Recommended `presetConfig` for `@graphql-codegen/client-preset` when
 * targeting WPGraphQL Smart Cache. Spread into your codegen config to:
 *   - enable persisted documents with the Smart Cache-compatible hasher;
 *   - emit `persisted-documents.json` (hash → query string map);
 *   - embed the hash on every generated `DocumentNode` under `__meta__.hash`.
 * @example
 * ```ts
 * // codegen.ts
 * import { wpGraphqlSmartCachePresetConfig } from '@perimetre/graphql/codegen';
 *
 * const config: CodegenConfig = {
 *   generates: {
 *     'src/server/graphql/__generated__/': {
 *       preset: 'client',
 *       presetConfig: {
 *         ...wpGraphqlSmartCachePresetConfig(),
 *         fragmentMasking: { unmaskFunctionName: 'getFragmentData' }
 *       }
 *     }
 *   }
 * };
 * ```
 */
export const wpGraphqlSmartCachePresetConfig = (): {
  persistedDocuments: {
    hashAlgorithm: (operation: string) => string;
    mode: 'embedHashInDocument';
  };
} => ({
  persistedDocuments: {
    hashAlgorithm: hashOperationForWpGraphqlSmartCache,
    mode: 'embedHashInDocument'
  }
});
