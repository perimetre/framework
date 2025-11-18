'use client';

import { trpc } from '@/client/lib/trpc';
import { type AppRouter } from '@/server/routers/_app';
import { fancyLog, LOG_COLOR } from '@/shared/lib/log';
import { createQueryClient, getUrl } from '@/shared/lib/trpc';
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createTRPCClient, httpBatchLink, loggerLink } from '@trpc/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import superjson from 'superjson';

// Browser-only singleton query client
let browserQueryClient: QueryClient | undefined = undefined;

/**
 * tRPC React Provider
 * Wraps the app with tRPC and React Query providers
 *
 * Features:
 * - Automatic auth error handling (redirects to login)
 * - Request batching for performance
 * - Development tools (React Query Devtools)
 * - Request logging in development
 */
export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const { push } = useRouter();
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        // Debug logging middleware
        ...(process.env.NEXT_PUBLIC_DEBUG_TRPC
          ? [
              loggerLink({
                /**
                 * Custom logger for tRPC requests
                 */
                enabled: () => true,
                logger: (message) => {
                  if (message.direction === 'up') {
                    // Request going to server
                    fancyLog(
                      'log',
                      `tRPC: ${LOG_COLOR.blue} ${message.type.toUpperCase()} ${message.path}`,
                      '\n',
                      'INPUT:',
                      message.input,
                      '\n'
                    );
                  } else {
                    // Response from server (direction === 'down')
                    if (message.result instanceof Error) {
                      fancyLog(
                        'error',
                        `tRPC: ${LOG_COLOR.red} ${message.type.toUpperCase()} ${message.path} - FAILED`,
                        '\n',
                        'ERROR:',
                        message.result,
                        '\n'
                      );
                    } else {
                      fancyLog(
                        'log',
                        `tRPC: ${LOG_COLOR.green} ${message.type.toUpperCase()} ${message.path} - SUCCESS`,
                        '\n',
                        'RESULT:',
                        message.result,
                        '\n'
                      );
                    }
                  }
                }
              })
            ]
          : []),
        httpBatchLink({
          transformer: superjson,
          url: getUrl(),
          headers: {
            'x-trpc-source': 'react-query'
          },
          // Handle errors globally
          /**
           *
           */
          async fetch(url, options) {
            const response = await fetch(url, options);

            // Check for auth errors and redirect to login
            if (response.status === 401) {
              push('/login');
            }

            return response;
          }
        })
      ]
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

/**
 * Get or create the query client
 * Server: always create a new client
 * Browser: create once and reuse (important for React Suspense)
 */
function getQueryClient() {
  if (typeof window === 'undefined') {
    return createQueryClient();
  } else {
    browserQueryClient ??= createQueryClient();
    return browserQueryClient;
  }
}
