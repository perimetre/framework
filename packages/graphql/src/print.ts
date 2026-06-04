import type { ASTNode } from 'graphql';
import { Kind, OperationTypeNode } from 'graphql';

/**
 * Prints a GraphQL document **byte-for-byte the way `graphql-php`'s
 * `GraphQL\Language\Printer::doPrint()` does**, so that
 * `sha256(printForWpGraphqlSmartCache(parse(query)))` equals the canonical
 * persisted-query id WPGraphQL Smart Cache stores the document under.
 *
 * ## Why this exists
 *
 * WPGraphQL Smart Cache derives a saved document's id from the *server-side*
 * print of the parsed query: `sha256(graphql-php print(parse(query)))` (see
 * `Utils::generateHash` / `Document::save` in `wp-graphql/wp-graphql-smart-cache`).
 * `graphql-js`'s own `print()` is **almost** identical, but diverges in two
 * places for executable documents, which is enough to change the sha256 and
 * make a client-computed hash miss the server's lookup:
 *
 *   1. **Object values.** `graphql-js` prints `{a: b}`; `graphql-php` prints
 *      `{ a: b }` (a space after `{` and before `}`). Empty objects are `{}`
 *      in both.
 *   2. **Trailing newline.** `graphql-php` appends a single `"\n"` to the whole
 *      document; `graphql-js` does not.
 *
 * Everything else — two-space indentation, the `argsLine.length > 80`
 * field-argument wrapping heuristic, list formatting (`[a, b]`), directives,
 * fragments, block strings — is identical between the two printers, so this
 * module re-implements only the executable subset of the AST and matches
 * `graphql-php` exactly on the two divergent productions.
 *
 * ## Important: no definition reordering
 *
 * This printer does **not** reorder definitions (operations-first or
 * otherwise). The server normalizes whatever document string it receives, in
 * the order it receives it, so the hash must be computed over the document as
 * codegen emits it. Reordering would re-introduce a mismatch for any document
 * containing more than one fragment definition.
 *
 * Verified against a live WPGraphQL Smart Cache endpoint: the sha256 of this
 * printer's output matches the `x-graphql-query-id` the server reports for
 * every persisted document.
 */
export const printForWpGraphqlSmartCache = (node: ASTNode): string =>
  print(node);

/**
 * Recursive printer. Each `case` mirrors the corresponding production in
 * `graphql-php`'s `Printer` (and, where they agree, `graphql-js`'s). Only
 * executable-document node kinds are handled — type-system definitions throw,
 * since persisted queries never contain them.
 */
const print = (node: ASTNode | null | undefined): string => {
  if (node == null) return '';

  switch (node.kind) {
    case Kind.DOCUMENT:
      // graphql-php joins definitions with "\n\n" and appends a trailing "\n".
      return node.definitions.map(print).join('\n\n') + '\n';

    case Kind.OPERATION_DEFINITION: {
      const op = node.operation;
      const name = node.name ? node.name.value : '';
      const varDefs =
        node.variableDefinitions && node.variableDefinitions.length > 0
          ? '(' + node.variableDefinitions.map(print).join(', ') + ')'
          : '';
      const directives = printDirectives(node.directives);
      const selectionSet = print(node.selectionSet);

      // Anonymous queries with no directives or variable definitions use the
      // short form (just the selection set).
      if (
        name === '' &&
        directives === '' &&
        varDefs === '' &&
        op === OperationTypeNode.QUERY
      ) {
        return selectionSet;
      }
      return join(
        [op, join([name, varDefs], ''), directives, selectionSet],
        ' '
      );
    }

    case Kind.VARIABLE_DEFINITION:
      return (
        print(node.variable) +
        ': ' +
        print(node.type) +
        (node.defaultValue ? ' = ' + print(node.defaultValue) : '') +
        (node.directives && node.directives.length > 0
          ? ' ' + node.directives.map(print).join(' ')
          : '')
      );

    case Kind.VARIABLE:
      return '$' + node.name.value;

    case Kind.SELECTION_SET:
      return block(node.selections.map(print));

    case Kind.FIELD: {
      const prefix =
        (node.alias ? node.alias.value + ': ' : '') + node.name.value;
      let argsLine =
        prefix +
        (node.arguments && node.arguments.length > 0
          ? '(' + node.arguments.map(print).join(', ') + ')'
          : '');
      // Wrap arguments onto indented lines once the single-line form exceeds
      // 80 chars — same threshold `graphql-js` and `graphql-php` both use.
      if (argsLine.length > 80) {
        argsLine =
          prefix +
          '(\n' +
          indent((node.arguments ?? []).map(print).join('\n')) +
          '\n)';
      }
      return join(
        [argsLine, printDirectives(node.directives), print(node.selectionSet)],
        ' '
      );
    }

    case Kind.ARGUMENT:
    case Kind.OBJECT_FIELD:
      return node.name.value + ': ' + print(node.value);

    case Kind.FRAGMENT_SPREAD:
      return (
        '...' +
        node.name.value +
        (node.directives && node.directives.length > 0
          ? ' ' + node.directives.map(print).join(' ')
          : '')
      );

    case Kind.INLINE_FRAGMENT:
      return join(
        [
          '...',
          node.typeCondition ? 'on ' + node.typeCondition.name.value : '',
          printDirectives(node.directives),
          print(node.selectionSet)
        ],
        ' '
      );

    case Kind.FRAGMENT_DEFINITION:
      // Note: fragment *variable* definitions are an experimental graphql-php
      // feature that `@graphql-codegen/client-preset` never emits and that
      // graphql-js is removing in v17, so they are intentionally not printed
      // here. Persisted client documents never carry them.
      return (
        'fragment ' +
        node.name.value +
        ' on ' +
        node.typeCondition.name.value +
        ' ' +
        (node.directives && node.directives.length > 0
          ? node.directives.map(print).join(' ') + ' '
          : '') +
        print(node.selectionSet)
      );

    case Kind.INT:
    case Kind.FLOAT:
    case Kind.ENUM:
    case Kind.NAME:
      return node.value;

    case Kind.STRING:
      return node.block
        ? printBlockString(node.value)
        : JSON.stringify(node.value);

    case Kind.BOOLEAN:
      return node.value ? 'true' : 'false';

    case Kind.NULL:
      return 'null';

    case Kind.LIST:
      return '[' + node.values.map(print).join(', ') + ']';

    case Kind.OBJECT:
      // The key divergence from graphql-js: spaces inside non-empty braces.
      return node.fields.length > 0
        ? '{ ' + node.fields.map(print).join(', ') + ' }'
        : '{}';

    case Kind.DIRECTIVE:
      return (
        '@' +
        node.name.value +
        (node.arguments && node.arguments.length > 0
          ? '(' + node.arguments.map(print).join(', ') + ')'
          : '')
      );

    case Kind.NAMED_TYPE:
      return node.name.value;

    case Kind.LIST_TYPE:
      return '[' + print(node.type) + ']';

    case Kind.NON_NULL_TYPE:
      return print(node.type) + '!';

    default:
      // Persisted queries are executable documents only; type-system nodes
      // never reach the hasher. Surface anything unexpected loudly rather than
      // silently producing a divergent hash.
      throw new Error(
        `printForWpGraphqlSmartCache: unsupported node kind "${node.kind}" — only executable GraphQL documents are supported.`
      );
  }
};

/** Joins non-empty parts with `separator`, dropping empty/null entries. */
const join = (
  parts: (null | string | undefined)[],
  separator: string
): string =>
  parts.filter((part) => part !== '' && part != null).join(separator);

/**
 * Prints a selection set as an indented `{ ... }` block, one entry per line.
 * Matches graphql-php's `printListBlock` for selections.
 */
const block = (parts: string[]): string =>
  parts.length > 0 ? '{\n' + indent(join(parts, '\n')) + '\n}' : '{\n}';

/** Indents every line of `value` by two spaces. */
const indent = (value: string): string =>
  value ? '  ' + value.replace(/\n/g, '\n  ') : value;

/** Prints a list of directives space-separated, or `''` when there are none. */
const printDirectives = (directives: readonly ASTNode[] | undefined): string =>
  directives && directives.length > 0 ? directives.map(print).join(' ') : '';

/**
 * Prints a block string literal (`"""..."""`). Mirrors graphql-php's
 * `printBlockString`: the value is emitted between triple-quote delimiters on
 * their own lines. Persisted *queries* essentially never carry block-string
 * argument literals, but this keeps the printer total over the executable AST.
 */
const printBlockString = (value: string): string => {
  const escaped = value.replace(/"""/g, '\\"""');
  return '"""\n' + escaped + '\n"""';
};
