import { parse } from 'graphql';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { printForWpGraphqlSmartCache } from './print.js';
import {
  registerTrustedDocuments,
  type RegisterTrustedDocumentsResult
} from './trusted-documents.js';
import type { GraphqlLogger } from './utils.js';

/**
 * Hashes a GraphQL operation **exactly the way WPGraphQL Smart Cache does on
 * the server**: `sha256(graphql-php print(parse(operation)))`. Because
 * {@link printForWpGraphqlSmartCache} reproduces `graphql-php`'s
 * `Printer::doPrint()` byte-for-byte for executable documents, the hash this
 * emits at codegen time is the *same* id the server stores the persisted
 * document under — so `queryId=<codegenHash>` resolves on the very first
 * request, with no POST-to-register round trip needed to discover a
 * server-assigned hash.
 *
 * This replaces the previous implementation, which hashed `graphql-js`'s
 * `print()` output (diverging on object-value spacing + trailing newline) and
 * reordered operations ahead of fragments (diverging again for multi-fragment
 * documents). Both divergences produced a client hash the server could not
 * match, forcing a per-cold-start register POST. See
 * {@link printForWpGraphqlSmartCache} for the exact normalization rules.
 *
 * Pass this as `presetConfig.persistedDocuments.hashAlgorithm` in your
 * `codegen.ts` to embed the hash on every generated document.
 */
export const hashOperationForWpGraphqlSmartCache = (
  operation: string
): string =>
  createHash('sha256')
    .update(printForWpGraphqlSmartCache(parse(operation)))
    .digest('hex');

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

export { printForWpGraphqlSmartCache } from './print.js';

/**
 * Options for {@link trustedDocumentsCodegenHook}. Everything
 * {@link registerTrustedDocuments} needs, minus `persistedDocuments` — the
 * hook reads that from the file codegen just emitted.
 */
export type TrustedDocumentsCodegenHookOptions = {
  /** Authenticated WPGraphQL endpoint (needs `create_posts`; see `headers`). */
  endpoint: string;
  /** `fetch` implementation. Pass `globalThis.fetch` on Node 18+. */
  fetch: typeof fetch;
  /** Optional allow/deny `grant` applied to every document. */
  grant?: 'allow' | 'deny';
  /** Auth headers for the `createGraphqlDocument` mutation. */
  headers: Record<string, string>;
  /** Optional logger; defaults to `console`. */
  logger?: GraphqlLogger;
  /** Optional per-document `Cache-Control: max-age` (seconds). */
  maxAgeSeconds?: number;
  /**
   * Basename of the persisted-documents file codegen emits. Defaults to
   * `persisted-documents.json` (what `@graphql-codegen/client-preset` writes).
   */
  persistedDocumentsFileName?: string;
  /**
   * Whether to throw when any document fails to register (so a misconfigured
   * deploy/codegen run fails loudly). Defaults to `true`. "Already exists" is
   * an idempotent skip and never counts as a failure.
   */
  throwOnFailure?: boolean;
};

/**
 * Builds an `afterAllFileWrite` lifecycle-hook function for
 * `@graphql-codegen` that **safelists every persisted document on the CMS as
 * soon as codegen writes `persisted-documents.json`** — so registration is
 * part of the same step that produces the hashes, with no separate script to
 * remember.
 *
 * `@graphql-codegen` hooks accept JS functions (not just shell strings), and
 * `afterAllFileWrite` receives the paths codegen just wrote. This factory
 * returns such a function: it finds the persisted-documents file among those
 * paths, reads the `hash → query` map, and calls
 * {@link registerTrustedDocuments}.
 *
 * Wire it into your `codegen.ts` `hooks` (it composes with other hooks like
 * `prettier --write`). Gate it on an env flag so local/offline codegen runs
 * don't try to hit the CMS:
 * @example
 * ```ts
 * // codegen.ts
 * import { trustedDocumentsCodegenHook } from '@perimetre/graphql/codegen';
 *
 * const config: CodegenConfig = {
 *   // …generates with wpGraphqlSmartCachePresetConfig() as before…
 *   hooks: {
 *     afterAllFileWrite: [
 *       'prettier --write',
 *       // Only register when explicitly asked (e.g. `REGISTER_TRUSTED_DOCS=1 pnpm codegen`
 *       // in CI / on deploy) — a no-op otherwise.
 *       ...(process.env.REGISTER_TRUSTED_DOCS
 *         ? [
 *             trustedDocumentsCodegenHook({
 *               endpoint: process.env.WORDPRESS_GRAPHQL_ENDPOINT!,
 *               fetch: globalThis.fetch,
 *               headers: {
 *                 Authorization: `Basic ${Buffer.from(
 *                   `${process.env.WP_USER}:${process.env.WP_APP_PASSWORD}`
 *                 ).toString('base64')}`
 *               },
 *               grant: 'allow'
 *             })
 *           ]
 *         : [])
 *     ]
 *   }
 * };
 * ```
 *
 * Because `afterAllFileWrite` fires on every codegen run (including
 * `codegen:watch`), keep the env gate so you only register on the runs that
 * should touch the CMS.
 */
export const trustedDocumentsCodegenHook = ({
  endpoint,
  fetch: fetchImpl,
  grant,
  headers,
  logger = console,
  maxAgeSeconds,
  persistedDocumentsFileName = 'persisted-documents.json',
  throwOnFailure = true
}: TrustedDocumentsCodegenHookOptions): ((
  paths: string[]
) => Promise<void>) => {
  return async (paths: string[]): Promise<void> => {
    const file = paths.find((p) => p.endsWith(persistedDocumentsFileName));
    if (!file) {
      logger.warn('graphql.trusted.codegen_hook.no_persisted_documents', {
        persistedDocumentsFileName,
        writtenPaths: paths.length
      });
      return;
    }

    const persistedDocuments = JSON.parse(
      await readFile(file, 'utf8')
    ) as Record<string, string>;

    const result: RegisterTrustedDocumentsResult =
      await registerTrustedDocuments({
        endpoint,
        fetch: fetchImpl,
        grant,
        headers,
        logger,
        maxAgeSeconds,
        persistedDocuments
      });

    logger.info('graphql.trusted.codegen_hook.done', {
      created: result.created,
      skipped: result.skipped,
      failed: result.failed
    });

    if (throwOnFailure && result.failed > 0) {
      const failed = result.registrations
        .filter((r) => r.status === 'failed')
        .map((r) => `${r.operationName} (${r.id}): ${r.error ?? 'unknown'}`)
        .join('\n  ');
      throw new Error(
        `@perimetre/graphql: ${String(result.failed)} trusted document(s) failed to register:\n  ${failed}`
      );
    }
  };
};
