# TypeScript Error Handling: Go/Rust-Like Patterns

A comprehensive guide to implementing type-safe, functional error handling in TypeScript without heavy reliance on try-catch blocks.

## Core Philosophy

Instead of throwing exceptions and using try-catch blocks, return errors as values. This approach:

- **Shows errors in return types** - Explicit in function signatures
- **Forces error handling** - Type system ensures you check for errors
- **Enables type narrowing** - TypeScript infers success/error states
- **No dependencies required** - Pure TypeScript solution

## Pattern 1: Custom Error Classes

Create domain-specific errors with consistent structure:

```typescript
// Base error with HTTP status code
export class NotFoundError extends Error {
  message = 'Not found';
  name = 'NotFound';
  statusCode = 404 as const;
}

export class UnauthorizedError extends Error {
  message = 'Unauthorized';
  name = 'Unauthorized';
  statusCode = 401 as const;
}

// Error with custom message parameter
export class ForbiddenError extends Error {
  statusCode = 403 as const;

  constructor(public message: string = 'Forbidden') {
    super(message);
    this.name = 'Forbidden';
  }
}

// Generic error with type-safe context
export class ValidationError<T> extends Error {
  constructor(public errors: ErrorTree<T>) {
    super('Validation Error');
    this.name = 'ValidationError';
  }
}
```

**Key Points:**

- Include `statusCode` for HTTP responses
- Set `name` property for error identification
- Use `as const` for literal type inference
- Support generics for type-safe error details
- Let TypeScript infer return types from error classes returned

## Pattern 2: Returning Errors Instead of Throwing

### Approach A: Discriminated Union with `ok` Flag

The most explicit pattern - success always has `ok: true`, errors are instances:

```typescript
export const getWorkspace = async () => {
  const payload = await getPayload();

  const result = await payload.find({
    collection: 'workspace',
    limit: 1
  });

  if (!result?.docs.length) {
    return new NotFoundError(); // Return error instance
  }

  return {
    ok: true as const, // Discriminator
    workspace: result.docs[0]
  };
};

// Usage
const result = await getWorkspace();

if ('ok' in result) {
  // TypeScript knows result has 'workspace' property
  console.log(result.workspace.name);
} else {
  // TypeScript knows result is NotFoundError
  console.error(result.message);
}
```

### Approach B: Checking External API Errors

Handle external API errors and return custom error classes:

```typescript
export const getRouteInfo = async (origin: Position, destination: Position) => {
  const response = await fetch(
    'https://routes.googleapis.com/directions/v2:computeRoutes',
    {
      method: 'POST',
      body: JSON.stringify({ origin, destination })
    }
  );

  if (!response.ok) return new UnexpectedFetchError();

  const data = await response.json();

  // Check if external API returned an error
  if ('error' in data) return new UnexpectedFetchError();

  // TypeScript infers success shape
  return {
    ok: true as const,
    duration: data.routes[0].duration,
    distance: data.routes[0].distance
  };
};
```

### Approach C: Multiple Error Types

Functions can return different error classes - types are inferred:

```typescript
export const getEmailHtml = async (templateName: string, data: EmailData) => {
  const template = await import(`./templates/${templateName}.ejs`);
  const rendered = await ejs.render(template.default, data);
  const htmlOutput = mjml2html(rendered);

  if (htmlOutput.errors.length > 0) {
    return new EmailError(
      htmlOutput.errors.map((err) => err.formattedMessage).join('\n')
    );
  }

  return { ok: true as const, html: htmlOutput.html };
};

// TypeScript infers: EmailError | { ok: true; html: string }
const result = await getEmailHtml('booking', data);

if (result instanceof EmailError) {
  console.error(result.message);
} else if ('ok' in result) {
  console.log(result.html);
}
```

## Pattern 3: Type Guards for Error Checking

### Using `instanceof`

TypeScript infers error types from instanceof checks:

```typescript
const result = await loginAction(credentials);

if (result instanceof ValidationError) {
  displayValidationErrors(result.errors); // TypeScript infers 'errors' property
} else if (result instanceof ForbiddenError) {
  console.error(result.message); // TypeScript infers 'message' and 'statusCode'
} else {
  redirect('/dashboard'); // TypeScript knows this is success case
}
```

### Using `in` Operator

TypeScript infers discriminated union types:

```typescript
const tokenResult = await getAccessToken();

if ('ok' in tokenResult) {
  const token = tokenResult.accessToken; // Inferred from success branch
} else {
  return tokenResult; // Inferred as error type
}
```

### Combining Multiple Checks

For complex error scenarios:

```typescript
// Check if any operation failed
if ('error' in sessionResult) {
  throw new Error(`Session failed: ${sessionResult.error}`);
}
if ('error' in travelResult) {
  throw new Error(`Travel failed: ${travelResult.error}`);
}

// All succeeded - TypeScript knows all have 'event' property
if ('event' in sessionResult && 'event' in travelResult) {
  const booking = createBooking(sessionResult.event.id, travelResult.event.id);
}
```

## Pattern 4: Type Narrowing and Assertions

### Type Guards with Filtering

```typescript
const calendarError = trainerCalendars.find(
  ({ calendar }) => !('ok' in calendar) // Not a success result
);

if (calendarError) {
  return calendarError.calendar; // Return the error
}

// Now all calendars are guaranteed to be success results
trainerCalendars.forEach(({ trainer, calendar }) => {
  // TypeScript knows calendar has 'ok' and 'events' properties
  const events = calendar.events.filter((x) => x.showAs === 'busy');
});
```

### Type Assertions After Type Guards

```typescript
const trainer =
  typeof booking.trainer === 'number'
    ? await payload.findByID({ collection: 'trainers', id: booking.trainer })
    : booking.trainer;

if (trainer) {
  const eventIds = [booking.calendarEventId, booking.travelToEventId].filter(
    Boolean
  );

  eventIds.forEach((eventId) => {
    if (eventId) {
      // Safe to assert after type guards
      processEvent(eventId, trainer as Trainer);
    }
  });
}
```

### Unknown Error Narrowing

Always type catch blocks as `unknown`:

```typescript
try {
  const client = await payload.create({ collection: 'clients', data });
  return client;
} catch (error: unknown) {
  // Narrow to Error type
  if (error instanceof Error) {
    throw new Error(`Error creating client: ${error.message}`);
  }
  throw new Error('Unknown error occurred');
}
```

## Pattern 5: Server Actions and Client Components

### Server Action Pattern

```typescript
export async function createClientAction(data: ClientFormData) {
  const validatedFields = clientSchema.safeParse(data);

  if (!validatedFields.success) {
    return new ValidationError(validatedFields.error);
  }

  try {
    const client = await createClient(validatedFields.data);
    return {
      ok: true as const,
      client
    };
  } catch (error) {
    if (error instanceof Error) {
      return new ForbiddenError(error.message);
    }
    return new ForbiddenError('Unknown error occurred');
  }
}
```

### Client Component Error Handling

```typescript
'use client';

const onSubmit = handleSubmit(async (data) => {
  clearErrors('root.form');

  try {
    const result = await loginAction(data);

    if ('ok' in result) {
      // Success - redirect
      router.push('/dashboard');
    } else {
      // Error handling
      if (result instanceof ValidationError) {
        // Apply field-level errors
        applyZodErrorsToForm(result.errors, setError);
      } else {
        // Form-level error
        setError('root.form', {
          type: 'manual',
          message: result.message
        });
      }
    }
  } catch {
    // Fallback for unexpected errors
    setError('root.form', {
      type: 'manual',
      message: 'An unexpected error occurred'
    });
  }
});
```

## Pattern 6: Graceful Error Aggregation

Use `Promise.allSettled()` when you want to continue despite partial failures:

```typescript
const deletionPromises = eventIds.map(async ({ eventId, trainer }) => {
  try {
    const result = await deleteCalendarEvent({
      user: {
        email: trainer.email,
        calendarId: trainer.office365CalendarId || ''
      },
      eventId
    });

    if ('error' in result) {
      console.warn(`Failed to delete event ${eventId}: ${result.error}`);
      return { ok: false as const, eventId, error: result.error };
    }

    return { ok: true as const, eventId };
  } catch (error) {
    console.warn(`Error deleting event ${eventId}:`, error);
    return { ok: false as const, eventId, error };
  }
});

const results = await Promise.allSettled(deletionPromises);

// Process all results
const failures = results
  .filter((result) => result.status === 'rejected' || !result.value?.ok)
  .map((result) =>
    result.status === 'rejected'
      ? { error: result.reason }
      : { error: result.value?.error }
  );

if (failures.length > 0) {
  console.error(`${failures.length} deletions failed`, failures);
}
```

## Pattern 7: Form Validation Error Mapping

Utility to convert Zod errors to React Hook Form format:

```typescript
/**
 * Converts Zod error tree into React Hook Form setError calls
 */
export function applyZodErrorsToForm<TFormData extends Record<string, unknown>>(
  errorTree: $ZodErrorTree<TFormData>,
  setError: UseFormSetError<TFormData>
): void {
  if (!errorTree.properties) return;

  Object.entries(errorTree.properties).forEach(([fieldName, fieldError]) => {
    if (!fieldError) return;

    fieldError.errors.forEach((errorMessage) => {
      setError(fieldName as Path<TFormData>, {
        type: 'manual',
        message: errorMessage
      });
    });
  });
}
```

## Pattern 8: Error Codes for Identification and Translation

Add error codes to enable frontend translation and better error tracking:

```typescript
// Error with code for identification
export class PaymentError extends Error {
  name = 'PaymentError';
  statusCode = 402 as const;

  constructor(
    public code: 'INSUFFICIENT_FUNDS' | 'CARD_DECLINED' | 'PROCESSING_ERROR',
    message?: string
  ) {
    super(message || code);
  }
}

export class ResourceError extends Error {
  name = 'ResourceError';
  statusCode = 409 as const;

  constructor(
    public code: 'ALREADY_EXISTS' | 'IN_USE' | 'CONFLICT',
    public resource: string,
    message?: string
  ) {
    super(message || `${resource}: ${code}`);
  }
}
```

### Frontend Translation

```typescript
const errorMessages = {
  en: {
    INSUFFICIENT_FUNDS: 'Your account has insufficient funds',
    CARD_DECLINED: 'Your card was declined'
  },
  fr: {
    INSUFFICIENT_FUNDS: 'Votre compte a des fonds insuffisants',
    CARD_DECLINED: 'Votre carte a été refusée'
  }
} as const;

export function CheckoutForm() {
  const locale = useLocale();

  const onSubmit = async (data: CheckoutData) => {
    const result = await processPayment(data);

    if (result instanceof PaymentError) {
      setError(errorMessages[locale][result.code]);
      return;
    }

    if ('ok' in result) router.push('/confirmation');
  };
}
```

### Structured Logging

```typescript
export const processPayment = async (data: PaymentData) => {
  const result = await stripe.charge(data);

  if (result.status === 'failed') {
    const error = new PaymentError('CARD_DECLINED', result.decline_reason);

    logger.error('Payment failed', {
      code: error.code,
      statusCode: error.statusCode,
      userId: data.userId
    });

    return error;
  }

  return { ok: true as const, transactionId: result.id };
};
```

## Pattern 9: API Response Conversion

Convert errors to HTTP responses in API routes:

```typescript
// Utility to convert errors to HTTP responses
export function errorToResponse(error: Error): Response {
  // Check for custom errors with statusCode
  if ('statusCode' in error && typeof error.statusCode === 'number') {
    return Response.json(
      {
        error: error.name,
        message: error.message,
        // Include code if available
        ...('code' in error && { code: error.code })
      },
      { status: error.statusCode }
    );
  }

  // Fallback for unknown errors
  return Response.json(
    {
      error: 'InternalServerError',
      message: 'An unexpected error occurred'
    },
    { status: 500 }
  );
}

// Usage in API route
export async function POST(request: Request) {
  const body = await request.json();
  const result = await createUser(body);

  if (result instanceof ValidationError) {
    return Response.json(
      { error: 'ValidationError', details: result.errors },
      { status: result.statusCode }
    );
  }

  if (result instanceof DatabaseError || result instanceof ForbiddenError) {
    return errorToResponse(result);
  }

  if ('ok' in result) {
    return Response.json(result.user, { status: 201 });
  }
}
```

### Next.js API Route

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return Response.json({ error: 'Missing user ID' }, { status: 400 });
  }

  const result = await getUser(id);

  if (result instanceof NotFoundError || result instanceof UnauthorizedError) {
    return Response.json(
      { error: result.name, message: result.message },
      { status: result.statusCode }
    );
  }

  if ('ok' in result) return Response.json(result.user);

  return errorToResponse(result as Error);
}
```

## Pattern 10: Chaining Operations with Early Returns

Use early returns to avoid deep nesting:

```typescript
// ❌ Deep nesting (hard to read)
export async function createBooking(data: BookingData) {
  const userResult = await getUser(data.userId);
  if ('ok' in userResult) {
    const slotResult = await checkAvailability(data.slot);
    if ('ok' in slotResult) {
      const paymentResult = await processPayment(data.payment);
      if ('ok' in paymentResult) {
        return createBookingRecord({
          user: userResult.user,
          slot: slotResult.slot,
          payment: paymentResult.transactionId
        });
      }
      return paymentResult;
    }
    return slotResult;
  }
  return userResult;
}

// ✅ Early returns (flat structure)
export async function createBooking(data: BookingData) {
  const userResult = await getUser(data.userId);
  if (!('ok' in userResult)) return userResult;

  const slotResult = await checkAvailability(data.slot);
  if (!('ok' in slotResult)) return slotResult;

  const paymentResult = await processPayment(data.payment);
  if (!('ok' in paymentResult)) return paymentResult;

  return createBookingRecord({
    user: userResult.user,
    slot: slotResult.slot,
    payment: paymentResult.transactionId
  });
}
```

## Pattern 11: Error Recovery with Fallbacks

### Default Values

```typescript
export async function getUserPreferences(userId: string) {
  const result = await fetchPreferences(userId);

  if (result instanceof NotFoundError) {
    return {
      ok: true as const,
      preferences: { theme: 'light', language: 'en', notifications: true }
    };
  }

  return result;
}
```

### Retry Logic

```typescript
export async function fetchWithRetry<T>(
  fn: () => Promise<T | Error>,
  maxRetries = 3
): Promise<T | Error> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await fn();

    if (!(result instanceof Error)) return result;

    // Don't retry on client errors (4xx)
    if (
      'statusCode' in result &&
      result.statusCode >= 400 &&
      result.statusCode < 500
    ) {
      return result;
    }

    if (attempt === maxRetries - 1) return result;

    await new Promise((resolve) =>
      setTimeout(resolve, 1000 * Math.pow(2, attempt))
    );
  }

  return new UnexpectedError('Max retries exceeded');
}
```

### Fallback Chain

```typescript
export async function getUserData(userId: string) {
  const primaryResult = await getPrimaryUserData(userId);
  if ('ok' in primaryResult) return primaryResult;

  const cacheResult = await getCachedUserData(userId);
  if ('ok' in cacheResult) return cacheResult;

  return new NotFoundError(`User ${userId} not found`);
}
```

## Pattern 12: Exhaustive Error Handling with `never`

Use `never` to ensure all error cases are handled at compile-time:

```typescript
// TypeScript infers return type from implementation
export async function createUser(data: unknown) {
  const validation = userSchema.safeParse(data);
  if (!validation.success) return new ValidationError(validation.error);

  try {
    const user = await db.users.create({ data: validation.data });
    return { ok: true as const, user };
  } catch (error: unknown) {
    if (error instanceof Error) return new DatabaseError(error.message);
    return new ForbiddenError('Unknown error');
  }
}

// Inferred type: Promise<ValidationError<unknown> | DatabaseError | ForbiddenError | { ok: true; user: User }>

// Exhaustive error handler
function handleUserCreationError(
  error: ValidationError<unknown> | DatabaseError | ForbiddenError
): string {
  if (error instanceof ValidationError) return 'Check your input';
  if (error instanceof DatabaseError) return 'Database error occurred';
  if (error instanceof ForbiddenError) return error.message;

  // TypeScript error if a case is missing
  const exhaustiveCheck: never = error;
  return exhaustiveCheck;
}

// Usage with inferred types
const result = await createUser(data);

if ('ok' in result) {
  console.log(result.user); // Inferred
} else {
  displayError(handleUserCreationError(result)); // Inferred
}
```

## Best Practices Summary

### DO

- Return errors as values (discriminated unions)
- Use `ok: true as const` for success discriminator
- Let TypeScript infer return types from error classes
- Create domain-specific error classes
- Include metadata in errors (statusCode, context)
- Use `instanceof` for error type checking
- Use `in` operator for discriminated union checking
- Type catch blocks as `unknown` and narrow
- Log errors before returning them
- Use `Promise.allSettled()` for graceful partial failures

### DON'T

- Throw errors in business logic (use try-catch only at boundaries)
- Use `any` type for errors
- Explicitly type return values when TypeScript can infer them
- Create separate error types (e.g., `RouteError`) - use error classes instead
- Forget to handle error cases
- Omit `as const` on discriminators
- Use plain `Error` class (create custom ones)
- Mix throwing and returning error patterns
- Ignore partial failures in batch operations

## Complete Example

```typescript
// 1. Define custom errors
export class DatabaseError extends Error {
  name = 'DatabaseError';
  statusCode = 500 as const;
  constructor(message: string) {
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

// 2. Function returning error as value
export const createUser = async (data: unknown) => {
  const validation = userSchema.safeParse(data);
  if (!validation.success) return new ValidationError(validation.error);

  try {
    const user = await db.users.create({ data: validation.data });
    return { ok: true as const, user };
  } catch (error: unknown) {
    if (error instanceof Error) return new DatabaseError(error.message);
    return new DatabaseError('Unknown database error');
  }
};

// 3. Type-safe error handling
export async function signupAction(formData: FormData) {
  const result = await createUser(Object.fromEntries(formData));

  if (result instanceof ValidationError) return { errors: result.errors };
  if (result instanceof DatabaseError) return { error: result.message };
  if ('ok' in result) redirect(`/users/${result.user.id}`);
}
```

## Integration with React Server Components

```typescript
export default async function UserPage({
  params
}: {
  params: { id: string };
}) {
  const result = await getUser(params.id);

  // Handle error states
  if (result instanceof NotFoundError) {
    notFound(); // Next.js notFound()
  }

  if (result instanceof UnauthorizedError) {
    redirect('/login'); // Next.js redirect()
  }

  if (!('ok' in result)) {
    throw result; // Let error boundary handle it
  }

  // Success case
  return <UserProfile user={result.user} />;
}
```

---

This pattern provides **Go/Rust-like error handling** in TypeScript:

- Explicit in function signatures
- Type-safe with no runtime dependencies
- Forces developers to handle errors
- Leverages TypeScript's type system for safety
