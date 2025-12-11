import { describe, expect, test } from 'bun:test';
import { z } from 'zod';
import { defineService } from './index';

// ============================================================================
// Test Setup: Types
// ============================================================================

type User = {
  email: string;
  id: string;
  name: string;
};

// ============================================================================
// Test Setup: Custom Errors
// ============================================================================

/**
 * Base error class with status code for testing
 */
class StatusError extends Error {
  /**
   * Creates a new StatusError instance
   * @param message - Error message
   * @param statusCode - HTTP status code
   */
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'StatusError';
  }
}

/**
 * Custom error class for not found scenarios
 */
class NotFoundError extends StatusError {
  /**
   * Creates a new NotFoundError instance
   */
  constructor(message = 'Not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Custom error class for unauthorized scenarios
 */
class UnauthorizedError extends StatusError {
  /**
   * Creates a new UnauthorizedError instance
   */
  constructor(message = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

// ============================================================================
// Test Assertion Helpers
// ============================================================================

/**
 * Asserts that a result is an error of a specific type and narrows the type
 * @param result - The result to check
 * @param errorClass - The expected error class
 */
function assertError<E extends Error>(
  result: unknown,
  errorClass: new (...args: never[]) => E
): asserts result is E {
  expect(result).toBeInstanceOf(errorClass);
}

/**
 * Asserts that a result is a success (has 'ok' property) and narrows the type
 * @param result - The result to check
 */
function assertSuccess<T extends { ok: true }>(
  result: Error | T
): asserts result is T {
  expect(result).not.toBeInstanceOf(Error);
  expect('ok' in result).toBe(true);
}

// ============================================================================
// Test Setup: Mock Data
// ============================================================================

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

    assertSuccess(result);
    expect(result.user.id).toBe('1');
    expect(result.user.name).toBe('Alice');
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

    assertError(result, NotFoundError);
    expect(result.statusCode).toBe(404);
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
    assertSuccess(validResult);

    const invalidResult = await service.create({
      name: 'Invalid',
      email: 'not-an-email'
    });
    assertError(invalidResult, Error);
    expect(invalidResult.message).toContain('Validation failed');
  });
});

// ============================================================================
// Methods Without Input Tests
// ============================================================================

describe('methods without input', () => {
  test('should create methods without input using handler directly', async () => {
    const mockDb = createMockDb();

    const userService = defineService<{ db: typeof mockDb }>()({
      /**
       * Defines service methods
       */
      methods: ({ method }) => ({
        /**
         * Gets all users without requiring input
         */
        getAll: method.handler(async ({ ctx }) => {
          const users = await ctx.db.users.findAll();
          return { ok: true as const, users };
        })
      })
    });

    const service = userService({ db: mockDb });
    const result = await service.getAll();

    assertSuccess(result);
    expect(result.users).toHaveLength(2);
    expect(result.users[0].name).toBe('Alice');
  });

  test('should support multiple methods with and without input', async () => {
    const mockDb = createMockDb();

    const userService = defineService<{ db: typeof mockDb }>()({
      /**
       * Defines service methods
       */
      methods: ({ method }) => ({
        /**
         * Gets all users (no input)
         */
        getAll: method.handler(async ({ ctx }) => {
          const users = await ctx.db.users.findAll();
          return { ok: true as const, users };
        }),
        /**
         * Gets a user by ID (with input)
         */
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

    // Call method without input
    const allResult = await service.getAll();
    assertSuccess(allResult);
    expect(allResult.users).toHaveLength(2);

    // Call method with input
    const byIdResult = await service.getById({ id: '1' });
    assertSuccess(byIdResult);
    expect(byIdResult.user.name).toBe('Alice');
  });

  test('should work with deps and methods without input', async () => {
    const mockDb = createMockDb();

    const userService = defineService<{ db: typeof mockDb }>()({
      /**
       * Defines dependencies
       */
      deps: () => ({ initialized: true }),
      /**
       * Defines service methods
       */
      methods: ({ method }) => ({
        /**
         * Gets status using deps but no input
         */
        getStatus: method.handler(({ deps }) => {
          return Promise.resolve({
            ok: true as const,
            initialized: deps.initialized,
            status: 'ready'
          });
        })
      })
    });

    const service = userService({ db: mockDb });
    const result = await service.getStatus();

    assertSuccess(result);
    expect(result.initialized).toBe(true);
    expect(result.status).toBe('ready');
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
        getWorkspace: method.handler(() => {
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

            const workspaceResult = await deps.workspace.getWorkspace();
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

    assertSuccess(result);
    expect(result.user.id).toBe('1');
    expect(result.workspace.name).toBe('Test Workspace');
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
        test1: method.handler(({ deps }) => {
          return Promise.resolve({
            ok: true as const,
            initialized: deps.initialized
          });
        }),
        /**
         * Test method 2
         */
        test2: method.handler(({ deps }) => {
          return Promise.resolve({
            ok: true as const,
            initialized: deps.initialized
          });
        })
      })
    });

    const service = userService({ value: 'test' });

    await service.test1();
    await service.test2();

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
        getAll: method.handler(async ({ ctx }) => {
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

    const getAllResult = await service.getAll();
    assertSuccess(getAllResult);

    const createResult = await service.create({
      name: 'Dave',
      email: 'dave@example.com'
    });
    assertSuccess(createResult);

    const getByIdResult = await service.getById({ id: createResult.user.id });
    assertSuccess(getByIdResult);
    expect(getByIdResult.user.name).toBe('Dave');
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
    assertError(unauthorizedResult, UnauthorizedError);
    expect(unauthorizedResult.statusCode).toBe(401);

    const notFoundResult = await service.sensitiveOp({
      userId: '999',
      token: 'valid'
    });
    assertError(notFoundResult, NotFoundError);
    expect(notFoundResult.statusCode).toBe(404);

    const successResult = await service.sensitiveOp({
      userId: '1',
      token: 'valid'
    });
    assertSuccess(successResult);
    expect(successResult.user.id).toBe('1');
  });
});

// ============================================================================
// Self-Referential Method Calls Tests (Untyped - self is unknown)
// ============================================================================

// Note: Without .typed<TSelf>(), self is typed as `unknown`
// These tests demonstrate runtime behavior works correctly
describe('self-referential calls (untyped)', () => {
  test('should allow methods to call other methods via self', async () => {
    const mockDb = createMockDb();

    const userService = defineService<{ db: typeof mockDb }>()({
      /**
       * Defines service methods
       */
      methods: ({ method }) => ({
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
         * Gets a user with additional computed data by calling getById
         */
        getByIdWithDetails: method
          .input(z.object({ id: z.string() }))
          .handler(async ({ input, self }) => {
            // Cast self to use it (untyped version)
            const typedSelf = self as {
              getById: (input: {
                id: string;
              }) => Promise<{ ok: true; user: User } | Error>;
            };
            const result = await typedSelf.getById({ id: input.id });
            if (!('ok' in result)) return result;

            return {
              ok: true as const,
              user: result.user,
              computed: `User: ${result.user.name}`
            };
          })
      })
    });

    const service = userService({ db: mockDb });
    const result = await service.getByIdWithDetails({ id: '1' });

    assertSuccess(result);
    expect(result.user.name).toBe('Alice');
    expect(result.computed).toBe('User: Alice');
  });
});

// ============================================================================
// Self-Referential Method Calls Tests (Typed - using .typed<TSelf>())
// ============================================================================

describe('self-referential calls (typed)', () => {
  test('should allow fully typed self-referential calls with .typed<TSelf>()', async () => {
    const mockDb = createMockDb();

    // Define the service interface for typed self
    type IUserService = {
      getById(input: { id: string }): Promise<{ ok: true; user: User } | Error>;
      getByIdWithDetails(input: {
        id: string;
      }): Promise<{ computed: string; ok: true; user: User } | Error>;
    };

    const userService = defineService<{
      db: typeof mockDb;
    }>().typed<IUserService>()({
      /**
       * Defines service methods
       */
      methods: ({ method }) => ({
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
         * Gets a user with additional computed data by calling getById
         */
        getByIdWithDetails: method
          .input(z.object({ id: z.string() }))
          .handler(async ({ input, self }) => {
            // self is now typed as IUserService!
            const result = await self.getById({ id: input.id });
            if (!('ok' in result)) return result;

            return {
              ok: true as const,
              user: result.user,
              computed: `User: ${result.user.name}`
            };
          })
      })
    });

    const service = userService({ db: mockDb });
    const result = await service.getByIdWithDetails({ id: '1' });

    assertSuccess(result);
    expect(result.user.name).toBe('Alice');
    expect(result.computed).toBe('User: Alice');
  });

  test('should propagate errors from typed self-referenced methods', async () => {
    const mockDb = createMockDb();

    type IUserService = {
      getById(input: { id: string }): Promise<{ ok: true; user: User } | Error>;
      getByIdWithDetails(input: {
        id: string;
      }): Promise<{ computed: string; ok: true; user: User } | Error>;
    };

    const userService = defineService<{
      db: typeof mockDb;
    }>().typed<IUserService>()({
      /**
       * Defines service methods
       */
      methods: ({ method }) => ({
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
         * Gets a user with details
         */
        getByIdWithDetails: method
          .input(z.object({ id: z.string() }))
          .handler(async ({ input, self }) => {
            const result = await self.getById({ id: input.id });
            if (!('ok' in result)) return result;

            return {
              ok: true as const,
              user: result.user,
              computed: `User: ${result.user.name}`
            };
          })
      })
    });

    const service = userService({ db: mockDb });
    const result = await service.getByIdWithDetails({ id: '999' });

    assertError(result, NotFoundError);
    expect(result.statusCode).toBe(404);
  });

  test('should support chained typed self-referential calls', async () => {
    const mockDb = createMockDb();

    type IUserService = {
      getById(input: { id: string }): Promise<{ ok: true; user: User } | Error>;
      getByIdWithGreeting(input: {
        id: string;
      }): Promise<{ greeting: string; ok: true; user: User } | Error>;
      getFullProfile(input: {
        id: string;
      }): Promise<
        { fullName: string; greeting: string; ok: true; user: User } | Error
      >;
    };

    const userService = defineService<{
      db: typeof mockDb;
    }>().typed<IUserService>()({
      /**
       * Defines service methods
       */
      methods: ({ method }) => ({
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
         * Adds greeting to user
         */
        getByIdWithGreeting: method
          .input(z.object({ id: z.string() }))
          .handler(async ({ input, self }) => {
            const result = await self.getById({ id: input.id });
            if (!('ok' in result)) return result;

            return {
              ok: true as const,
              user: result.user,
              greeting: `Hello, ${result.user.name}!`
            };
          }),
        /**
         * Adds full profile by calling getByIdWithGreeting
         */
        getFullProfile: method
          .input(z.object({ id: z.string() }))
          .handler(async ({ input, self }) => {
            // Chain: getFullProfile -> getByIdWithGreeting -> getById
            const result = await self.getByIdWithGreeting({ id: input.id });
            if (!('ok' in result)) return result;

            return {
              ok: true as const,
              user: result.user,
              greeting: result.greeting,
              fullName: `${result.user.name} (${result.user.email})`
            };
          })
      })
    });

    const service = userService({ db: mockDb });
    const result = await service.getFullProfile({ id: '2' });

    assertSuccess(result);
    expect(result.user.name).toBe('Bob');
    expect(result.greeting).toBe('Hello, Bob!');
    expect(result.fullName).toBe('Bob (bob@example.com)');
  });

  test('should support typed self with methods without input', async () => {
    const mockDb = createMockDb();

    type IUserService = {
      getAll(): Promise<{ ok: true; users: User[] } | Error>;
      getFirst(): Promise<{ ok: true; user: User } | Error>;
    };

    const userService = defineService<{
      db: typeof mockDb;
    }>().typed<IUserService>()({
      /**
       * Defines service methods
       */
      methods: ({ method }) => ({
        /**
         * Gets all users (no input)
         */
        getAll: method.handler(async ({ ctx }) => {
          const users = await ctx.db.users.findAll();
          return { ok: true as const, users };
        }),
        /**
         * Gets first user by calling getAll
         */
        getFirst: method.handler(async ({ self }) => {
          const result = await self.getAll();
          if (!('ok' in result)) return result;
          if (result.users.length === 0) return new NotFoundError();

          return {
            ok: true as const,
            user: result.users[0]
          };
        })
      })
    });

    const service = userService({ db: mockDb });
    const result = await service.getFirst();

    assertSuccess(result);
    expect(result.user.name).toBe('Alice');
  });

  test('should work with deps and typed self together', async () => {
    const mockDb = createMockDb();

    const workspaceService = defineService<{ db: typeof mockDb }>()({
      /**
       * Defines service methods
       */
      methods: ({ method }) => ({
        /**
         * Gets the workspace
         */
        getWorkspace: method.handler(() => {
          return Promise.resolve({
            ok: true as const,
            workspace: { id: '1', name: 'Test Workspace' }
          });
        })
      })
    });

    type IUserService = {
      getById(input: { id: string }): Promise<{ ok: true; user: User } | Error>;
      getUserWithWorkspace(input: { id: string }): Promise<
        | {
            ok: true;
            user: User;
            workspace: { id: string; name: string };
          }
        | Error
      >;
    };

    const userService = defineService<{
      db: typeof mockDb;
    }>().typed<IUserService>()({
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
         * Gets user with workspace using both self and deps
         */
        getUserWithWorkspace: method
          .input(z.object({ id: z.string() }))
          .handler(async ({ deps, input, self }) => {
            // Use typed self to call getById
            const userResult = await self.getById({ id: input.id });
            if (!('ok' in userResult)) return userResult;

            // Use deps to call workspace service
            const workspaceResult = await deps.workspace.getWorkspace();
            if (!('ok' in workspaceResult)) return workspaceResult;

            return {
              ok: true as const,
              user: userResult.user,
              workspace: workspaceResult.workspace
            };
          })
      })
    });

    const service = userService({ db: mockDb });
    const result = await service.getUserWithWorkspace({ id: '1' });

    assertSuccess(result);
    expect(result.user.name).toBe('Alice');
    expect(result.workspace.name).toBe('Test Workspace');
  });
});
