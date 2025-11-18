import { NotFoundError, UnexpectedFetchError } from '@/shared/exceptions';
import { defineService } from '@perimetre/service-builder';
import { z } from 'zod';

/**
 * Service layer for posts
 * Uses JSONPlaceholder API as a data source and service-builder for type safety
 */

const API_BASE_URL = 'https://jsonplaceholder.typicode.com';

/**
 * Type definitions
 */
export type Post = {
  body: string;
  id: number;
  title: string;
  userId: number;
};

/**
 * Posts service definition
 */
export const postsService = defineService<Record<string, unknown>>()({
  methods: ({ method }) => ({
    /**
     * Fetch all posts
     */
    getAll: method.input(z.object({})).handler(async () => {
      const response = await fetch(`${API_BASE_URL}/posts`);

      if (!response.ok) {
        return new UnexpectedFetchError();
      }

      const data = (await response.json()) as Post[];

      return {
        ok: true as const,
        posts: data
      };
    }),

    /**
     * Fetch a single post by ID
     */
    getById: method
      .input(z.object({ id: z.number().int().positive() }))
      .handler(async ({ input }) => {
        const response = await fetch(`${API_BASE_URL}/posts/${input.id}`);

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
      }),

    /**
     * Fetch posts by user ID
     */
    getByUserId: method
      .input(z.object({ userId: z.number().int().positive() }))
      .handler(async ({ input }) => {
        const response = await fetch(
          `${API_BASE_URL}/posts?userId=${input.userId}`
        );

        if (!response.ok) {
          return new UnexpectedFetchError();
        }

        const data = (await response.json()) as Post[];

        return {
          ok: true as const,
          posts: data
        };
      }),

    /**
     * Create a new post
     */
    create: method
      .input(
        z.object({
          body: z.string().min(1).max(5000),
          title: z.string().min(1).max(200),
          userId: z.number().int().positive()
        })
      )
      .handler(async ({ input }) => {
        const response = await fetch(`${API_BASE_URL}/posts`, {
          body: JSON.stringify(input),
          headers: {
            'Content-Type': 'application/json'
          },
          method: 'POST'
        });

        if (!response.ok) {
          return new UnexpectedFetchError();
        }

        const data = (await response.json()) as Post;

        return {
          ok: true as const,
          post: data
        };
      }),

    /**
     * Update an existing post
     */
    update: method
      .input(
        z.object({
          body: z.string().min(1).max(5000).optional(),
          id: z.number().int().positive(),
          title: z.string().min(1).max(200).optional()
        })
      )
      .handler(async ({ input }) => {
        const response = await fetch(`${API_BASE_URL}/posts/${input.id}`, {
          body: JSON.stringify({
            ...(input.body && { body: input.body }),
            ...(input.title && { title: input.title })
          }),
          headers: {
            'Content-Type': 'application/json'
          },
          method: 'PATCH'
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
      }),

    /**
     * Delete a post
     */
    delete: method
      .input(z.object({ id: z.number().int().positive() }))
      .handler(async ({ input }) => {
        const response = await fetch(`${API_BASE_URL}/posts/${input.id}`, {
          method: 'DELETE'
        });

        if (response.status === 404) {
          return new NotFoundError();
        }

        if (!response.ok) {
          return new UnexpectedFetchError();
        }

        return {
          ok: true as const,
          id: input.id
        };
      })
  })
});
