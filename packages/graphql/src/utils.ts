import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { Kind } from 'graphql';

/**
 * Logger interface consumed by the package. Designed to match the surface of
 * common loggers (Sentry, pino, console). Pass `console` for the simplest
 * possible setup; pass `Sentry.logger` for production.
 */
export type GraphqlLogger = {
  debug: (message: string, attrs?: Record<string, unknown>) => void;
  error: (message: string, attrs?: Record<string, unknown>) => void;
  info: (message: string, attrs?: Record<string, unknown>) => void;
  warn: (message: string, attrs?: Record<string, unknown>) => void;
};

/**
 * String form of `Kind.OPERATION_DEFINITION` for comparisons against the
 * narrowed `kind: string` shapes used throughout this package.
 */
export const OPERATION_DEFINITION_KIND: string = Kind.OPERATION_DEFINITION;

/**
 * Shape of a serialized graphql-request body — what arrives in
 * `requestMiddleware` as `request.body` after JSON serialization.
 */
export type GraphqlRequestBody = {
  operationName?: string;
  query?: string;
  variables?: Record<string, unknown>;
};

/**
 * Whether a value is a plain object, so its keys can be read as `unknown`.
 * Parsed JSON and documents from outside go through this, not a cast.
 */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Whether a value can be sent as GraphQL variables: graphql-request takes any
 * object there.
 */
export const variablesObject = (value: unknown): object | undefined =>
  typeof value === 'object' && value !== null ? value : undefined;

/**
 * Hands a response's `data` to the caller as the typed document's result.
 * Nothing can check it at runtime: the typed document is the contract, and
 * the server validated `data` against the schema the document was generated
 * from. Every executor goes through here, so this is the one place that
 * trusts it.
 * @param _document - The document `data` answers, which sets its type
 * @param data - The response's `data`
 */
export const resultData = <TResult>(
  _document: TypedDocumentNode<TResult, never>,
  data: unknown
): TResult =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- the typed document is the contract for `data`, as explained above
  data as TResult;

/**
 * Finds the operation definition of a document, whatever was passed in.
 * Hand-built and generated documents both work.
 */
export const operationDefinitionOf = (
  document: unknown
): Record<string, unknown> | undefined => {
  if (!isRecord(document) || !Array.isArray(document.definitions)) {
    return undefined;
  }
  const definitions: unknown[] = document.definitions;
  return definitions
    .filter(isRecord)
    .find((definition) => definition.kind === Kind.OPERATION_DEFINITION);
};

/**
 * Extracts the GraphQL operation name from a serialized request body so
 * middleware can correlate logs across the request/response pair.
 */
export const parseOperationName = (body: unknown): string => {
  if (typeof body !== 'string') return 'UnknownOperation';
  try {
    const parsed: unknown = JSON.parse(body);
    if (isRecord(parsed) && typeof parsed.operationName === 'string') {
      return parsed.operationName;
    }
  } catch {
    // fall through
  }
  return 'UnknownOperation';
};

/**
 * Best-effort host extractor for log/span attributes. Falls back to "" so
 * spans always have a `host` key rather than `undefined`.
 */
export const hostFromUrl = (url: string): string => {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
};

/**
 * Resolves the GraphQL operation name from a typed document — useful as a
 * stable query-key fragment and for debugging.
 */
export const getOperationName = (document: unknown): string => {
  const name = operationDefinitionOf(document)?.name;
  return isRecord(name) && typeof name.value === 'string'
    ? name.value
    : 'AnonymousOperation';
};
