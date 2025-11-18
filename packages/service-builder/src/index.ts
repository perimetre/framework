import type { z } from 'zod';

export * from './helpers';

/**
 * Represents a failed operation result
 * Can be any Error instance (including custom ServiceError subclasses)
 */
export type ErrorResult = Error;

/**
 * Method builder for defining individual service methods
 */
export type MethodBuilder<TContext, TDeps> = {
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
      }) => Promise<$Output>
    ) => MethodDefinition<TContext, TDeps, TInput, $Output>;
  };
};

/**
 * Union type for operation results
 * Either a success object with { ok: true, ...data } or an error instance
 */
export type Result<TSuccess extends { ok: true }> = ErrorResult | TSuccess;

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
 * Represents a successful operation result
 * T should be the full success object including the `ok: true` field
 */
export type SuccessResult<T> = { ok: true } & T;

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
 */
type MethodDefinition<TContext, TDeps, TInput, TOutput> = {
  _handler: (args: {
    ctx: TContext;
    deps: TDeps;
    input: TInput;
  }) => Promise<TOutput>;
  _input: z.ZodType<TInput>;
};

/**
 * Service definition configuration
 */
type ServiceDefinition<
  TContext,
  TDeps,
  TMethods extends ServiceMethods<TContext, TDeps>
> = {
  deps?: (ctx: TContext) => Promise<TDeps> | TDeps;
  methods: (helpers: { method: MethodBuilder<TContext, TDeps> }) => TMethods;
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
 * Base error that all custom errors should extend from
 * Includes an HTTP status code for API responses
 */
export class ServiceError extends Error {
  /**
   * Creates a service error with an HTTP status code
   * @param message - Error message
   * @param statusCode - HTTP status code (default: 500)
   */
  constructor(
    message: string,
    public readonly statusCode = 500
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * Define a service with type-safe methods and dependency injection
 * @template TContext - The context type (e.g., { payload: Payload })
 * @returns A function that accepts a service definition
 * @example
 * ```typescript
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
 * ```
 */
export function defineService<TContext>() {
  return <TDeps, TMethods extends ServiceMethods<TContext, TDeps>>(
    definition: ServiceDefinition<TContext, TDeps, TMethods>
  ) => {
    const methodBuilder = createMethodBuilder<TContext, TDeps>();
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
            return new ServiceError(
              `Validation failed: ${parseResult.error.message}`,
              400
            ) as ErrorResult;
          }

          // Get dependencies
          const deps = await getDeps();

          // Execute handler
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return await methodDef._handler({
            ctx,
            deps,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            input: parseResult.data
          });
        };
      }

      return service;
    };
  };
}

/**
 * Create a method builder
 */
function createMethodBuilder<TContext, TDeps>(): MethodBuilder<
  TContext,
  TDeps
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
        }) => Promise<$Output>
      ): MethodDefinition<TContext, TDeps, TInput, $Output> => ({
        _handler: handler,
        _input: schema
      })
    })
  };
}
