/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
import * as types from './graphql';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
  '\n  query GetPosts {\n    posts {\n      data {\n        id\n        title\n        body\n      }\n    }\n  }\n': typeof types.GetPostsDocument;
  '\n  query GetPost($id: ID!) {\n    post(id: $id) {\n      id\n      title\n      body\n      user {\n        id\n        name\n        email\n      }\n    }\n  }\n': typeof types.GetPostDocument;
  '\n  mutation CreatePost($input: CreatePostInput!) {\n    createPost(input: $input) {\n      id\n      title\n      body\n    }\n  }\n': typeof types.CreatePostDocument;
};
const documents: Documents = {
  '\n  query GetPosts {\n    posts {\n      data {\n        id\n        title\n        body\n      }\n    }\n  }\n':
    types.GetPostsDocument,
  '\n  query GetPost($id: ID!) {\n    post(id: $id) {\n      id\n      title\n      body\n      user {\n        id\n        name\n        email\n      }\n    }\n  }\n':
    types.GetPostDocument,
  '\n  mutation CreatePost($input: CreatePostInput!) {\n    createPost(input: $input) {\n      id\n      title\n      body\n    }\n  }\n':
    types.CreatePostDocument
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetPosts {\n    posts {\n      data {\n        id\n        title\n        body\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GetPosts {\n    posts {\n      data {\n        id\n        title\n        body\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetPost($id: ID!) {\n    post(id: $id) {\n      id\n      title\n      body\n      user {\n        id\n        name\n        email\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GetPost($id: ID!) {\n    post(id: $id) {\n      id\n      title\n      body\n      user {\n        id\n        name\n        email\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation CreatePost($input: CreatePostInput!) {\n    createPost(input: $input) {\n      id\n      title\n      body\n    }\n  }\n'
): (typeof documents)['\n  mutation CreatePost($input: CreatePostInput!) {\n    createPost(input: $input) {\n      id\n      title\n      body\n    }\n  }\n'];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;
