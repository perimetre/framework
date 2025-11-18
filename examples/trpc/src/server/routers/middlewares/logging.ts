import { middleware } from '..';

/**
 * Logging middleware
 * Logs information about each procedure call
 * Useful for debugging and monitoring
 */
export const loggingProcedure = middleware(async ({ next, path, type }) => {
  const start = Date.now();

  console.log(`[tRPC] ${type.toUpperCase()} ${path} - started`);

  try {
    const result = await next();
    const duration = Date.now() - start;
    console.log(
      `[tRPC] ${type.toUpperCase()} ${path} - completed in ${duration}ms`
    );
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(
      `[tRPC] ${type.toUpperCase()} ${path} - failed in ${duration}ms`,
      error
    );
    throw error;
  }
});
