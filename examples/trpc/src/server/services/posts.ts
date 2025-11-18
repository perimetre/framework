import { NotFoundError, UnexpectedFetchError } from '@/shared/exceptions';
import { z } from 'zod';

/**
 * Service layer for posts
 * Uses JSONPlaceholder API as a data source
 *
 * In a real app, this would interact with your database
 *
 * Pattern from cpsst-booking:
 * - Define Zod schemas at module level
 * - Use z.infer<typeof schema> for TypeScript types
 * - Validate inputs with schema.parse() at function entry
 * - Let Zod validation errors bubble up to tRPC
 */

const API_BASE_URL = 'https://jsonplaceholder.typicode.com';

/**
 * Zod schemas for service input validation
 */
const getPostByIdSchema = z.object({
  id: z.number().int().positive()
});

const getPostsByUserIdSchema = z.object({
  userId: z.number().int().positive()
});

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  userId: z.number().int().positive()
});

const updatePostSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(5000).optional()
});

const deletePostSchema = z.object({
  id: z.number().int().positive()
});

/**
 * Type definitions inferred from schemas
 */
export type Post = {
  body: string;
  id: number;
  title: string;
  userId: number;
};

/**
 * Fetch all posts
 */
export const getPosts = async () => {
  const response = await fetch(`${API_BASE_URL}/posts`);

  if (!response.ok) {
    return new UnexpectedFetchError();
  }

  const data = (await response.json()) as Post[];

  return {
    ok: true as const,
    posts: data
  };
};

/**
 * Fetch a single post by ID
 * @example
 * const result = await getPostById({ id: 1 });
 * if ('ok' in result) {
 *   console.log(result.post);
 * }
 */
export const getPostById = async (args: z.infer<typeof getPostByIdSchema>) => {
  const { id } = getPostByIdSchema.parse(args);

  const response = await fetch(`${API_BASE_URL}/posts/${id}`);

  if (response.status === 404) {
    return new NotFoundError();
  }

  if (!response.ok) {
    return new UnexpectedFetchError();
  }

  const data = (await response.json()) as Post;

  return {
    ok: true as const,
    post: data
  };
};

/**
 * Fetch posts by user ID
 * @example
 * const result = await getPostsByUserId({ userId: 1 });
 * if ('ok' in result) {
 *   console.log(result.posts);
 * }
 */
export const getPostsByUserId = async (
  args: z.infer<typeof getPostsByUserIdSchema>
) => {
  const { userId } = getPostsByUserIdSchema.parse(args);

  const response = await fetch(`${API_BASE_URL}/posts?userId=${userId}`);

  if (!response.ok) {
    return new UnexpectedFetchError();
  }

  const data = (await response.json()) as Post[];

  return {
    ok: true as const,
    posts: data
  };
};

/**
 * Create a new post
 * Note: JSONPlaceholder doesn't actually persist data, it just returns a fake response
 * @example
 * const result = await createPost({
 *   title: 'My Post',
 *   body: 'Post content',
 *   userId: 1
 * });
 * if ('ok' in result) {
 *   console.log(result.post);
 * }
 */
export const createPost = async (args: z.infer<typeof createPostSchema>) => {
  const input = createPostSchema.parse(args);

  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: 'POST',
    body: JSON.stringify(input),
    headers: {
      'Content-type': 'application/json; charset=UTF-8'
    }
  });

  if (!response.ok) {
    return new UnexpectedFetchError();
  }

  const data = (await response.json()) as Post;

  return {
    ok: true as const,
    post: data
  };
};

/**
 * Update a post
 * Note: JSONPlaceholder doesn't actually persist data, it just returns a fake response
 * @example
 * const result = await updatePost({
 *   id: 1,
 *   title: 'Updated Title'
 * });
 * if ('ok' in result) {
 *   console.log(result.post);
 * }
 */
export const updatePost = async (args: z.infer<typeof updatePostSchema>) => {
  const { id, ...input } = updatePostSchema.parse(args);

  const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
    headers: {
      'Content-type': 'application/json; charset=UTF-8'
    }
  });

  if (response.status === 404) {
    return new NotFoundError();
  }

  if (!response.ok) {
    return new UnexpectedFetchError();
  }

  const data = (await response.json()) as Post;

  return {
    ok: true as const,
    post: data
  };
};

/**
 * Delete a post
 * Note: JSONPlaceholder doesn't actually persist data, it just returns a fake response
 * @example
 * const result = await deletePost({ id: 1 });
 * if ('ok' in result) {
 *   console.log('Post deleted');
 * }
 */
export const deletePost = async (args: z.infer<typeof deletePostSchema>) => {
  const { id } = deletePostSchema.parse(args);

  const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
    method: 'DELETE'
  });

  if (response.status === 404) {
    return new NotFoundError();
  }

  if (!response.ok) {
    return new UnexpectedFetchError();
  }

  return {
    ok: true as const
  };
};
