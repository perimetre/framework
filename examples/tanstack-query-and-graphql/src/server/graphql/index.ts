import { fancyLog, LOG_COLOR } from '@/shared/lib/log';
// This is the only file where this can be used
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { GraphQLClient } from 'graphql-request';
import invariant from 'tiny-invariant';

invariant(
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
  'NEXT_PUBLIC_GRAPHQL_ENDPOINT is not defined'
);

const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;

export const graphqlClient = new GraphQLClient(endpoint, {
  headers: {
    // Uncomment if authentication is required
    // Authorization: `Bearer ${process.env.AUTH_TOKEN}`
  },
  ...(process.env.NEXT_PUBLIC_DEBUG_GRAPHQL
    ? {
        /**
         * Middleware to log GraphQL requests for debugging purposes
         */
        requestMiddleware: (request) => {
          if ('body' in request && typeof request.body === 'string') {
            const body: unknown = JSON.parse(request.body);
            if (
              typeof body === 'object' &&
              body !== null &&
              'operationName' in body &&
              'variables' in body &&
              'query' in body &&
              typeof body.operationName === 'string'
            ) {
              fancyLog(
                'log',
                `GRAPHQL: ${LOG_COLOR.green} ${body.operationName}`,
                '\n',
                'VARIABLES:',
                body.variables,
                '\n',
                'QUERY:',
                body.query,
                '\n'
              );
            }
          }

          return request;
        }
      }
    : {})
});
