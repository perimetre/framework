import type { DocumentNode, OperationDefinitionNode } from 'graphql';
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
 * Extracts the GraphQL operation name from a serialized request body so
 * middleware can correlate logs across the request/response pair.
 */
export const parseOperationName = (body: unknown): string => {
  if (typeof body !== 'string') return 'UnknownOperation';
  try {
    const parsed: unknown = JSON.parse(body);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'operationName' in parsed &&
      typeof (parsed as GraphqlRequestBody).operationName === 'string'
    ) {
      return (parsed as GraphqlRequestBody).operationName ?? 'UnknownOperation';
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
  if (
    typeof document !== 'object' ||
    document === null ||
    !('definitions' in document)
  ) {
    return 'AnonymousOperation';
  }

  const definitions = (document as DocumentNode).definitions;
  const operation = definitions.find(
    (definition): definition is OperationDefinitionNode =>
      definition.kind === Kind.OPERATION_DEFINITION
  );

  return operation?.name?.value ?? 'AnonymousOperation';
};
