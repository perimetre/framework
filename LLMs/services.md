# Service Pattern with @perimetre/service-builder

A practical guide to implementing the service layer pattern in TypeScript backends using `@perimetre/service-builder`.

## What is the Service Pattern?

The **service pattern** is an architectural approach that separates business logic from routes/controllers into reusable, testable service modules. Think of it as the "business logic layer" between your API endpoints and data sources.

**Core principle:** Routes handle HTTP concerns (request/response), services handle business logic (validation, data transformation, orchestration).

```
┌─────────────┐
│   Route     │ ← HTTP request/response, auth middleware
│  (tRPC)     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Service    │ ← Business logic, validation, error handling
│   Layer     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Data      │ ← Database, APIs, external services
│   Sources   │
└─────────────┘
```

**Similar patterns:** Repository pattern (C#), use cases (Clean Architecture), but simpler and more function-oriented for TypeScript.

## When to Use Services

✅ **Use services for:**

- Business logic that could be reused across multiple routes
- Complex operations involving multiple data sources
- Logic that needs testing independent of HTTP layer
- Orchestrating calls to external APIs or databases
- Data transformation and validation

❌ **Don't use services for:**

- Simple CRUD operations that are one-liners
- Pure HTTP concerns (status codes, headers, cookies)

Imagine if one day you switch from tRPC to REST or GraphQL. With services, your business logic remains intact and reusable. And the Route/Controller/Http layer can be swapped out easily.
This facilitates refactoring, maintainability, testability, and separation of concerns in your codebase

## Where Services Belong

**File structure:**

```
src/
├── server/
│   ├── routers/           # tRPC routes - thin HTTP layer
│   │   ├── posts.ts       # Posts router (handles HTTP)
│   │   └── users.ts       # Users router (handles HTTP)
│   │
│   ├── services/          # Business logic layer
│   │   ├── posts.ts       # Posts service (business logic)
│   │   └── users.ts       # Users service (business logic)
│   │
│   └── lib/
│       └── db.ts          # Database client
│
└── shared/
    └── exceptions.ts      # Custom error classes
```

**Key principle:** Each service focuses on ONE domain (posts, users, orders, etc.).

## Responsibility Boundaries

### Routes/Controllers (tRPC/Express)

**Owns:**

- HTTP request/response handling
- Authentication/authorization (via middleware)
- Input validation (Zod schema on route level)
- Converting service errors to HTTP responses
- Request-specific context (user session, headers)

**Does NOT own:**

- Business logic
- Data fetching/transformation
- Complex validation rules
- Service orchestration

### Services

**Owns:**

- Business logic and rules
- Data fetching from multiple sources
- Error handling as values (not throwing)
- Input validation (Zod schema in service)
- Calling other services (composition)
- Data transformation

**Does NOT own:**

- HTTP status codes (but can suggest via the custom error's statusCode)
- Request/response objects
- Authentication logic (receives authenticated context)
- Cookies, headers. It should receive only the data it needs as inputs
- Route-level concerns

### Data Sources (DB/APIs)

**Owns:**

- Raw data access
- Query execution
- Connection management

## Basic Service Example

```typescript
// src/server/services/posts.ts
import { defineService } from '@perimetre/service-builder';
import { NotFoundError } from '@/shared/exceptions';
import { z } from 'zod';
import type { Kysely } from 'kysely';
import type { Database } from '@/server/lib/db';

// Define service with context type (dependencies)
export const postsService = defineService<{ db: Kysely<Database> }>()({
  methods: ({ method }) => ({
    /**
     * Fetch a single post by ID
     */
    getById: method
      .input(z.object({ id: z.number().int().positive() }))
      .handler(async ({ ctx, input }) => {
        // Business logic here - using Kysely for type-safe queries
        const post = await ctx.db
          .selectFrom('posts')
          .selectAll()
          .where('id', '=', input.id)
          .executeTakeFirst();

        // ✅ Return Error instance for failures
        if (!post) return new NotFoundError();

        // ✅ Return { ok: true, ...data } for success
        return {
          ok: true as const,
          post
        };
      }),

    /**
     * Create a new post
     */
    create: method
      .input(
        z.object({
          title: z.string().min(1).max(200),
          body: z.string().min(1).max(5000),
          userId: z.number().int().positive()
        })
      )
      .handler(async ({ ctx, input }) => {
        // Check if user exists
        const user = await ctx.db
          .selectFrom('users')
          .selectAll()
          .where('id', '=', input.userId)
          .executeTakeFirst();

        if (!user) return new NotFoundError('User not found');

        // Create post
        const post = await ctx.db
          .insertInto('posts')
          .values({
            title: input.title,
            body: input.body,
            authorId: input.userId
          })
          .returningAll()
          .executeTakeFirstOrThrow();

        return {
          ok: true as const,
          post
        };
      })
  })
});

// Usage in route
const result = await postsService({ db }).getById({ id: 1 });
if (!('ok' in result)) throw result; // Convert to HTTP error
return result.post;
```

## ⚠️ Critical Rule: Success vs. Failure

**IMPORTANT:** The `ok: true` discriminator is **ONLY** for successful results.

```typescript
// ✅ CORRECT: ok: true ONLY on success
handler: async ({ input }) => {
  const post = await db.post.findById(input.id);
  if (!post) return new NotFoundError(); // ✅ Return Error instance
  return { ok: true as const, post }; // ✅ ok: true only for success
};

// ❌ WRONG: Never return ok: false
handler: async ({ input }) => {
  const post = await db.post.findById(input.id);
  if (!post) return { ok: false, error: 'Not found' }; // ❌ NEVER DO THIS
  return { ok: true as const, post };
};
```

**The Rule:**

- ✅ Success → `{ ok: true as const, ...data }`
- ✅ Failure → `new CustomError()` (Error instance)
- ❌ Never → `{ ok: false, ... }`

**Why?** TypeScript discriminated unions rely on the presence/absence of the `ok` property. See `https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/error-handling-exception.md` for full details.

## Service Composition (Calling Other Services)

Services can depend on other services using the `deps` pattern:

```typescript
// Service 1: User service
export const userService = defineService<{ db: Kysely<Database> }>()({
  methods: ({ method }) => ({
    getById: method
      .input(z.object({ id: z.number() }))
      .handler(async ({ ctx, input }) => {
        const user = await ctx.db
          .selectFrom('users')
          .selectAll()
          .where('id', '=', input.id)
          .executeTakeFirst();

        if (!user) return new NotFoundError('User not found');
        return { ok: true as const, user };
      })
  })
});

// Service 2: Posts service (depends on user service)
export const postsService = defineService<{ db: Kysely<Database> }>()({
  // ✨ Declare dependencies - initialized once per service instance
  deps: (ctx) => ({
    users: userService(ctx)
  }),

  methods: ({ method }) => ({
    create: method
      .input(
        z.object({
          userId: z.number(),
          title: z.string(),
          body: z.string()
        })
      )
      .handler(async ({ ctx, deps, input }) => {
        // ✨ Use dependency service with full type safety
        const userResult = await deps.users.getById({ id: input.userId });

        // PREFERRED: Check for success first
        if (!('ok' in userResult)) return userResult; // Propagate error

        // User exists, create post
        const post = await ctx.db
          .insertInto('posts')
          .values({
            title: input.title,
            body: input.body,
            authorId: userResult.user.id
          })
          .returningAll()
          .executeTakeFirstOrThrow();

        return { ok: true as const, post };
      })
  })
});
```

**Key benefits:**

- Full type safety (no need for type assertions)
- Automatic dependency injection
- Easy to test (mock dependencies)
- Clear dependency graph

## Multiple Service Dependencies

```typescript
// Email service
const emailService = defineService<{ emailClient: EmailClient }>()({
  methods: ({ method }) => ({
    send: method
      .input(
        z.object({
          to: z.string().email(),
          subject: z.string(),
          body: z.string()
        })
      )
      .handler(async ({ ctx, input }) => {
        await ctx.emailClient.send(input);
        return { ok: true as const, sent: true };
      })
  })
});

// Notification service
const notificationService = defineService<{ db: Kysely<Database> }>()({
  methods: ({ method }) => ({
    create: method
      .input(z.object({ userId: z.number(), message: z.string() }))
      .handler(async ({ ctx, input }) => {
        const notification = await ctx.db
          .insertInto('notifications')
          .values(input)
          .returningAll()
          .executeTakeFirstOrThrow();

        return { ok: true as const, notification };
      })
  })
});

// Order service (depends on multiple services)
export const orderService = defineService<{
  db: Kysely<Database>;
  emailClient: EmailClient;
}>()({
  // Depend on multiple services
  deps: (ctx) => ({
    users: userService(ctx),
    emails: emailService({ emailClient: ctx.emailClient }),
    notifications: notificationService(ctx)
  }),

  methods: ({ method }) => ({
    create: method
      .input(
        z.object({
          userId: z.number(),
          items: z.array(
            z.object({ productId: z.number(), quantity: z.number() })
          )
        })
      )
      .handler(async ({ ctx, deps, input }) => {
        // Verify user exists
        const userResult = await deps.users.getById({ id: input.userId });
        if (!('ok' in userResult)) return userResult;

        // Create order
        const order = await ctx.db
          .insertInto('orders')
          .values({
            userId: input.userId
          })
          .returningAll()
          .executeTakeFirstOrThrow();

        // Send email and create notification in parallel
        await Promise.all([
          deps.emails.send({
            to: userResult.user.email,
            subject: 'Order confirmed',
            body: `Order #${order.id} confirmed`
          }),
          deps.notifications.create({
            userId: input.userId,
            message: `Order #${order.id} created`
          })
        ]);

        return { ok: true as const, order };
      })
  })
});
```

## Integration with tRPC Routes

**Pattern:** Routes are THIN - they delegate to services immediately.

```typescript
// src/server/routers/posts.ts
import { router, procedure } from '.';
import { postsService } from '../services/posts';
import { z } from 'zod';

export const postsRouter = router({
  // Query: Read operation
  getById: procedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const result = await postsService({ db: ctx.db }).getById({
        id: input.id
      });

      // PREFERRED: Check for success discriminator
      if (!('ok' in result)) throw result; // tRPC converts to HTTP error

      return result.post; // TypeScript knows this is Post type
    }),

  // Mutation: Write operation
  create: procedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        body: z.string().min(1).max(5000),
        userId: z.number().int().positive()
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await postsService({ db: ctx.db }).create(input);

      if (!('ok' in result)) throw result;

      return result.post;
    })
});
```

**Key pattern:**

1. Route receives input
2. Route calls service (passing context/dependencies)
3. Route checks for error: `if (!('ok' in result)) throw result`
4. Route returns success data

**No business logic in routes!** Routes are just HTTP glue.

## Routes Can Call Multiple Services

A route doesn't have to map 1:1 with a service method. Routes can orchestrate multiple services:

```typescript
export const bookingRouter = router({
  createBooking: procedure
    .input(bookingSchema)
    .mutation(async ({ input, ctx }) => {
      // Call multiple services
      const userResult = await userService({ db: ctx.db }).getById({
        id: input.userId
      });
      if (!('ok' in userResult)) throw userResult;

      const slotResult = await calendarService({
        db: ctx.db
      }).checkAvailability({
        trainerId: input.trainerId,
        date: input.date
      });
      if (!('ok' in slotResult)) throw slotResult;

      const bookingResult = await bookingService({ db: ctx.db }).create({
        userId: userResult.user.id,
        trainerId: input.trainerId,
        slotId: slotResult.slot.id
      });
      if (!('ok' in bookingResult)) throw bookingResult;

      // Send email notification
      await emailService({ emailClient: ctx.emailClient }).sendConfirmation({
        to: userResult.user.email,
        booking: bookingResult.booking
      });

      return bookingResult.booking;
    })
});
```

## Services Without Routes

**Not every service needs a route!** Services are reusable units:

```typescript
// src/server/services/analytics.ts
// This service is called by other services, not exposed as a route
export const analyticsService = defineService<{ db: Kysely<Database> }>()({
  methods: ({ method }) => ({
    trackEvent: method
      .input(
        z.object({
          userId: z.number(),
          event: z.string(),
          metadata: z.record(z.unknown()).optional()
        })
      )
      .handler(async ({ ctx, input }) => {
        await ctx.db.insertInto('events').values(input).execute();
        return { ok: true as const };
      })
  })
});

// Used by other services
export const orderService = defineService<{ db: Kysely<Database> }>()({
  deps: (ctx) => ({
    analytics: analyticsService(ctx)
  }),

  methods: ({ method }) => ({
    create: method.input(orderSchema).handler(async ({ ctx, deps, input }) => {
      const order = await ctx.db
        .insertInto('orders')
        .values(input)
        .returningAll()
        .executeTakeFirstOrThrow();

      // Track analytics (no route needed)
      await deps.analytics.trackEvent({
        userId: input.userId,
        event: 'order_created',
        metadata: { orderId: order.id }
      });

      return { ok: true as const, order };
    })
  })
});
```

## Context (Dependency Injection)

**Context** is how you pass dependencies (database, config, external APIs) to services:

### Option 1: Kysely (Type-Safe SQL Query Builder)

```typescript
// Define context type
type AppContext = {
  db: Kysely<Database>; // Kysely for type-safe SQL queries
  redis: Redis;
  config: {
    apiKey: string;
    baseUrl: string;
  };
};

// Use in service
export const userService = defineService<AppContext>()({
  methods: ({ method }) => ({
    getById: method
      .input(z.object({ id: z.number() }))
      .handler(async ({ ctx, input }) => {
        // Try cache first
        const cached = await ctx.redis.get(`user:${input.id}`);
        if (cached) {
          return {
            ok: true as const,
            user: JSON.parse(cached),
            fromCache: true
          };
        }

        // Fetch from database
        const user = await ctx.db
          .selectFrom('users')
          .selectAll()
          .where('id', '=', input.id)
          .executeTakeFirst();

        if (!user) return new NotFoundError();

        // Cache for next time
        await ctx.redis.set(
          `user:${input.id}`,
          JSON.stringify(user),
          'EX',
          300
        );

        return { ok: true as const, user, fromCache: false };
      })
  })
});

// Initialize with context
const db = await connectToDatabase();
const redis = await connectToRedis();
const service = userService({
  db,
  redis,
  config: {
    apiKey: process.env.API_KEY!,
    baseUrl: 'https://api.example.com'
  }
});
```

### Option 2: Payload CMS (Headless CMS with Type-Safe API)

```typescript
import type { Payload } from 'payload';

// Define context type with Payload
type AppContext = {
  payload: Payload; // Payload CMS for content management
  redis: Redis;
  config: {
    apiKey: string;
    baseUrl: string;
  };
};

// Use Payload in service
export const userService = defineService<AppContext>()({
  methods: ({ method }) => ({
    getById: method
      .input(z.object({ id: z.number() }))
      .handler(async ({ ctx, input }) => {
        // Try cache first
        const cached = await ctx.redis.get(`user:${input.id}`);
        if (cached) {
          return {
            ok: true as const,
            user: JSON.parse(cached),
            fromCache: true
          };
        }

        // Fetch from Payload CMS
        const user = await ctx.payload.findByID({
          collection: 'users',
          id: input.id
        });

        if (!user) return new NotFoundError();

        // Cache for next time
        await ctx.redis.set(
          `user:${input.id}`,
          JSON.stringify(user),
          'EX',
          300
        );

        return { ok: true as const, user, fromCache: false };
      })
  })
});

// Initialize with Payload context
import { getPayload } from 'payload';

const payload = await getPayload({ config });
const redis = await connectToRedis();
const service = userService({
  payload,
  redis,
  config: {
    apiKey: process.env.API_KEY!,
    baseUrl: 'https://api.example.com'
  }
});
```

**Benefits:**

- Testability (mock context in tests)
- Flexibility (swap implementations - Kysely, Payload, or any other data source)
- Explicit dependencies (no hidden globals)
- Type safety (both Kysely and Payload provide full TypeScript types)

## Error Handling

Services return errors as values (not throw). See `https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/error-handling-exception.md` for full details.

**Key patterns:**

```typescript
// 1. Check for success first (PREFERRED)
const result = await service.method(input);
if (!('ok' in result)) {
  throw result; // Or handle error
}
// TypeScript knows result.data exists here
console.log(result.data);

// 2. Early return pattern (recommended for services)
const userResult = await deps.users.getById({ id: input.userId });
if (!('ok' in userResult)) return userResult; // Propagate error

// 3. Distinguish error types (when needed)
if (result instanceof NotFoundError) {
  console.error('Not found');
} else if (result instanceof UnauthorizedError) {
  console.error('Unauthorized');
} else if ('ok' in result) {
  console.log('Success:', result.data);
}
```

**Pattern priority:**

1. Use `'ok' in result` for success/error checks (primary)
2. Use `instanceof` only when distinguishing error types (secondary)

## Custom Error Classes

Define domain-specific errors with HTTP status codes:

```typescript
// src/shared/exceptions.ts
export class NotFoundError extends Error {
  name = 'NotFoundError';
  statusCode = 404 as const;

  constructor(message = 'Not found') {
    super(message);
  }
}

export class UnauthorizedError extends Error {
  name = 'UnauthorizedError';
  statusCode = 401 as const;

  constructor(message = 'Unauthorized') {
    super(message);
  }
}

export class ValidationError<T> extends Error {
  name = 'ValidationError';
  statusCode = 400 as const;

  constructor(public errors: ErrorTree<T>) {
    super('Validation failed');
  }
}

export class BusinessRuleError extends Error {
  name = 'BusinessRuleError';
  statusCode = 422 as const;

  constructor(
    public code: 'INSUFFICIENT_STOCK' | 'DUPLICATE_ORDER' | 'INVALID_STATE',
    message?: string
  ) {
    super(message || code);
  }
}
```

**Use in services:**

```typescript
handler: async ({ ctx, input }) => {
  // Check business rules
  const product = await ctx.db
    .selectFrom('products')
    .selectAll()
    .where('id', '=', input.productId)
    .executeTakeFirst();

  if (!product) return new NotFoundError('Product not found');

  if (product.stock < input.quantity) {
    return new BusinessRuleError(
      'INSUFFICIENT_STOCK',
      `Only ${product.stock} items available`
    );
  }

  // Proceed with order
  const order = await ctx.db
    .insertInto('orders')
    .values(input)
    .returningAll()
    .executeTakeFirstOrThrow();

  return { ok: true as const, order };
};
```

## Testing Services

Services are easy to test because they're pure functions with explicit dependencies:

```typescript
// tests/services/posts.test.ts
import { postsService } from '@/server/services/posts';
import { NotFoundError } from '@/shared/exceptions';

describe('postsService', () => {
  it('should return post by id', async () => {
    const mockDb = {
      post: {
        findUnique: jest.fn().mockResolvedValue({ id: 1, title: 'Test' })
      }
    };

    const service = postsService({ db: mockDb as any });
    const result = await service.getById({ id: 1 });

    expect('ok' in result).toBe(true);
    if ('ok' in result) {
      expect(result.post.title).toBe('Test');
    }
  });

  it('should return NotFoundError when post does not exist', async () => {
    const mockDb = {
      post: {
        findUnique: jest.fn().mockResolvedValue(null)
      }
    };

    const service = postsService({ db: mockDb as any });
    const result = await service.getById({ id: 999 });

    expect(result instanceof NotFoundError).toBe(true);
  });
});
```

## Real-World Example: E-commerce Order Service

```typescript
// src/server/services/orders.ts
import { defineService } from '@perimetre/service-builder';
import { NotFoundError, BusinessRuleError } from '@/shared/exceptions';
import { z } from 'zod';
import type { Kysely } from 'kysely';
import type { Database } from '@/server/lib/db';

type Context = {
  db: Kysely<Database>;
  stripe: Stripe;
  emailClient: EmailClient;
};

export const orderService = defineService<Context>()({
  deps: (ctx) => ({
    users: userService(ctx),
    products: productService(ctx),
    emails: emailService({ emailClient: ctx.emailClient })
  }),

  methods: ({ method }) => ({
    /**
     * Create a new order
     * 1. Verify user exists
     * 2. Check product availability
     * 3. Calculate total
     * 4. Process payment
     * 5. Create order record
     * 6. Send confirmation email
     */
    create: method
      .input(
        z.object({
          userId: z.number(),
          items: z.array(
            z.object({
              productId: z.number(),
              quantity: z.number().positive()
            })
          ),
          paymentMethodId: z.string()
        })
      )
      .handler(async ({ ctx, deps, input }) => {
        // 1. Verify user
        const userResult = await deps.users.getById({ id: input.userId });
        if (!('ok' in userResult)) return userResult;

        // 2. Fetch products and check availability
        const productResults = await Promise.all(
          input.items.map((item) =>
            deps.products.getById({ id: item.productId })
          )
        );

        // Check if any product fetch failed
        const productError = productResults.find((r) => !('ok' in r));
        if (productError) return productError as any;

        // Check stock availability
        for (let i = 0; i < input.items.length; i++) {
          const product = productResults[i];
          if ('ok' in product) {
            if (product.product.stock < input.items[i].quantity) {
              return new BusinessRuleError(
                'INSUFFICIENT_STOCK',
                `Product ${product.product.name} has insufficient stock`
              );
            }
          }
        }

        // 3. Calculate total
        const total = input.items.reduce((sum, item, i) => {
          const product = productResults[i];
          if ('ok' in product) {
            return sum + product.product.price * item.quantity;
          }
          return sum;
        }, 0);

        // 4. Process payment
        try {
          const charge = await ctx.stripe.charges.create({
            amount: total * 100, // Stripe uses cents
            currency: 'usd',
            customer: userResult.user.stripeCustomerId,
            payment_method: input.paymentMethodId
          });

          if (charge.status !== 'succeeded') {
            return new BusinessRuleError(
              'PAYMENT_FAILED',
              'Payment was declined'
            );
          }

          // 5. Create order record
          const order = await ctx.db
            .insertInto('orders')
            .values({
              userId: input.userId,
              total,
              chargeId: charge.id
            })
            .returningAll()
            .executeTakeFirstOrThrow();

          // Insert order items
          for (const [i, item] of input.items.entries()) {
            const product = productResults[i];
            if ('ok' in product) {
              await ctx.db
                .insertInto('orderItems')
                .values({
                  orderId: order.id,
                  productId: item.productId,
                  quantity: item.quantity,
                  price: product.product.price
                })
                .execute();
            }
          }

          // 6. Send confirmation email (don't block on this)
          deps.emails
            .send({
              to: userResult.user.email,
              subject: 'Order Confirmation',
              body: `Your order #${order.id} for $${total} has been confirmed`
            })
            .catch((error) => {
              console.error('Failed to send confirmation email:', error);
            });

          return { ok: true as const, order };
        } catch (error) {
          console.error('Payment processing failed:', error);
          return new BusinessRuleError(
            'PAYMENT_FAILED',
            'Failed to process payment'
          );
        }
      })
  })
});
```

## Performance Considerations

**Caching:**

```typescript
export const userService = defineService<{
  db: Kysely<Database>;
  redis: Redis;
}>()({
  methods: ({ method }) => ({
    getById: method
      .input(z.object({ id: z.number() }))
      .handler(async ({ ctx, input }) => {
        const cacheKey = `user:${input.id}`;
        const cached = await ctx.redis.get(cacheKey);

        if (cached) {
          return {
            ok: true as const,
            user: JSON.parse(cached),
            fromCache: true
          };
        }

        const user = await ctx.db
          .selectFrom('users')
          .selectAll()
          .where('id', '=', input.id)
          .executeTakeFirst();

        if (!user) return new NotFoundError();

        await ctx.redis.set(cacheKey, JSON.stringify(user), 'EX', 300);
        return { ok: true as const, user, fromCache: false };
      })
  })
});
```

**Parallel operations:**

```typescript
handler: async ({ ctx, deps, input }) => {
  // ✅ Fetch in parallel when possible
  const [userResult, settingsResult] = await Promise.all([
    deps.users.getById({ id: input.userId }),
    deps.settings.get({})
  ]);

  if (!('ok' in userResult)) return userResult;
  if (!('ok' in settingsResult)) return settingsResult;

  // Continue with both results
  return {
    ok: true as const,
    user: userResult.user,
    settings: settingsResult.settings
  };
};
```

## Best Practices Summary

### DO ✅

- Keep routes thin - delegate to services immediately
- Return errors as values (not throw)
- Use `ok: true as const` ONLY for success
- Use Zod for input validation
- Use `deps` pattern for service composition
- Make services pure functions with explicit dependencies
- Use `'ok' in result` for success checks (primary pattern)
- Use early returns to avoid nesting
- Create domain-specific error classes

### DON'T ❌

- Put business logic in routes/controllers
- Return `ok: false` or include `ok` in error results
- Throw errors in service handlers
- Create circular service dependencies
- Mix controlled and uncontrolled patterns
- Use `instanceof Error` for simple success checks
- Access request/response objects in services
- Make services depend on HTTP concerns

## Additional Resources

- **Full API Reference:** `https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/packages/service-builder/README.md`
- **Error Handling Pattern:** `https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/error-handling-exception.md`
- **tRPC Integration:** `https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/trpc.md`
- **Working Example:** `https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/examples/trpc/src/server/services/posts.ts`

## Quick Reference

```typescript
// Define service
export const myService = defineService<TContext>()({
  deps: (ctx) => ({
    otherService: otherService(ctx)
  }),
  methods: ({ method }) => ({
    myMethod: method.input(zodSchema).handler(async ({ ctx, deps, input }) => {
      // Business logic
      if (error) return new CustomError();
      return { ok: true as const, data };
    })
  })
});

// Use in route
const result = await myService({ ctx }).myMethod(input);
if (!('ok' in result)) throw result;
return result.data;

// Use in another service
const result = await deps.myService.myMethod(input);
if (!('ok' in result)) return result; // Propagate error
// Continue with result.data
```
