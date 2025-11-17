'use client';

import { getQueryClient } from '@/shared/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { lazy, type PropsWithChildren, Suspense } from 'react';

// Dynamically import ReactQueryDevtools only in development
const ReactQueryDevtools =
  process.env.NODE_ENV === 'development'
    ? lazy(() =>
        import('@tanstack/react-query-devtools').then((d) => ({
          default: d.ReactQueryDevtools
        }))
      )
    : null;

/**
 * The React Query provider for the app
 */
const ReactQueryClientProvider: React.FC<PropsWithChildren> = ({
  children
}) => {
  // Ref: https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
  // const [queryClient] = useState(getQueryClient);

  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && ReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools />
        </Suspense>
      )}
    </QueryClientProvider>
  );
};

export default ReactQueryClientProvider;
