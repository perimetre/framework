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
 *
 * PREFERRED: Use inline checks like `if (!('ok' in result)) throw result;`
 * This helper is provided for convenience but inline checks are more explicit.
 * @template T - The success result type
 * @param result - The result to unwrap
 * @returns The success value
 * @throws {Error} The error if result is an error
 * @example
 * // PREFERRED: Inline check
 * const result = await service.getUser({ id });
 * if (!('ok' in result)) throw result;
 * return result.user;
 *
 * // Alternative: Using helper
 * return unwrap(await service.getUser({ id })).user;
 */
export function unwrap<T extends { ok: true }>(result: Result<T>): T;
export function unwrap<T extends { ok: true }>(result: Error | T): T {
  if (!('ok' in result)) {
    throw result;
  }
  return result;
}
