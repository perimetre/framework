/**
 * ESLint's `no-restricted-syntax` for Oxlint, which has no native version.
 * It takes the same options: selectors, or `{ selector, message }` objects.
 * Oxlint matches the selectors, like ESLint does.
 */
const noRestrictedSyntax = {
  /**
   * Reports every node that matches a restricted selector.
   * @param context The rule context
   * @returns A visitor keyed by selector
   * @type {(context: { options: (string | { message?: string, selector: string })[], report: (descriptor: { message: string, node: unknown }) => void }) => Record<string, (node: unknown) => void>}
   */
  create(context) {
    return Object.fromEntries(
      context.options.map((option) => {
        const { message, selector } =
          typeof option === 'string' ? { selector: option } : option;
        return [
          selector,
          /**
           * Reports the matching node.
           * @param node The node the selector matched
           */
          (node) => {
            context.report({
              message: message ?? `Using '${selector}' is not allowed.`,
              node
            });
          }
        ];
      })
    );
  },
  meta: {
    docs: {
      description: 'Disallow specified syntax, like ESLint core'
    },
    schema: false,
    type: 'suggestion'
  }
};

/**
 * Perimetre's local Oxlint JS plugin.
 */
const plugin = {
  meta: { name: 'perimetre' },
  rules: { 'no-restricted-syntax': noRestrictedSyntax }
};

export default plugin;
