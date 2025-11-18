import { initTRPC } from '@trpc/server';
import 'server-only';
import superjson from 'superjson';
import { type Context } from '../lib/trpc/context';

/**
 * Meta type for procedures
 * Can be used to add metadata to procedures (e.g., permissions, rate limits)
 */
type Meta = {};

/**
 * Initialize tRPC with context and transformer
 * - Context provides shared data to all procedures
 * - SuperJSON allows serializing Dates, Maps, Sets, etc.
 */
const t = initTRPC.context<Context>().meta<Meta>().create({
  transformer: superjson
});

/**
 * Export reusable router and procedure builders
 * These are the building blocks for defining your API
 */
export const createCallerFactory = t.createCallerFactory;
export const middleware = t.middleware;
export const router = t.router;
export const procedure = t.procedure;
