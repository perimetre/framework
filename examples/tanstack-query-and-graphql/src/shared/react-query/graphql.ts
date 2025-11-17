import { graphqlClient } from '@/server/graphql';
import { type TypedDocumentNode } from '@graphql-typed-document-node/core';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

/**
 * A helper to create a mutation option for a GraphQL mutation
 */
export function graphqlMutationOptions<TResult, TVariables>(
  document: TypedDocumentNode<TResult, TVariables>
) {
  return mutationOptions({
    /**
     * Run the mutation
     */
    mutationFn: async (variables: TVariables) =>
      graphqlClient.request(document, variables as object | undefined)
  });
}

/**
 * A helper to create a query option for a GraphQL query
 */
export function graphqlOptions<TResult, TVariables>(
  document: TypedDocumentNode<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
) {
  return queryOptions({
    queryKey: [document, variables] as const,
    /**
     * Run the query
     */
    queryFn: async ({ queryKey }) =>
      graphqlClient.request(queryKey[0], queryKey[1] as object | undefined)
  });
}
