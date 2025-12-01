import type { z } from 'zod';

/**
 * Method builder for defining individual service methods
 * @template TContext - The context type
 * @template TDeps - The dependencies type
 * @template TSelf - The self type for self-referential calls (defaults to unknown)
 */
export type MethodBuilder<TContext, TDeps, TSelf = unknown> = {
  /**
   * Define the input schema for this method using Zod
   * @param schema - Zod schema for input validation
   */
  input: <TInput>(schema: z.ZodType<TInput>) => {
    /**
     * Define the handler function for this method
     * The generic $Output is inferred from the handler's return type
     * @param handler - Async function that processes the input and returns a result
     */
    handler: <$Output>(
      handler: (args: {
        ctx: TContext;
        deps: TDeps;
        input: TInput;
        self: TSelf;
      }) => Promise<$Output>
    ) => MethodDefinition<TContext, TDeps, TInput, $Output>;
  };
};

/**
 * Transform methods into callable service
 */
export type Service<
  TContext,
  TDeps,
  TMethods extends ServiceMethods<TContext, TDeps>
> = {
  [K in keyof TMethods]: (
    input: InferInput<TMethods[K]>
  ) => Promise<InferOutput<TMethods[K]>>;
};

/**
 * Service builder type - callable with optional .typed<TSelf>() for typed self-referential calls
 */
export type ServiceBuilder<TContext> = {
  /**
   * Define a service without typed self (self will be unknown)
   */
  <TDeps, TMethods extends ServiceMethods<TContext, TDeps>>(
    definition: ServiceDefinition<TContext, TDeps, TMethods>
  ): (ctx: TContext) => Service<TContext, TDeps, TMethods>;

  /**
   * Enable typed self-referential calls by providing a service interface
   * @template TSelf - Interface describing the service shape for self calls
   * @example
   * ```typescript
   * interface IUserService {
   *   getUser(input: { id: string }): Promise<{ ok: true; user: User } | Error>;
   * }
   * const userService = defineService<Context>().typed<IUserService>()({...});
   * ```
   */
  typed: <TSelf>() => <TDeps, TMethods extends ServiceMethods<TContext, TDeps>>(
    definition: ServiceDefinition<TContext, TDeps, TMethods, TSelf>
  ) => (ctx: TContext) => Service<TContext, TDeps, TMethods>;
};

/**
 * Infer input type from a method definition
 */
type InferInput<T> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends MethodDefinition<any, any, infer TInput, any> ? TInput : never;

/**
 * Infer output type from a method definition
 */
type InferOutput<T> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends MethodDefinition<any, any, any, infer TOutput> ? TOutput : never;

/**
 * Internal method definition
 * Note: self is typed as unknown here since the actual type varies per service
 */
type MethodDefinition<TContext, TDeps, TInput, TOutput> = {
  _handler: (args: {
    ctx: TContext;
    deps: TDeps;
    input: TInput;
    self: unknown;
  }) => Promise<TOutput>;
  _input: z.ZodType<TInput>;
};

/**
 * Service definition configuration
 * @template TSelf - Optional self type for typed self-referential calls
 */
type ServiceDefinition<
  TContext,
  TDeps,
  TMethods extends ServiceMethods<TContext, TDeps>,
  TSelf = unknown
> = {
  deps?: (ctx: TContext) => Promise<TDeps> | TDeps;
  methods: (helpers: {
    method: MethodBuilder<TContext, TDeps, TSelf>;
  }) => TMethods;
};

/**
 * Service methods object type
 */
type ServiceMethods<TContext, TDeps> = Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MethodDefinition<TContext, TDeps, any, any>
>;

/**
 * Internal error class for validation failures
 */
class ValidationError extends Error {
  /**
   * Creates a validation error with status code 400
   * @param message - Error message describing the validation failure
   * @param statusCode - HTTP status code (default: 400)
   */
  constructor(
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Define a service with type-safe methods and dependency injection
 * @template TContext - The context type (e.g., { payload: Payload })
 * @returns A service builder with optional .typed<TSelf>() for self-referential calls
 * @example
 * ```typescript
 * // Without typed self (self is unknown)
 * const userService = defineService<{ db: Database }>()({
 *   methods: ({ method }) => ({
 *     getById: method
 *       .input(z.object({ id: z.string() }))
 *       .handler(async ({ ctx, input }) => {
 *         const user = await ctx.db.user.findById(input.id);
 *         if (!user) return new NotFoundError();
 *         return { ok: true, user };
 *       })
 *   })
 * });
 *
 * // With typed self for self-referential calls
 * interface IUserService {
 *   getById(input: { id: string }): Promise<{ ok: true; user: User } | Error>;
 *   getWithPosts(input: { id: string }): Promise<{ ok: true; user: User; posts: Post[] } | Error>;
 * }
 * const userService = defineService<{ db: Database }>().typed<IUserService>()({
 *   methods: ({ method }) => ({
 *     getById: method.input(...).handler(...),
 *     getWithPosts: method
 *       .input(z.object({ id: z.string() }))
 *       .handler(async ({ self, input }) => {
 *         // self is typed as IUserService
 *         const result = await self.getById({ id: input.id });
 *         // ...
 *       })
 *   })
 * });
 * ```
 */
export function defineService<TContext>(): ServiceBuilder<TContext> {
  /**
   * Create the service factory from a definition
   */
  const createServiceFactory = <
    TDeps,
    TMethods extends ServiceMethods<TContext, TDeps>,
    TSelf
  >(
    definition: ServiceDefinition<TContext, TDeps, TMethods, TSelf>
  ) => {
    const methodBuilder = createMethodBuilder<TContext, TDeps, TSelf>();
    const methods = definition.methods({ method: methodBuilder });

    /**
     * Create service instance with context
     */
    return (ctx: TContext): Service<TContext, TDeps, TMethods> => {
      // Initialize dependencies
      let depsCache: TDeps | undefined;
      /**
       * Get or initialize dependencies
       */
      const getDeps = async (): Promise<TDeps> => {
        if (depsCache) return depsCache;
        if (definition.deps) {
          depsCache = await definition.deps(ctx);
          return depsCache;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
        return {} as any;
      };

      // Build the service methods
      const service = {} as Service<TContext, TDeps, TMethods>;

      for (const [methodName, methodDef] of Object.entries(methods)) {
        /**
         * Validate input and execute method handler
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        service[methodName as keyof TMethods] = async (input: any) => {
          // Validate input
          const parseResult = methodDef._input.safeParse(input);
          if (!parseResult.success) {
            return new ValidationError(
              `Validation failed: ${parseResult.error.message}`
            );
          }

          // Get dependencies
          const deps = await getDeps();

          // Execute handler
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return await methodDef._handler({
            ctx,
            deps,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            input: parseResult.data,
            self: service
          });
        };
      }

      return service;
    };
  };

  /**
   * Default builder - self is typed as unknown
   */
  const builder = <TDeps, TMethods extends ServiceMethods<TContext, TDeps>>(
    definition: ServiceDefinition<TContext, TDeps, TMethods>
  ) => createServiceFactory(definition);

  /**
   * Typed builder - self is typed as TSelf
   */
  builder.typed = <TSelf>() => {
    return <TDeps, TMethods extends ServiceMethods<TContext, TDeps>>(
      definition: ServiceDefinition<TContext, TDeps, TMethods, TSelf>
    ) => createServiceFactory(definition);
  };

  return builder as ServiceBuilder<TContext>;
}

/**
 * Create a method builder
 */
function createMethodBuilder<TContext, TDeps, TSelf>(): MethodBuilder<
  TContext,
  TDeps,
  TSelf
> {
  return {
    /**
     * Define input schema
     */
    input: <TInput>(schema: z.ZodType<TInput>) => ({
      /**
       * Define handler function
       */
      handler: <$Output>(
        handler: (args: {
          ctx: TContext;
          deps: TDeps;
          input: TInput;
          self: TSelf;
        }) => Promise<$Output>
      ): MethodDefinition<TContext, TDeps, TInput, $Output> => ({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        _handler: handler as any,
        _input: schema
      })
    })
  };
}
