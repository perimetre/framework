'use client';

import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';

type Todo = {
  completed: boolean;
  id: number;
  title: string;
};

async function createTodo(title: string) {
  // This could be any API endpoint
  // It can also live on a separate file for organization.
  const response = await fetch('https://jsonplaceholder.typicode.com/todos', {
    method: 'POST',
    body: JSON.stringify({
      title,
      completed: false,
      userId: 1
    }),
    headers: {
      'Content-type': 'application/json; charset=UTF-8'
    }
  });
  if (!response.ok) throw new Error('Failed to create todo');
  return response.json() as unknown as Todo;
}

async function getTodos() {
  // This could be any API endpoint
  // It can also live on a separate file for organization.
  const response = await fetch('https://jsonplaceholder.typicode.com/todos');
  if (!response.ok) throw new Error('Failed to fetch todos');
  return response.json() as unknown as Todo[];
}

const getTodosQueryKey = ['todos'];

const getTodosQuery = () =>
  queryOptions({
    queryKey: getTodosQueryKey, // ! IMPORTANT: Add all query variables as keys, so that when they change, the query is refetched
    queryFn: getTodos
  });

export default function ClientComponentPage() {
  // *************************
  // * Query example
  // *************************
  const {
    data,
    error: loadingError,
    isLoading,
    isSuccess
  } = useQuery(getTodosQuery());

  // *************************
  // * Mutation example
  // *************************
  const queryClient = useQueryClient();
  // Mutation for creating a new todo
  const {
    error: saveError,
    isError,
    isPending,
    mutate: addTodo
  } = useMutation({
    mutationFn: createTodo,
    onSuccess: async () => {
      // Invalidate and refetch, this will automatically run the query again
      await queryClient.invalidateQueries({ queryKey: getTodosQueryKey });
    }
  });

  const handleAddTodo = () => {
    addTodo(`New Todo ${String(Date.now())}`);
  };

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Client Component Example</h1>
      <p className="mb-4 text-gray-600">
        This demonstrates React Query in a client component with useQuery and
        useMutation.
      </p>

      <button
        className="mb-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-gray-400"
        disabled={isPending}
        onClick={handleAddTodo}
      >
        {isPending ? 'Adding...' : 'Add Todo'}
      </button>

      {isError && (
        <div className="mb-4 rounded bg-red-100 p-2 text-red-700">
          Error: {saveError.message}
        </div>
      )}

      {isLoading && <div>Loading...</div>}
      {loadingError && <div>Error: {loadingError.message}</div>}
      {isSuccess && (
        <div>
          <h2 className="mb-2 text-xl font-semibold">Todos ({data.length})</h2>
          <ul className="space-y-2">
            {data.slice(0, 10).map((todo) => (
              <li key={todo.id} className="rounded bg-gray-100 p-2">
                <span className={todo.completed ? 'line-through' : ''}>
                  {todo.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
