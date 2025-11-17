import { graphql } from '@/server/graphql/__generated__';
import type { GetPostQueryVariables } from '@/server/graphql/__generated__/graphql';
import {
  graphqlMutationOptions,
  graphqlOptions
} from '@/shared/react-query/graphql';

// *************************
// * GraphQL Query: Get Posts
// *************************
// This query fetches a list of posts from the GraphQLZero API
export const GetPostsDocument = graphql(/* GraphQL */ `
  query GetPosts {
    posts {
      data {
        id
        title
        body
      }
    }
  }
`);

export const getPostsQuery = () => graphqlOptions(GetPostsDocument);

// *************************
// * GraphQL Query: Get Post by ID
// *************************
// This query fetches a single post by its ID
export const GetPostDocument = graphql(/* GraphQL */ `
  query GetPost($id: ID!) {
    post(id: $id) {
      id
      title
      body
      user {
        id
        name
        email
      }
    }
  }
`);

export const getPostQuery = (variables: GetPostQueryVariables) =>
  graphqlOptions(GetPostDocument, variables);

// *************************
// * GraphQL Mutation: Create Post
// *************************
// This mutation creates a new post
export const CreatePostDocument = graphql(/* GraphQL */ `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      title
      body
    }
  }
`);

export const createPostMutation = () =>
  graphqlMutationOptions(CreatePostDocument);
