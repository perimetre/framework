import { cache } from 'react';
import 'server-only';

/**
 * Context type for authentication
 * In a real app, this would come from your auth provider (e.g., Clerk, NextAuth, Payload CMS)
 */
type User = {
  email: string;
  id: string;
  name: string;
} | null;

/**
 * Create context for tRPC
 *
 * This is called for each request and provides shared data/utilities to all procedures.
 * Uses React's cache() to ensure the context is only created once per request.
 *
 * In a real application, this is where you would:
 * - Initialize your database client (e.g., Prisma, Drizzle, Payload CMS)
 * - Extract and validate authentication tokens from headers
 * - Fetch user session information
 * - Set up request-specific instances (loggers, tracing, etc.)
 *
 * Example implementation with Payload CMS (from cpsst-booking):
 * ```typescript
 * import { getPayload } from '@/server/payload.config';
 *
 * export const createContext = cache(async () => {
 *   return {
 *     payload: await getPayload(),           // Database/CMS instance
 *     bypassAuth: false,                     // Custom auth flags
 *     confirmationAccess: null               // Custom auth fields
 *   };
 * });
 * ```
 *
 * Example implementation with Prisma + NextAuth:
 * ```typescript
 * import { getServerSession } from 'next-auth';
 * import { prisma } from '@/server/db';
 * import { authOptions } from '@/server/auth';
 *
 * export const createContext = cache(async () => {
 *   const session = await getServerSession(authOptions);
 *
 *   return {
 *     db: prisma,           // Database client
 *     user: session?.user   // Authenticated user
 *   };
 * });
 * ```
 */
export const createContext = cache(async () => {
  return {
    user: null as User
    // In a real app, you might also have:
    // - db: Database client
    // - payload: Payload CMS instance
    // - session: Auth session
    // - headers: Request headers
  };
});

/**
 * Type inference for the context
 * This type is automatically inferred from the return value of createContext()
 * and is used throughout your tRPC routers for type safety
 */
export type Context = Awaited<ReturnType<typeof createContext>>;
