import { Kind, parse, print } from 'graphql';
import { createHash } from 'node:crypto';

/**
 * Hashes a GraphQL operation the way WPGraphQL Smart Cache does:
 * `sha256(graphql-php Printer::doPrint(parsed))`. Mirrors that pipeline
 * using graphql-js's `print(parse(...))` (whose output matches graphql-php's
 * printer byte-for-byte for our documents) and reorders definitions so
 * operations come before fragments to match the canonical layout WPGraphQL
 * stores. Aligning the hashes lets the runtime client send
 * `queryId=<codegenHash>` and have Smart Cache resolve to the saved
 * document directly.
 *
 * Pass this as `presetConfig.persistedDocuments.hashAlgorithm` in your
 * `codegen.ts` so the embedded `__meta__.hash` lines up with what the
 * server computes on its side.
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
