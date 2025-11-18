# @perimetre/service-builder

A lightweight, type-safe service builder inspired by tRPC for creating dependency-injected services with validated inputs.

## Features

- ✨ **Perfect type inference** - Types flow automatically without assertions (like tRPC!)
- 🛡️ **Type-safe input validation** using Zod schemas
- 🔌 **Dependency injection** through the deps pattern
- 🎯 **Error handling as values** (Go/Rust-like pattern)
- 📦 **Zero bundle overhead** - Ships TypeScript source for optimal tree-shaking
- 🪶 **Tiny** - ~200 lines of code, no runtime dependencies (except Zod peer dep)

## ⚠️ Critical Pattern: Success vs. Failure

**IMPORTANT:** The `ok: true` discriminator is **ONLY** for successful results.

```typescript
// ✅ CORRECT: Return ok: true ONLY on success
handler: async ({ input }) => {
  const user = await db.user.findById(input.id);
  if (!user) return new NotFoundError(); // ✅ Return Error instance
  return { ok: true as const, user }; // ✅ ok: true only for success
};

// ❌ WRONG: Never return ok: false
handler: async ({ input }) => {
  const user = await db.user.findById(input.id);
  if (!user) return { ok: false, error: 'Not found' }; // ❌ NEVER DO THIS
  return { ok: true as const, user };
};

// ❌ WRONG: Never include ok in error results
handler: async ({ input }) => {
  const user = await db.user.findById(input.id);
  if (!user) return { ok: false as const, error: new NotFoundError() }; // ❌ NEVER DO THIS
  return { ok: true as const, user };
};
```

**The Rule:**

- ✅ Success → `{ ok: true as const, ...data }`
- ✅ Failure → `new CustomError()` (Error instance)
- ❌ Never → `{ ok: false, ... }`

## Installation

```bash
pnpm add @perimetre/service-builder zod
```

> **Note:** This package ships TypeScript source code (unbundled) and is designed to be consumed by your project's bundler (Vite, Next.js, Remix, etc.).

## Quick Start

```typescript
import { defineService, ServiceError } from '@perimetre/service-builder';
import { z } from 'zod';

// 1. Define custom errors (optional but recommended)
class NotFoundError extends ServiceError {
  constructor(message = 'Not found') {
    super(message, 404);
  }
}

// 2. Define your service
const userService = defineService<{ db: Database }>()({
  methods: ({ method }) => ({
    getById: method
      .input(z.object({ id: z.string() }))
      .handler(async ({ ctx, input }) => {
        const user = await ctx.db.user.findById(input.id);
        if (!user) return new NotFoundError();
        return { ok: true as const, user };
      })
  })
});

// 3. Use the service
const service = userService({ db: prisma });
const result = await service.getById({ id: '123' });

// 4. Handle results (PREFERRED: Check for success first)
if ('ok' in result) {
  console.log('User:', result.user); // ✨ TypeScript knows `user` exists!
} else {
  // Handle errors - use instanceof to distinguish error types
  if (result instanceof NotFoundError) {
    console.error('User not found');
  } else {
    console.error('Error:', result.message);
  }
}
```

## Usage Patterns

### 1. Simple Usage (No Context)

For services that don't need external dependencies:

```typescript
const mathService = defineService<Record<string, unknown>>()({
  methods: ({ method }) => ({
    add: method
      .input(z.object({ a: z.number(), b: z.number() }))
      .handler(async ({ input }) => {
        return { ok: true as const, result: input.a + input.b };
      }),

    divide: method
      .input(z.object({ a: z.number(), b: z.number() }))
      .handler(async ({ input }) => {
        if (input.b === 0) {
          return new ServiceError('Division by zero', 400);
        }
        return { ok: true as const, result: input.a / input.b };
      })
  })
});

// Use it
const service = mathService({});
const result = await service.add({ a: 5, b: 3 });

// PREFERRED: Check for success first
if (!('ok' in result)) throw result;
console.log(result.result); // 8 - TypeScript knows the type!
```

### 2. Context Usage

Pass dependencies through context (like database, config, etc.):

```typescript
import { PrismaClient } from '@prisma/client';

type AppContext = {
  db: PrismaClient;
  config: {
    apiKey: string;
    baseUrl: string;
  };
};

const userService = defineService<AppContext>()({
  methods: ({ method }) => ({
    getAll: method
      .input(z.object({ limit: z.number().optional() }))
      .handler(async ({ ctx, input }) => {
        const users = await ctx.db.user.findMany({
          take: input.limit ?? 10
        });
        return { ok: true as const, users };
      }),

    create: method
      .input(
        z.object({
          name: z.string(),
          email: z.email()
        })
      )
      .handler(async ({ ctx, input }) => {
        // Check for duplicate email
        const existing = await ctx.db.user.findUnique({
          where: { email: input.email }
        });

        if (existing) {
          return new ServiceError('Email already exists', 409);
        }

        const user = await ctx.db.user.create({ data: input });

        // Use config from context
        console.log(`User created via ${ctx.config.baseUrl}`);

        return { ok: true as const, user };
      }),

    getByEmail: method
      .input(z.object({ email: z.email() }))
      .handler(async ({ ctx, input }) => {
        const user = await ctx.db.user.findUnique({
          where: { email: input.email }
        });

        if (!user) return new NotFoundError();

        return { ok: true as const, user };
      })
  })
});

// Initialize with context
const service = userService({
  db: prisma,
  config: {
    apiKey: process.env.API_KEY,
    baseUrl: 'https://api.example.com'
  }
});

// Use it - full type safety!
const result = await service.getAll({ limit: 5 });

// PREFERRED: Check for success first
if (!('ok' in result)) throw result;
console.log(result.users); // ✨ TypeScript knows users is User[]
```

### 3. Service Dependencies (Composition)

Services can depend on other services using the `deps` pattern:

```typescript
// First service: Workspace settings
const workspaceService = defineService<{ db: PrismaClient }>()({
  methods: ({ method }) => ({
    getWorkspace: method.input(z.object({})).handler(async ({ ctx }) => {
      const workspace = await ctx.db.workspace.findFirst();
      if (!workspace) return new NotFoundError('No workspace configured');
      return { ok: true as const, workspace };
    }),

    getSettings: method.input(z.object({})).handler(async ({ ctx }) => {
      const settings = await ctx.db.settings.findFirst();
      return {
        ok: true as const,
        settings: settings || { theme: 'light', timezone: 'UTC' }
      };
    })
  })
});

// Second service: Calendar (depends on workspace)
const calendarService = defineService<{ db: PrismaClient }>()({
  // ✨ Declare dependencies - initialized once per service instance
  deps: (ctx) => ({
    workspace: workspaceService(ctx)
  }),

  methods: ({ method }) => ({
    getTrainerCalendar: method
      .input(
        z.object({
          trainerId: z.string(),
          date: z.date().optional()
        })
      )
      .handler(async ({ ctx, deps, input }) => {
        const { trainerId, date = new Date() } = input;

        // Fetch trainer
        const trainer = await ctx.db.trainer.findUnique({
          where: { id: trainerId }
        });

        if (!trainer) return new NotFoundError('Trainer not found');

        // ✨ Use dependency service with full type safety
        const workspaceResult = await deps.workspace.getWorkspace({});
        if (workspaceResult instanceof Error) return workspaceResult;

        // Calculate time range using workspace settings
        const startTime = new Date(date);
        startTime.setHours(workspaceResult.workspace.startOfDay);

        const endTime = new Date(date);
        endTime.setHours(workspaceResult.workspace.endOfDay);

        const events = await fetchCalendarEvents(
          trainer.email,
          startTime,
          endTime
        );

        return {
          ok: true as const,
          trainer,
          events,
          workspaceHours: {
            start: workspaceResult.workspace.startOfDay,
            end: workspaceResult.workspace.endOfDay
          }
        };
      })
  })
});

// Use the calendar service
const service = calendarService({ db: prisma });
const result = await service.getTrainerCalendar({ trainerId: '123' });

// PREFERRED: Check for success first
if ('ok' in result) {
  // ✨ Full type inference - no assertions needed!
  console.log('Trainer:', result.trainer.name);
  console.log('Events:', result.events.length);
  console.log(
    'Hours:',
    result.workspaceHours.start,
    '-',
    result.workspaceHours.end
  );
} else {
  // Handle errors
  console.error('Error:', result.message, result.statusCode);
}
```

### 4. Multiple Service Dependencies

```typescript
const userService = defineService<{ db: PrismaClient }>()({
  methods: ({ method }) => ({
    getById: method
      .input(z.object({ id: z.string() }))
      .handler(async ({ ctx, input }) => {
        const user = await ctx.db.user.findUnique({ where: { id: input.id } });
        if (!user) return new NotFoundError();
        return { ok: true as const, user };
      })
  })
});

const notificationService = defineService<{ db: PrismaClient }>()({
  methods: ({ method }) => ({
    send: method
      .input(z.object({ userId: z.string(), message: z.string() }))
      .handler(async ({ input }) => {
        await sendEmail(input.userId, input.message);
        return { ok: true as const, sent: true };
      })
  })
});

const postService = defineService<{ db: PrismaClient }>()({
  // Depend on multiple services
  deps: (ctx) => ({
    user: userService(ctx),
    notifications: notificationService(ctx)
  }),

  methods: ({ method }) => ({
    create: method
      .input(
        z.object({
          userId: z.string(),
          title: z.string(),
          content: z.string()
        })
      )
      .handler(async ({ ctx, deps, input }) => {
        // Verify user exists using user service
        const userResult = await deps.user.getById({ id: input.userId });
        if (userResult instanceof Error) return userResult;

        // Create post
        const post = await ctx.db.post.create({
          data: {
            title: input.title,
            content: input.content,
            authorId: userResult.user.id
          }
        });

        // Send notification using notification service
        await deps.notifications.send({
          userId: input.userId,
          message: `Your post "${post.title}" was published`
        });

        return { ok: true as const, post };
      })
  })
});
```

## Integration Examples

### With tRPC

```typescript
import { defineService } from '@perimetre/service-builder';
import { router, procedure } from '@/server/trpc';

// Define service
const postsService = defineService<Record<string, unknown>>()({
  methods: ({ method }) => ({
    getAll: method.input(z.object({})).handler(async () => {
      const posts = await fetchPosts();
      return { ok: true as const, posts };
    }),

    getById: method
      .input(z.object({ id: z.number() }))
      .handler(async ({ input }) => {
        const post = await fetchPost(input.id);
        if (!post) return new NotFoundError();
        return { ok: true as const, post };
      })
  })
});

// Use in tRPC router - notice NO type assertions needed!
export const postsRouter = router({
  getAll: procedure.query(async () => {
    const result = await postsService({}).getAll({});
    // PREFERRED: Check for success discriminator
    if (!('ok' in result)) throw result;
    return result.posts; // ✨ TypeScript knows the type!
  }),

  getById: procedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const result = await postsService({}).getById({ id: input.id });
      // PREFERRED: Check for success first
      if (!('ok' in result)) throw result;
      return result.post; // ✨ Perfect inference!
    })
});
```

### With Next.js Server Actions

```typescript
'use server';

import { defineService } from '@perimetre/service-builder';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const userService = defineService<{ db: PrismaClient }>()({
  methods: ({ method }) => ({
    create: method
      .input(z.object({ name: z.string(), email: z.email() }))
      .handler(async ({ ctx, input }) => {
        const user = await ctx.db.user.create({ data: input });
        return { ok: true as const, user };
      })
  })
});

export async function createUserAction(formData: FormData) {
  const result = await userService({ db: prisma }).create({
    name: formData.get('name') as string,
    email: formData.get('email') as string
  });

  // PREFERRED: Check for success first
  if ('ok' in result) {
    return { user: result.user };
  }

  // Handle errors - use instanceof to distinguish error types
  if (result instanceof ServiceError) {
    return { error: result.message, statusCode: result.statusCode };
  }

  return { error: 'An unexpected error occurred' };
}
```

### With Express

```typescript
import express from 'express';
import { defineService } from '@perimetre/service-builder';

const app = express();

app.get('/users/:id', async (req, res) => {
  const result = await userService({ db: prisma }).getById({
    id: req.params.id
  });

  // PREFERRED: Check for success first
  if ('ok' in result) {
    return res.json(result.user);
  }

  // Handle errors - use instanceof for error type checking
  if (result instanceof ServiceError) {
    return res.status(result.statusCode).json({
      error: result.name,
      message: result.message
    });
  }

  return res.status(500).json({ error: 'Internal server error' });
});
```

## Error Handling Patterns

### 1. Basic Error Checking

```typescript
const result = await service.getById({ id: '123' });

// PREFERRED Pattern: 'ok' discriminator (check success first)
if ('ok' in result) {
  console.log('User:', result.user);
} else {
  // Use instanceof to distinguish between error types
  if (result instanceof NotFoundError) {
    console.error('Not found');
  } else {
    console.error('Error:', result.message);
  }
}

// Alternative (early return pattern - recommended)
if (!('ok' in result)) {
  // Handle error
  if (result instanceof NotFoundError) {
    console.error('Not found');
  } else {
    console.error('Error:', result.message);
  }
  return;
}
// Now result is guaranteed to be success type
console.log('User:', result.user);
```

**Pattern Priority:**

1. Use `'ok' in result` for success/error checks (primary)
2. Use `instanceof` only when distinguishing error types (secondary)

### 2. Error Propagation

When composing services, propagate errors up the chain:

```typescript
const postService = defineService<{ db: PrismaClient }>()({
  deps: (ctx) => ({
    user: userService(ctx)
  }),

  methods: ({ method }) => ({
    create: method
      .input(z.object({ userId: z.string(), title: z.string() }))
      .handler(async ({ ctx, deps, input }) => {
        // Check user exists
        const userResult = await deps.user.getById({ id: input.userId });

        // PREFERRED: Propagate error early if user service failed
        if (!('ok' in userResult)) return userResult;

        // User exists, create post
        const post = await ctx.db.post.create({
          data: {
            title: input.title,
            authorId: userResult.user.id
          }
        });

        return { ok: true as const, post };
      })
  })
});
```

### 3. Throwing Errors (for tRPC/API routes)

```typescript
// In tRPC router
const postsRouter = router({
  getById: procedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const result = await postsService({}).getById({ id: input.id });

      // PREFERRED: Check for success discriminator
      if (!('ok' in result)) throw result;

      // Return success data
      return result.post; // ✨ Type is inferred perfectly!
    })
});
```

## Advanced Examples

### Complex Input Validation

```typescript
const orderService = defineService<{ db: PrismaClient }>()({
  methods: ({ method }) => ({
    create: method
      .input(
        z.object({
          customer: z.object({
            name: z.string(),
            email: z.email(),
            address: z.object({
              street: z.string(),
              city: z.string(),
              zipCode: z.string()
            })
          }),
          items: z.array(
            z.object({
              productId: z.string(),
              quantity: z.number().positive()
            })
          ),
          metadata: z.record(z.string(), z.unknown()).optional()
        })
      )
      .handler(async ({ ctx, input }) => {
        // Input is fully typed from Zod schema
        const order = await ctx.db.order.create({
          data: {
            customerName: input.customer.name,
            customerEmail: input.customer.email,
            shippingAddress: input.customer.address,
            items: {
              create: input.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity
              }))
            }
          }
        });

        return { ok: true as const, order };
      })
  })
});
```

### Async Context Initialization

```typescript
const userService = defineService<{
  db: PrismaClient;
  cache: Redis;
}>()({
  methods: ({ method }) => ({
    getById: method
      .input(z.object({ id: z.string() }))
      .handler(async ({ ctx, input }) => {
        // Try cache first
        const cached = await ctx.cache.get(`user:${input.id}`);
        if (cached) {
          return {
            ok: true as const,
            user: JSON.parse(cached),
            fromCache: true
          };
        }

        // Fetch from database
        const user = await ctx.db.user.findUnique({ where: { id: input.id } });
        if (!user) return new NotFoundError();

        // Cache for next time
        await ctx.cache.set(
          `user:${input.id}`,
          JSON.stringify(user),
          'EX',
          300
        );

        return { ok: true as const, user, fromCache: false };
      })
  })
});

// Context can be initialized asynchronously
const db = await connectToDatabase();
const cache = await connectToRedis();
const service = userService({ db, cache });
```

### Real-World Example: Multi-Service Composition

```typescript
// Payment service
const paymentService = defineService<{ stripe: Stripe }>()({
  methods: ({ method }) => ({
    charge: method
      .input(
        z.object({
          amount: z.number().positive(),
          currency: z.string(),
          customerId: z.string()
        })
      )
      .handler(async ({ ctx, input }) => {
        try {
          const charge = await ctx.stripe.charges.create({
            amount: input.amount,
            currency: input.currency,
            customer: input.customerId
          });
          return { ok: true as const, charge };
        } catch (error) {
          return new ServiceError('Payment failed', 402);
        }
      })
  })
});

// Email service
const emailService = defineService<{ emailClient: EmailClient }>()({
  methods: ({ method }) => ({
    sendOrderConfirmation: method
      .input(
        z.object({
          to: z.email(),
          orderDetails: z.object({
            orderId: z.string(),
            total: z.number()
          })
        })
      )
      .handler(async ({ ctx, input }) => {
        await ctx.emailClient.send({
          to: input.to,
          subject: 'Order Confirmation',
          body: `Your order #${input.orderDetails.orderId} for $${input.orderDetails.total} was confirmed`
        });
        return { ok: true as const, sent: true };
      })
  })
});

// Order service (depends on both payment and email)
const orderService = defineService<{
  db: PrismaClient;
  stripe: Stripe;
  emailClient: EmailClient;
}>()({
  deps: (ctx) => ({
    payments: paymentService({ stripe: ctx.stripe }),
    emails: emailService({ emailClient: ctx.emailClient })
  }),

  methods: ({ method }) => ({
    createOrder: method
      .input(
        z.object({
          customerId: z.string(),
          items: z.array(
            z.object({
              productId: z.string(),
              quantity: z.number()
            })
          ),
          paymentMethodId: z.string()
        })
      )
      .handler(async ({ ctx, deps, input }) => {
        // Calculate total
        const products = await ctx.db.product.findMany({
          where: { id: { in: input.items.map((i) => i.productId) } }
        });

        const total = input.items.reduce((sum, item) => {
          const product = products.find((p) => p.id === item.productId);
          return sum + (product?.price ?? 0) * item.quantity;
        }, 0);

        // Charge payment
        const paymentResult = await deps.payments.charge({
          amount: total,
          currency: 'usd',
          customerId: input.customerId
        });

        if (paymentResult instanceof Error) return paymentResult;

        // Create order
        const order = await ctx.db.order.create({
          data: {
            customerId: input.customerId,
            total,
            chargeId: paymentResult.charge.id,
            items: {
              create: input.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity
              }))
            }
          }
        });

        // Send confirmation email
        const customer = await ctx.db.customer.findUnique({
          where: { id: input.customerId }
        });

        if (customer) {
          await deps.emails.sendOrderConfirmation({
            to: customer.email,
            orderDetails: {
              orderId: order.id,
              total: order.total
            }
          });
        }

        return { ok: true as const, order };
      })
  })
});
```

## Custom Error Classes

Define domain-specific errors for better error handling:

```typescript
class ValidationError extends ServiceError {
  constructor(public fields: Record<string, string[]>) {
    super('Validation failed', 400);
    this.name = 'ValidationError';
  }
}

class UnauthorizedError extends ServiceError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

class PaymentError extends ServiceError {
  constructor(
    public code: 'CARD_DECLINED' | 'INSUFFICIENT_FUNDS',
    message?: string
  ) {
    super(message || code, 402);
    this.name = 'PaymentError';
  }
}

// Use in handlers
const result = await paymentService().charge(data);

if (result instanceof PaymentError) {
  if (result.code === 'CARD_DECLINED') {
    // Handle card declined
  } else if (result.code === 'INSUFFICIENT_FUNDS') {
    // Handle insufficient funds
  }
}
```

## TypeScript Tips

### Type Inference

The library uses the same type inference pattern as tRPC - types are automatically inferred from your handler's return value:

```typescript
// No type annotations needed!
const service = defineService<{ db: Database }>()({
  methods: ({ method }) => ({
    getUser: method
      .input(z.object({ id: z.string() }))
      .handler(async ({ ctx, input }) => {
        const user = await ctx.db.user.findById(input.id);
        // TypeScript infers the return type automatically
        return { ok: true as const, user, metadata: { cached: false } };
      })
  })
});

// When you call it:
const result = await service({ db }).getUser({ id: '123' });

// PREFERRED: Check for success first
if (!('ok' in result)) throw result;

// TypeScript knows ALL these properties exist:
result.user; // ✓
result.metadata; // ✓
result.ok; // ✓
```

### Early Returns for Clean Code

```typescript
handler: async ({ ctx, deps, input }) => {
  // ✅ Clean, flat structure with early returns using 'ok' checks
  const userResult = await deps.user.getById({ id: input.userId });
  if (!('ok' in userResult)) return userResult;

  const settingsResult = await deps.settings.get({});
  if (!('ok' in settingsResult)) return settingsResult;

  const paymentResult = await deps.payments.charge(input.amount);
  if (!('ok' in paymentResult)) return paymentResult;

  // All checks passed, create order
  return {
    ok: true as const,
    order: await ctx.db.order.create({
      userId: userResult.user.id,
      settings: settingsResult.settings,
      chargeId: paymentResult.charge.id
    })
  };
};
```

## Best Practices

### ✅ DO

- Use `ok: true as const` **ONLY** for successful results
- Return Error instances for failures (never `ok: false`)
- Return errors instead of throwing them
- **Use `'ok' in result` for success/error checks (primary pattern)** ✨
- Use `instanceof` only when distinguishing error types (secondary)
- Create domain-specific error classes
- Use the `deps` pattern for service composition
- Validate all inputs with Zod schemas
- Use early returns with `!('ok' in result)` to avoid nesting

### ❌ DON'T

- **Return `ok: false` or include `ok` in error results** - CRITICAL ❌
- Return objects with `ok` property for failures
- Throw errors inside handlers (return them instead)
- Use `ok: true` without `as const`
- Use `instanceof Error` for simple success checks (use `'ok' in result` instead)
- Mix throwing and returning error patterns
- Skip input validation
- Create circular service dependencies
- Use `any` types (let TypeScript infer)

### Error Checking Pattern Priority

1. **Primary**: `'ok' in result` - for success/error discrimination
2. **Secondary**: `instanceof SpecificError` - when distinguishing between error types
3. **Necessary**: `instanceof Error` - in catch blocks for unknown errors

## API Reference

### `defineService<TContext>()(definition)`

Create a type-safe service with the given context.

**Generic Parameters:**

- `TContext` - The context type (e.g., `{ db: PrismaClient }`)

**Definition:**

```typescript
{
  deps?: (ctx: TContext) => TDeps | Promise<TDeps>;
  methods: (helpers: { method: MethodBuilder<TContext, TDeps> }) => TMethods;
}
```

**Returns:**

- `(ctx: TContext) => Service` - A function that creates a service instance

### Method Builder

```typescript
method.input(zodSchema).handler(async ({ ctx, deps, input }) => {
  // Return { ok: true, ...data } for success
  // Return Error instance for failure
});
```

**Handler Arguments:**

- `ctx: TContext` - The service context (db, config, etc.)
- `deps: TDeps` - Initialized dependencies from deps function
- `input: TInput` - Validated input (typed from Zod schema)

**Handler Return:**

- Success: `{ ok: true as const, ...yourData }`
- Error: Any `Error` instance (e.g., `new NotFoundError()`)

### ServiceError

Base class for custom service errors with HTTP status codes.

```typescript
class ServiceError extends Error {
  constructor(message: string, statusCode: number = 500);

  readonly statusCode: number;
  name: string;
  message: string;
}
```

## Testing

Run the comprehensive test suite:

```bash
pnpm test        # Run 10 Bun tests
pnpm build       # Run tests + typecheck
pnpm lint        # Lint the code
pnpm typecheck   # TypeScript type checking
```

## Why service-builder?

### vs. tRPC

| Feature          | tRPC                | service-builder |
| ---------------- | ------------------- | --------------- |
| Use case         | API endpoints       | Business logic  |
| Type inference   | ✅ Perfect          | ✅ Perfect      |
| Input validation | ✅ Zod              | ✅ Zod          |
| HTTP integration | Built-in            | Manual          |
| Dependencies     | Context per request | Deps pattern    |
| Error handling   | Throws errors       | Returns errors  |
| Bundle size      | ~50kb               | ~2kb            |

**Use tRPC for:** Building type-safe API endpoints with automatic client generation

**Use service-builder for:** Organizing business logic with explicit error handling

### vs. Plain Functions

**Plain functions:**

```typescript
export async function getUser(id: string, db: Database) {
  const user = await db.user.findById(id);
  // No validation, manual error handling, dependencies passed everywhere
  if (!user) throw new Error('Not found');
  return user;
}
```

**service-builder:**

```typescript
const userService = defineService<{ db: Database }>()({
  methods: ({ method }) => ({
    getUser: method
      .input(z.object({ id: z.string() })) // ✅ Automatic validation
      .handler(async ({ ctx, input }) => {
        // ✅ Context injected
        const user = await ctx.db.user.findById(input.id);
        if (!user) return new NotFoundError(); // ✅ Explicit error
        return { ok: true as const, user }; // ✅ Type-safe result
      })
  })
});
```

## Contributing

This package is part of the Perimetre framework monorepo. See the main repository for contributing guidelines.
