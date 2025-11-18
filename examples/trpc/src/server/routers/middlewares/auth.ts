import { UnauthorizedError } from '@/shared/exceptions';
import { middleware } from '..';

/**
 * Authentication middleware
 * Ensures the user is authenticated before allowing access to a procedure
 *
 * In a real app with Payload CMS (cpsst-booking example), this would:
 * ```typescript
 * export const authedUserProcedure = middleware(async ({ next, ctx: { payload } }) => {
 *   const { user } = await payload.auth({ headers: await headers() });
 *
 *   if (!user) throw new UnauthorizedError('User is not authenticated');
 *
 *   return next({
 *     ctx: {
 *       user  // Adds authenticated user to context
 *     }
 *   });
 * });
 * ```
 *
 * In a real app with NextAuth, this would:
 * ```typescript
 * import { getServerSession } from 'next-auth';
 * import { authOptions } from '@/server/auth';
 *
 * export const authedUserProcedure = middleware(async ({ next, ctx }) => {
 *   const session = await getServerSession(authOptions);
 *
 *   if (!session?.user) throw new UnauthorizedError('User is not authenticated');
 *
 *   return next({
 *     ctx: {
 *       user: session.user
 *     }
 *   });
 * });
 * ```
 *
 * Example usage:
 * ```ts
 * procedure
 *   .use(authedUserProcedure)
 *   .mutation(async ({ ctx: { user } }) => {
 *     // user is guaranteed to exist here and is fully typed
 *     console.log(user.id, user.email);
 *   })
 * ```
 */
export const authedUserProcedure = middleware(async ({ ctx, next }) => {
  // In a real app, you'd:
  // 1. Extract auth token from headers: await headers()
  // 2. Validate the token
  // 3. Fetch user data from database
  // 4. Add user to context
  const user = ctx.user;

  if (!user) {
    throw new UnauthorizedError('User is not authenticated');
  }

  return next({
    ctx: {
      user // Add authenticated user to context
    }
  });
});

/**
 * Optional authentication middleware
 * Similar to authedUserProcedure but doesn't throw if user is not authenticated
 * Useful for endpoints that have different behavior for authenticated vs anonymous users
 *
 * Example usage:
 * ```ts
 * procedure
 *   .use(optionalAuthProcedure)
 *   .query(async ({ ctx: { user } }) => {
 *     if (user) {
 *       // Return personalized data
 *     } else {
 *       // Return public data
 *     }
 *   })
 * ```
 */
export const optionalAuthProcedure = middleware(async ({ ctx, next }) => {
  return next({
    ctx: {
      user: ctx.user // User may be null
    }
  });
});
