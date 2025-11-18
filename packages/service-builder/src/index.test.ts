import { describe, expect, test } from 'bun:test';
import { z } from 'zod';
import { defineService, ServiceError } from './index';

// ============================================================================
// Test Setup: Custom Errors
// ============================================================================

type User = {
  email: string;
  id: string;
  name: string;
};

/**
 * Custom error class for not found scenarios
 */
class NotFoundError extends ServiceError {
  /**
   * Creates a new NotFoundError instance
   */
  constructor(message = 'Not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

// ============================================================================
// Test Setup: Mock Data
// ============================================================================

/**
 * Custom error class for unauthorized scenarios
 */
class UnauthorizedError extends ServiceError {
  /**
   * Creates a new UnauthorizedError instance
   */
  constructor(message = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Creates a mock database for testing
 */
const createMockDb = () => {
  const users: User[] = [
    { id: '1', name: 'Alice', email: 'alice@example.com' },
    { id: '2', name: 'Bob', email: 'bob@example.com' }
  ];

  return {
    users: {
      /**
       * Creates a new user
       */
      create: (data: { email: string; name: string }): Promise<User> => {
        const user: User = { id: String(users.length + 1), ...data };
        users.push(user);
        return Promise.resolve(user);
      },
      /**
       * Finds all users
       */
      findAll: (): Promise<User[]> => {
        return Promise.resolve(users);
      },
      /**
       * Finds a user by ID
       */
      findById: (id: string): Promise<null | User> => {
        return Promise.resolve(users.find((u) => u.id === id) ?? null);
      }
    }
  };
};

// ============================================================================
// Basic Tests
// ============================================================================

describe('defineService', () => {
  test('should create a service with methods', async () => {
    const mockDb = createMockDb();

    const userService = defineService<{ db: typeof mockDb }>()({
      /**
       * Defines service methods
       */
      methods: ({ method }) => ({
        getById: method
          .input(z.object({ id: z.string() }))
          .handler(async ({ ctx, input }) => {
            const user = await ctx.db.users.findById(input.id);
            if (!user) return new NotFoundError();
            return { ok: true as const, user };
          })
      })
    });

    const service = userService({ db: mockDb });
    const result = await service.getById({ id: '1' });

    expect('ok' in result).toBe(true);
    expect('ok' in result && result.user.id).toBe('1');
    expect('ok' in result && result.user.name).toBe('Alice');
  });

  test('should handle not found errors', async () => {
    const mockDb = createMockDb();

    const userService = defineService<{ db: typeof mockDb }>()({
      /**
       * Defines service methods
       */
      methods: ({ method }) => ({
        getById: method
          .input(z.object({ id: z.string() }))
          .handler(async ({ ctx, input }) => {
            const user = await ctx.db.users.findById(input.id);
            if (!user) return new NotFoundError();
            return { ok: true as const, user };
          })
      })
    });

    const service = userService({ db: mockDb });
    const result = await service.getById({ id: '999' });

    expect(result instanceof NotFoundError).toBe(true);
    expect(result instanceof NotFoundError && result.statusCode).toBe(404);
  });

  test('should validate input with Zod schema', async () => {
    const mockDb = createMockDb();

    const userService = defineService<{ db: typeof mockDb }>()({
      /**
       * Defines service methods
       */
      methods: ({ method }) => ({
        create: method
          .input(z.object({ email: z.email(), name: z.string() }))
          .handler(async ({ ctx, input }) => {
            const user = await ctx.db.users.create(input);
            return { ok: true as const, user };
          })
      })
    });

    const service = userService({ db: mockDb });

    const validResult = await service.create({
      name: 'Charlie',
      email: 'charlie@example.com'
    });
    expect('ok' in validResult).toBe(true);

    const invalidResult = await service.create({
      name: 'Invalid',
      email: 'not-an-email'
    });
    expect(invalidResult instanceof ServiceError).toBe(true);
    expect(
      invalidResult instanceof ServiceError && invalidResult.statusCode
    ).toBe(400);
  });
});

// ============================================================================
// Dependencies Tests
// ============================================================================

describe('dependencies', () => {
  test('should support deps pattern', async () => {
    const mockDb = createMockDb();

    const workspaceService = defineService<{ db: typeof mockDb }>()({
      /**
       * Defines service methods
       */
      methods: ({ method }) => ({
        /**
         * Gets the workspace
         */
        getWorkspace: method.input(z.object({})).handler(() => {
          return Promise.resolve({
            ok: true as const,
            workspace: { id: '1', name: 'Test Workspace' }
          });
        })
      })
    });

    const userService = defineService<{ db: typeof mockDb }>()({
      /**
       * Defines dependencies for the user service
       */
      deps: (ctx) => ({
        workspace: workspaceService(ctx)
      }),
      /**
       * Defines service methods
       */
      methods: ({ method }) => ({
        /**
         * Gets a user with their workspace
         */
        getUserWithWorkspace: method
          .input(z.object({ id: z.string() }))
          .handler(async ({ ctx, deps, input }) => {
            const user = await ctx.db.users.findById(input.id);
            if (!user) return new NotFoundError();

            const workspaceResult = await deps.workspace.getWorkspace({});
            if (!('ok' in workspaceResult)) return workspaceResult;

            return {
              ok: true as const,
              user,
              workspace: workspaceResult.workspace
            };
          })
      })
    });

    const service = userService({ db: mockDb });
    const result = await service.getUserWithWorkspace({ id: '1' });

    expect('ok' in result).toBe(true);
    expect('ok' in result && result.user.id).toBe('1');
    expect('ok' in result && result.workspace.name).toBe('Test Workspace');
  });

  test('should cache deps per service instance', async () => {
    let depsInitCount = 0;

    const userService = defineService<{ value: string }>()({
      /**
       * Initializes dependencies (should be called once)
       */
      deps: () => {
        depsInitCount++;
        return Promise.resolve({ initialized: true });
      },
      /**
       * Defines service methods
       */
      methods: ({ method }) => ({
        /**
         * Test method 1
         */
        test1: method.input(z.object({})).handler(({ deps }) => {
          return Promise.resolve({
            ok: true as const,
            initialized: deps.initialized
          });
        }),
        /**
         * Test method 2
         */
        test2: method.input(z.object({})).handler(({ deps }) => {
          return Promise.resolve({
            ok: true as const,
            initialized: deps.initialized
          });
        })
      })
    });

    const service = userService({ value: 'test' });

    await service.test1({});
    await service.test2({});

    expect(depsInitCount).toBe(1);
  });
});

// ============================================================================
// Multiple Methods Tests
// ============================================================================

describe('multiple methods', () => {
  test('should support multiple methods in one service', async () => {
    const mockDb = createMockDb();

    const userService = defineService<{ db: typeof mockDb }>()({
      /**
       * Defines service methods
       */
      methods: ({ method }) => ({
        /**
         * Gets all users
         */
        getAll: method.input(z.object({})).handler(async ({ ctx }) => {
          const users = await ctx.db.users.findAll();
          return { ok: true as const, users };
        }),
        /**
         * Gets a user by ID
         */
        getById: method
          .input(z.object({ id: z.string() }))
          .handler(async ({ ctx, input }) => {
            const user = await ctx.db.users.findById(input.id);
            if (!user) return new NotFoundError();
            return { ok: true as const, user };
          }),
        /**
         * Creates a new user
         */
        create: method
          .input(z.object({ email: z.email(), name: z.string() }))
          .handler(async ({ ctx, input }) => {
            const user = await ctx.db.users.create(input);
            return { ok: true as const, user };
          })
      })
    });

    const service = userService({ db: mockDb });

    const getAllResult = await service.getAll({});
    expect('ok' in getAllResult).toBe(true);

    const createResult = await service.create({
      name: 'Dave',
      email: 'dave@example.com'
    });
    expect('ok' in createResult).toBe(true);

    // Since we asserted success, we can safely access the user.id
    // Type assertion is valid here due to previous check
    type SuccessResult = { ok: true; user: User } & typeof createResult;
    const userId = (createResult as SuccessResult).user.id;

    const getByIdResult = await service.getById({ id: userId });
    expect('ok' in getByIdResult).toBe(true);
    expect('ok' in getByIdResult && getByIdResult.user.name).toBe('Dave');
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('error handling', () => {
  test('should support multiple error types', async () => {
    const mockDb = createMockDb();

    const userService = defineService<{ db: typeof mockDb }>()({
      /**
       * Defines service methods
       */
      methods: ({ method }) => ({
        /**
         * Performs a sensitive operation requiring authentication
         */
        sensitiveOp: method
          .input(z.object({ token: z.string(), userId: z.string() }))
          .handler(async ({ ctx, input }) => {
            if (!input.token || input.token === 'invalid') {
              return new UnauthorizedError();
            }

            const user = await ctx.db.users.findById(input.userId);
            if (!user) return new NotFoundError();

            return { ok: true as const, user };
          })
      })
    });

    const service = userService({ db: mockDb });

    const unauthorizedResult = await service.sensitiveOp({
      userId: '1',
      token: 'invalid'
    });
    expect(unauthorizedResult instanceof UnauthorizedError).toBe(true);

    const notFoundResult = await service.sensitiveOp({
      userId: '999',
      token: 'valid'
    });
    expect(notFoundResult instanceof NotFoundError).toBe(true);

    const successResult = await service.sensitiveOp({
      userId: '1',
      token: 'valid'
    });
    expect('ok' in successResult).toBe(true);
  });
});

// ============================================================================
// ServiceError Tests
// ============================================================================

describe('ServiceError', () => {
  test('should create error with default status code', () => {
    const error = new ServiceError('Something went wrong');
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('Something went wrong');
  });

  test('should create error with custom status code', () => {
    const error = new ServiceError('Bad request', 400);
    expect(error.statusCode).toBe(400);
  });

  test('should support inheritance', () => {
    /**
     * Custom error for testing inheritance
     */
    class CustomError extends ServiceError {
      /**
       * Creates a new CustomError instance
       */
      constructor() {
        super('Custom error', 418);
        this.name = 'CustomError';
      }
    }

    const error = new CustomError();
    expect(error instanceof ServiceError).toBe(true);
    expect(error.statusCode).toBe(418);
  });
});
