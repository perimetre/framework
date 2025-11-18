import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-4xl font-bold">tRPC Example</h1>
        <p className="mb-8 text-xl text-gray-600">
          End-to-end type-safe APIs with Next.js App Router
        </p>

        <div className="mb-12 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h2 className="mb-2 text-lg font-semibold">What is tRPC?</h2>
          <p className="text-gray-700">
            tRPC allows you to easily build & consume fully type-safe APIs
            without schemas or code generation. This example demonstrates how to
            use tRPC with Next.js App Router, following the architecture from
            our production application.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Examples</h2>

          {/* Client Component Example */}
          <Link
            className="block rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
            href="/client-component"
          >
            <h3 className="mb-2 text-xl font-semibold">
              Client Component Example →
            </h3>
            <p className="text-gray-600">
              Using tRPC hooks in Client Components. Demonstrates queries,
              mutations, loading states, and optimistic updates.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-800">
                useQuery
              </span>
              <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-800">
                useMutation
              </span>
              <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-800">
                Optimistic Updates
              </span>
            </div>
          </Link>

          {/* Server Component Example */}
          <Link
            className="block rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
            href="/server-component"
          >
            <h3 className="mb-2 text-xl font-semibold">
              Server Component Example →
            </h3>
            <p className="text-gray-600">
              Prefetching data in Server Components and hydrating Client
              Components. No loading states on initial render.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                React Server Components
              </span>
              <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                Prefetching
              </span>
              <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                Hydration
              </span>
            </div>
          </Link>

          {/* Error Handling Example */}
          <Link
            className="block rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
            href="/error-handling"
          >
            <h3 className="mb-2 text-xl font-semibold">Error Handling →</h3>
            <p className="text-gray-600">
              Comprehensive error handling patterns including validation errors,
              authentication errors, and user-friendly error messages.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-800">
                Custom Errors
              </span>
              <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-800">
                Validation
              </span>
              <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-800">
                Auth Errors
              </span>
            </div>
          </Link>
        </div>

        {/* Key Features */}
        <div className="mt-12 rounded-lg bg-gray-50 p-6">
          <h2 className="mb-4 text-2xl font-bold">Key Features Demonstrated</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 font-semibold">Setup & Configuration</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• tRPC initialization with SuperJSON</li>
                <li>• Context creation with React cache</li>
                <li>• API route handler setup</li>
                <li>• Provider configuration</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Middleware</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Authentication middleware</li>
                <li>• Rate limiting middleware</li>
                <li>• Logging middleware</li>
                <li>• Context enrichment</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Validation</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Zod schema validation</li>
                <li>• Input type inference</li>
                <li>• Custom validation rules</li>
                <li>• Error messages</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Error Handling</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Custom error classes</li>
                <li>• Return errors as values</li>
                <li>• HTTP status codes</li>
                <li>• Type-safe error handling</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Documentation Link */}
        <div className="mt-8 rounded border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-gray-700">
            <strong>📚 Documentation:</strong> See{' '}
            <code className="rounded bg-yellow-100 px-1">README.md</code> for
            detailed documentation on file structure and important files to
            review.
          </p>
        </div>
      </div>
    </div>
  );
}
