import { fancyLog, LOG_COLOR } from '@/shared/lib/log';
import { createGraphqlClient, type GraphqlLogger } from '@perimetre/graphql';
import {
  withRequestLogger,
  withResponseLogger
} from '@perimetre/graphql/middlewares';
import invariant from 'tiny-invariant';

invariant(
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
  'NEXT_PUBLIC_GRAPHQL_ENDPOINT is not defined'
);

const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;

/**
 * Adapter that lets `@perimetre/graphql` drive this project's existing
 * `fancyLog` helper. The logger interface is structural — any object
 * implementing `{ debug, info, warn, error }` with the right signature
 * works (Sentry's logger, `console`, `pino`, etc.).
 */
const logger: GraphqlLogger = {
  debug: (message, attrs) =>
    process.env.NEXT_PUBLIC_DEBUG_GRAPHQL
      ? fancyLog('log', message, LOG_COLOR.gray, attrs ?? '')
      : undefined,
  info: (message, attrs) =>
    fancyLog('log', message, LOG_COLOR.green, attrs ?? ''),
  warn: (message, attrs) =>
    fancyLog('log', message, LOG_COLOR.yellow, attrs ?? ''),
  error: (message, attrs) =>
    fancyLog('error', message, LOG_COLOR.red, attrs ?? '')
};

export const graphqlClient = createGraphqlClient({
  endpoint,
  plugins: [
    withRequestLogger({
      logger,
      endpoint,
      debug: !!process.env.NEXT_PUBLIC_DEBUG_GRAPHQL
    }),
    withResponseLogger({ logger })
  ]
});
