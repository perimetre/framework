import type { Result } from './index';

/**
 * Type guard to check if result is an error
 */
export function isError<T extends { ok: true }>(
  result: Result<T>
): result is Error {
  return result instanceof Error;
}

/**
 * Type guard to check if result is successful
 * Helps TypeScript narrow the type correctly
 */
export function isSuccess<T extends { ok: true }>(
  result: Result<T>
): result is T {
  return 'ok' in result;
}

/**
 * Unwrap a result, throwing if it's an error
 * Useful in tRPC routers where you want to throw errors
 * @template T - The success result type
 * @param result - The result to unwrap
 * @returns The success value
 * @throws {Error} The error if result is an error
 */
export function unwrap<T extends { ok: true }>(result: Result<T>): T;
export function unwrap<T extends { ok: true }>(result: Error | T): T {
  if (result instanceof Error) {
    throw result;
  }
  return result;
}
