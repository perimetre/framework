---
description: Production-validated code review with dynamic pattern fetching and multi-perspective analysis
argument-hint: [FILES=<paths>] [PR_NUMBER=<number>]
---

# Perimetre Framework Code Review

Comprehensive code review enforcing production patterns from **141 reviews** across **56 PRs**.

---

## MANDATORY: Execute Commands First

### Step 1: Discover Available Documentation

**EXECUTE THIS COMMAND - DO NOT SKIP:**

```bash
gh api repos/perimetre/framework/contents/LLMs --jq '.[].name'
```

**Expected output:** `error-handling-exception.md`, `services.md`, `react-hook-form.md`, `icons.md`, `image-component.md`, `graphql.md`, `tanstack-query.md`, `trpc.md`

**STOP AND WAIT** - You MUST see this list before proceeding.

---

### Step 2: Examine Code Changes

**EXECUTE THESE COMMANDS:**

```bash
git status               # Changed files
git diff                 # Actual changes
git log --oneline -5     # Recent context
```

**Analyze the git diff** and determine which patterns apply:

| Changes Involve                      | Fetch These Docs                                        |
| ------------------------------------ | ------------------------------------------------------- |
| Services, API routes, business logic | `services.md`, `error-handling-exception.md`            |
| Forms, validation, user input        | `react-hook-form.md`, `error-handling-exception.md`     |
| Icons, SVG components                | `icons.md`                                              |
| Images, Next.js Image                | `image-component.md`                                    |
| GraphQL queries/mutations            | `graphql.md`, `tanstack-query.md`                       |
| TanStack Query (non-GraphQL)         | `tanstack-query.md`, `error-handling-exception.md`      |
| tRPC routers/procedures              | `trpc.md`, `services.md`, `error-handling-exception.md` |
| Error handling, try-catch            | `error-handling-exception.md`                           |

---

### Step 3: Fetch Documentation

#### Always Fetch PATTERNS.md First (981 lines)

**EXECUTE:**

```bash
curl -sL "https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/.claude/skills/code-review/PATTERNS.md"
```

**READ ENTIRE OUTPUT** - Complete pattern reference with examples.

#### Fetch Specific Pattern Docs

**EXECUTE BASED ON STEP 2 ANALYSIS:**

```bash
# For services/API changes
curl -sL "https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/services.md"
curl -sL "https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/error-handling-exception.md"

# For form changes
curl -sL "https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/react-hook-form.md"

# For icon changes
curl -sL "https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/icons.md"

# For image changes
curl -sL "https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/image-component.md"

# For GraphQL changes
curl -sL "https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/graphql.md"
curl -sL "https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/tanstack-query.md"

# For tRPC changes
curl -sL "https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/trpc.md"
```

**DO NOT PROCEED** until you have fetched and read all relevant docs.

---

## Critical Patterns to Verify

Use the fetched documentation to check these patterns:

### 1. Error-as-Values Pattern (⚠️ HIGHEST PRIORITY)

**Source:** `error-handling-exception.md` (fetch this for ANY service/API changes)

#### The Iron Rule

- ✅ **Success:** `{ ok: true as const, ...data }`
- ✅ **Failure:** Error instance (`new NotFoundError()`)
- ❌ **NEVER:** `{ ok: false, ... }`

#### Implementation

```typescript
// ✅ CORRECT - Custom error classes
export class NotFoundError extends Error {
  name = 'NotFoundError';
  statusCode = 404 as const;
  constructor(message = 'Not found') {
    super(message);
  }
}

export class ValidationError<T> extends Error {
  name = 'ValidationError';
  statusCode = 400 as const;
  constructor(public errors: ErrorTree<T>) {
    super('Validation Error');
  }
}

export class UnauthorizedError extends Error {
  name = 'UnauthorizedError';
  statusCode = 401 as const;
  constructor(message = 'Unauthorized') {
    super(message);
  }
}

// ✅ CORRECT - Service returns error-as-value
export const getUser = async (id: string) => {
  const user = await db.user.findById(id);

  if (!user) return new NotFoundError(); // ✅ Return Error instance

  return { ok: true as const, user }; // ✅ Success with ok: true
};

// ❌ CRITICAL VIOLATION - Never use ok: false
export const getBadExample = async (id: string) => {
  if (!user) return { ok: false, error: 'Not found' }; // ❌❌❌ NEVER DO THIS
  return { ok: true as const, user };
};
```

#### Usage - PRIMARY Pattern (Preferred)

```typescript
const result = await getUser(id);

// ✅ PREFERRED: Check for 'ok' discriminator
if (!('ok' in result)) {
  // result is Error instance
  throw result; // or handle: return result;
}

// TypeScript narrows: result is { ok: true; user: User }
return result.user;
```

#### Usage - SECONDARY Pattern (Distinguishing errors)

```typescript
const result = await getUser(id);

// ✅ Use instanceof when need to distinguish error types
if (result instanceof NotFoundError) {
  return { error: 'User not found', code: 404 };
}

if (result instanceof UnauthorizedError) {
  return { error: 'Access denied', code: 401 };
}

if ('ok' in result) {
  return result.user;
}

throw result; // Unknown error
```

#### Client Component Error Handling

```typescript
const onSubmit = handleSubmit(async (data) => {
  clearErrors('root.form');

  try {
    const result = await loginAction(data);

    // PREFERRED: Check for success first
    if ('ok' in result) {
      router.push('/dashboard');
      return;
    }

    // Distinguish error types for different handling
    if (result instanceof ValidationError) {
      // Apply field-level errors from Zod
      applyZodErrorsToForm(result.errors, setError);
    } else {
      // Show generic error message
      setError('root.form', {
        type: 'manual',
        message: result.message
      });
    }
  } catch (error: unknown) {
    // Catch unexpected errors
    if (error instanceof Error) {
      setError('root.form', {
        type: 'manual',
        message: error.message
      });
    }
  }
});
```

#### Catch Blocks Must Use `unknown`

```typescript
try {
  await riskyOperation();
} catch (error: unknown) {
  // ✅ ALWAYS type as unknown
  if (error instanceof CustomError) {
    // Handle known custom error
    console.error('Custom error:', error.message);
  } else if (error instanceof Error) {
    // Generic Error
    console.error('Error:', error.message);
  } else {
    // Unknown error type (string, number, etc.)
    throw new Error('Unknown error occurred', { cause: error });
  }
}
```

**FLAG IF YOU SEE:**

- `return { ok: false, ... }` - ❌ **CRITICAL VIOLATION** (most severe)
- Throwing errors in business logic instead of returning - ❌ WRONG
- Type casting errors as `any` - ❌ WRONG
- Catch block not typed as `unknown` - ❌ WRONG
- Using `instanceof Error` as primary success check - ❌ Use `'ok' in result`

---

### 2. Service Layer Architecture (⚠️ CRITICAL)

**Source:** `services.md` (fetch for service/router/API changes)

#### Separation of Concerns

```
Route (tRPC/API)    →    Service Layer    →    Data Sources
• HTTP handling          • Business logic      • Database
• Auth middleware        • Validation          • External APIs
• Error-to-HTTP          • Error-as-values     • File system
```

**What belongs where:**

| Concern           | Route | Service | Why                         |
| ----------------- | ----- | ------- | --------------------------- |
| Business logic    | ❌    | ✅      | Reusability, testing        |
| Database queries  | ❌    | ✅      | Separation of concerns      |
| Validation (Zod)  | ✅    | ✅      | Both layers validate        |
| Error-as-values   | ❌    | ✅      | Services return errors      |
| HTTP status codes | ✅    | ❌      | Routes use error.statusCode |
| Auth middleware   | ✅    | ❌      | HTTP concern                |

#### Service Definition with @perimetre/service-builder

```typescript
// File: src/server/services/posts.ts
import { defineService } from '@perimetre/service-builder';
import { NotFoundError, ValidationError } from '@/shared/exceptions';
import { z } from 'zod';

export const postsService = defineService<{ db: Kysely<Database> }>()({
  methods: ({ method }) => ({
    getById: method
      .input(z.object({ id: z.number().int().positive() }))
      .handler(async ({ ctx, input }) => {
        // ✅ Business logic in service
        const post = await ctx.db
          .selectFrom('posts')
          .selectAll()
          .where('id', '=', input.id)
          .where('deletedAt', 'is', null) // Soft delete check
          .executeTakeFirst();

        if (!post) return new NotFoundError('Post not found');

        return { ok: true as const, post };
      }),

    create: method
      .input(
        z.object({
          title: z.string().min(1).max(200),
          body: z.string().min(1).max(5000),
          userId: z.number().int().positive()
        })
      )
      .handler(async ({ ctx, input }) => {
        // Business rule: Check if user exists
        const userExists = await ctx.db
          .selectFrom('users')
          .select('id')
          .where('id', '=', input.userId)
          .executeTakeFirst();

        if (!userExists) {
          return new ValidationError({
            userId: { _errors: ['User does not exist'] }
          });
        }

        const post = await ctx.db
          .insertInto('posts')
          .values({
            title: input.title,
            body: input.body,
            authorId: input.userId,
            createdAt: new Date()
          })
          .returningAll()
          .executeTakeFirstOrThrow();

        return { ok: true as const, post };
      }),

    update: method
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).max(200),
          body: z.string().min(1).max(5000)
        })
      )
      .handler(async ({ ctx, input }) => {
        const { id, ...updates } = input;

        const updated = await ctx.db
          .updateTable('posts')
          .set({ ...updates, updatedAt: new Date() })
          .where('id', '=', id)
          .where('deletedAt', 'is', null)
          .returningAll()
          .executeTakeFirst();

        if (!updated) return new NotFoundError('Post not found or deleted');

        return { ok: true as const, post: updated };
      })
  })
});
```

#### Route Implementation (Thin Delegation)

```typescript
// File: src/server/routers/posts.ts
import { router, procedure, authedProcedure } from '.';
import { postsService } from '../services/posts';
import { z } from 'zod';

export const postsRouter = router({
  getById: procedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      // ✅ Delegate immediately to service
      const result = await postsService({ db: ctx.db }).getById(input);

      // Convert error-as-value to tRPC error
      if (!('ok' in result)) throw result;

      return result.post;
    }),

  create: authedProcedure
    .input(
      z.object({
        title: z.string(),
        body: z.string()
      })
    )
    .mutation(async ({ input, ctx }) => {
      // ✅ Routes only delegate, no business logic
      const result = await postsService({ db: ctx.db }).create({
        ...input,
        userId: ctx.user.id // Add auth context
      });

      if (!('ok' in result)) throw result;

      return result.post;
    }),

  update: authedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string(),
        body: z.string()
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await postsService({ db: ctx.db }).update(input);
      if (!('ok' in result)) throw result;
      return result.post;
    })
});
```

#### Service Composition (Dependencies)

```typescript
export const postsService = defineService<{ db: Kysely<Database> }>()({
  // ✅ Declare service dependencies
  deps: (ctx) => ({
    users: usersService(ctx),
    notifications: notificationsService(ctx)
  }),

  methods: ({ method }) => ({
    createWithNotification: method
      .input(
        z.object({
          userId: z.number(),
          title: z.string(),
          body: z.string()
        })
      )
      .handler(async ({ ctx, deps, input }) => {
        // ✅ Call dependency service
        const userResult = await deps.users.getById({ id: input.userId });
        if (!('ok' in userResult)) return userResult; // Propagate error

        // Create post
        const post = await ctx.db
          .insertInto('posts')
          .values({
            title: input.title,
            body: input.body,
            authorId: userResult.user.id
          })
          .returningAll()
          .executeTakeFirstOrThrow();

        // ✅ Call another dependency
        await deps.notifications.send({
          userId: userResult.user.id,
          message: 'Post created successfully'
        });

        return { ok: true as const, post };
      })
  })
});
```

**FLAG IF YOU SEE:**

- Database queries in routes/controllers - ❌ **CRITICAL** (should be in service)
- Business logic in routes - ❌ **CRITICAL** (should be in service)
- Complex validation in routes - ❌ **CRITICAL** (should be in service)
- Routes not delegating to services - ❌ **CRITICAL**
- Services throwing errors instead of returning - ❌ WRONG

---

### 3. Single Shared Zod Schema (⚠️ CRITICAL)

**Source:** `react-hook-form.md` (fetch for form/validation changes)

#### The Rule

**ONE schema** for both client form AND server route. Export from `form.ts` (**NO** 'use client' directive).

#### Complete Implementation

**Schema Definition (Shared):**

```typescript
// File: components/Templates/ContactForm/form.ts
// ⚠️ NO 'use client' directive - must be importable by server
import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  company: z
    .string()
    .min(1, 'Company is required')
    .max(200, 'Company name too long'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message too long')
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
```

**Client Component:**

```typescript
// File: components/Templates/ContactForm/index.tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactFormSchema, type ContactFormInput } from './form';
import { submitContactFormAction } from './actions';

export function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset
  } = useForm<ContactFormInput>({
    resolver: zodResolver(contactFormSchema), // ← Same schema
    mode: 'onTouched'
  });

  const onSubmit = handleSubmit(async (data) => {
    // data is fully typed as ContactFormInput
    const result = await submitContactFormAction(data);

    if ('ok' in result) {
      reset();
      // Show success message
      return;
    }

    if (result instanceof ValidationError) {
      applyZodErrorsToForm(result.errors, setError);
    } else {
      setError('root.form', { type: 'manual', message: result.message });
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* ✅ Uncontrolled inputs with register() */}
      <div>
        <label htmlFor="name">{t('form.name')}</label>
        <input
          id="name"
          {...register('name')}
          className="border rounded px-4 py-2 w-full"
        />
        {errors.name && (
          <span className="text-red-500 text-sm">{errors.name.message}</span>
        )}
      </div>

      <div>
        <label htmlFor="email">{t('form.email')}</label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className="border rounded px-4 py-2 w-full"
        />
        {errors.email && (
          <span className="text-red-500 text-sm">{errors.email.message}</span>
        )}
      </div>

      {/* Root form error (for general errors) */}
      {errors.root?.form && (
        <div className="bg-red-50 border border-red-200 rounded p-4" role="alert">
          <p className="text-red-600">{errors.root.form.message}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-500 text-white px-6 py-2 rounded disabled:opacity-50"
      >
        {isSubmitting ? t('common.submitting') : t('actions.submit')}
      </button>
    </form>
  );
}
```

**Server Route/Action:**

```typescript
// File: src/server/routers/contact.ts
import { router, procedure } from '.';
import {
  contactFormSchema,
  type ContactFormInput
} from '@/components/Templates/ContactForm/form';
import { contactService } from '../services/contact';

export const contactRouter = router({
  submit: procedure
    .input(contactFormSchema) // ← SAME schema as client
    .mutation(async ({ input }: { input: ContactFormInput }) => {
      // input is validated identically to client
      // input is fully typed as ContactFormInput
      const result = await contactService({}).submit(input);

      if (!('ok' in result)) throw result;

      return result.submission;
    })
});
```

#### Custom Inputs with Controller

**When to use Controller (ONLY for these cases):**

- Autocomplete/combobox components
- Third-party UI libraries (Material-UI, Radix, Chakra)
- Date pickers, sliders
- Components needing real-time transformation

```typescript
import { Controller } from 'react-hook-form';

// ✅ Component stays framework-agnostic
export function Autocomplete({ value, onChange, onBlur, options, error }: Props) {
  return (
    <div>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        list="suggestions"
      />
      <datalist id="suggestions">
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
      {error && <span className="text-red-500">{error}</span>}
    </div>
  );
}

// Integration with React Hook Form
<Controller
  name="category"
  control={control}
  render={({ field, fieldState }) => (
    <Autocomplete
      {...field}
      options={categories}
      error={fieldState.error?.message}
    />
  )}
/>
```

**FLAG IF YOU SEE:**

- `<input {...register('field', { required: true, pattern: /.../ })} />` - ❌ **CRITICAL** (inline validation)
- Controlled state for standard inputs: `value={email} onChange={setEmail}` - ❌ **CRITICAL**
- Separate client/server schemas - ❌ **CRITICAL** (causes drift)
- Schema file with 'use client' directive - ❌ WRONG
- `form.ts` containing component code - ❌ WRONG (should only export schema/types)

---

### 4. Icons with @perimetre/icons (⚠️ CRITICAL)

**Source:** `icons.md` (fetch for icon/SVG component changes)

#### Non-Negotiable Rules

1. **ALWAYS** use `@perimetre/icons` wrapper
2. **ALWAYS** use `currentColor` for fills/strokes (enables theme-aware coloring)
3. **ALWAYS** add `aria-hidden` OR `label` at **usage site** (NEVER in component declaration)
4. **NEVER** use `<Image>` for static SVG icons
5. Optimize with SVGOMG before implementing (remove unnecessary attributes)

#### Icon Component Implementation

```typescript
// File: components/icons/IconCheck.tsx
import Icon, { type IconProps } from '@perimetre/icons';

// ✅ CORRECT: Spread props, NO aria-hidden or label here
const IconCheck: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5 13l4 4L19 7"
        fill="none" /* Most icons use fill="none" with stroke */
        stroke="currentColor" /* ✅ NOT #000 or any hex color */
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </Icon>
);

export default IconCheck;

// ❌ CRITICAL VIOLATION - Never add aria-hidden in component
const IconWrong: React.FC<IconProps> = (props) => (
  <Icon {...props} aria-hidden> {/* ❌ NEVER DO THIS */}
    <svg>...</svg>
  </Icon>
);
```

#### Usage Patterns

```typescript
// ✅ Decorative icon (with visible text)
<button className="flex items-center gap-2">
  <IconCheck aria-hidden className="h-4 w-4" />
  {t('actions.save')}
</button>

// ✅ Meaningful icon (icon-only button)
<button className="p-2 hover:bg-gray-100 rounded">
  <IconTrash label={t('actions.delete')} className="h-5 w-5" />
</button>

// ✅ With i18n translation
<button>
  <IconSettings
    label={t('settings.title')}
    className="h-6 w-6"
  />
</button>

// ✅ Contextual colors (currentColor inherits text color)
<div className="text-green-600">
  <IconCheck aria-hidden className="h-5 w-5" />
  <span>{t('status.success')}</span>
</div>

<div className="text-red-500">
  <IconAlert aria-hidden className="h-6 w-6" />
  <span>{t('status.error')}</span>
</div>

// ✅ Loading state
{isLoading && (
  <IconSpinner aria-hidden className="h-4 w-4 animate-spin" />
)}
```

#### File Organization

```
src/components/icons/
├── monotone/                  # Single-color icons (currentColor)
│   ├── IconCheck.tsx
│   ├── IconX.tsx
│   ├── IconSettings.tsx
│   ├── IconTrash.tsx
│   ├── IconEdit.tsx
│   └── IconSpinner.tsx
└── multicolor/                # Multi-color (brand logos, illustrations)
    ├── LogoPerimetre.tsx
    └── LogoBrand.tsx
```

**FLAG IF YOU SEE:**

- `<Icon {...props} aria-hidden>` in component - ❌ **CRITICAL**
- `<Icon {...props} label="...">` in component - ❌ **CRITICAL**
- `fill="#000000"` or any hardcoded hex color - ❌ **CRITICAL**
- `<Image src="/icons/check.svg" width={24} height={24} />` - ❌ **CRITICAL**
- Icon used without `aria-hidden` or `label` - ❌ **CRITICAL**
- Icon label not using `t()` - ❌ **CRITICAL** (i18n violation)

---

### 5. Next.js Image Component (⚠️ CRITICAL)

**Source:** `image-component.md` (fetch for Image component changes)

#### Core Principles

1. **ALWAYS** use `<Image>` for photos/raster images (jpg, png, webp)
2. **NEVER** use `<Image>` for SVG icons (use `@perimetre/icons`)
3. **REQUIRE** `width`/`height` OR `fill` with relative parent
4. **INCLUDE** `sizes` prop for responsive images
5. **ONLY** use `priority` on above-the-fold images (hero, LCP)
6. **TRANSLATE** alt text with `t()` (i18n requirement)

#### Static Import (Automatic Optimization)

```typescript
import heroImage from '@/public/images/hero.jpg';
import logoImage from '@/public/images/logo.png';

// ✅ CORRECT: Automatic width/height/blur placeholder
<Image
  src={heroImage}
  alt={t('hero.imageAlt')}
  priority // ✅ Only for above-the-fold/LCP images
  sizes="100vw"
  className="object-cover"
/>
```

#### Remote Image (Manual Dimensions Required)

```typescript
<Image
  src="https://cdn.example.com/photos/product-123.jpg"
  alt={t('products.photo', { name: product.name })}
  width={1920} // ✅ REQUIRED for remote images
  height={1080}
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
  quality={85}
  className="rounded-lg"
/>
```

#### Responsive Fill Pattern

```typescript
// ✅ CORRECT: Parent has position: relative + explicit dimensions
<div className="relative h-[500px] w-full">
  <Image
    src="/images/hero.jpg"
    alt={t('hero.alt')}
    fill // ✅ Fills parent container
    className="object-cover"
    sizes="100vw"
  />
</div>

// ✅ With aspect ratio
<div className="relative aspect-video w-full">
  <Image
    src={post.featuredImage}
    alt={post.title}
    fill
    sizes="(max-width: 768px) 100vw, 50vw"
  />
</div>

// ✅ With Tailwind arbitrary height
<div className="relative h-[clamp(300px,50vh,600px)] w-full">
  <Image
    src={banner.image}
    alt={banner.altText}
    fill
    className="object-cover"
    sizes="100vw"
  />
</div>
```

#### CMS Integration (PREFERRED Pattern)

```typescript
// ✅ GraphQL fragment for image metadata
export const ImageBlockFragment = graphql(`
  fragment ImageBlockFragment on ImageBlock {
    image {
      sourceUrl
      altText
      mediaDetails {
        width
        height
      }
    }
  }
`);

// ✅ PREFERRED: Use CMS dimensions (no hardcoding)
<Image
  src={block.image?.sourceUrl ?? ''}
  alt={block.image?.altText ?? t('images.fallbackAlt')}
  width={block.image?.mediaDetails?.width ?? 0}
  height={block.image?.mediaDetails?.height ?? 0}
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

**Why CMS dimensions are preferred:**

- Correct aspect ratio automatically
- No manual maintenance when images change
- Prevents layout shift (CLS)
- Type-safe with GraphQL codegen

#### Quality Tiers

```typescript
// Hero/LCP images (highest quality)
<Image quality={90} priority />

// Featured content
<Image quality={85} />

// Standard content (default)
<Image quality={75} />

// Background images (lower quality acceptable)
<Image quality={60} className="-z-10" />
```

**FLAG IF YOU SEE:**

- `<Image fill />` without parent `position: relative` - ❌ **CRITICAL**
- `<Image fill />` without parent having explicit dimensions - ❌ WRONG
- `<Image priority />` on non-above-the-fold images - ❌ WRONG (slows initial load)
- `<Image alt="Hardcoded text" />` without `t()` - ❌ **CRITICAL**
- Missing `sizes` prop on responsive images - ❌ WRONG
- `<Image src="/icons/check.svg" />` - ❌ **CRITICAL** (use Icon component)
- Missing `width`/`height` on remote images - ❌ **CRITICAL**
- Hardcoded dimensions when CMS provides them - ❌ WRONG

---

### 6. Internationalization (⚠️ CRITICAL)

**Source:** All LLM files (i18n is universal)

#### Universal Rule

**ALL user-facing text MUST use `t()` translation function. ABSOLUTELY ZERO EXCEPTIONS.**

#### Complete Translation Requirements

```typescript
// ✅ CORRECT - Everything translated
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('ComponentNamespace');

  return (
    <div>
      {/* Button text */}
      <button>{t('actions.submit')}</button>

      {/* Input placeholder */}
      <input placeholder={t('form.emailPlaceholder')} />

      {/* Image alt text */}
      <Image
        src={photo.url}
        alt={photo.altText ?? t('products.defaultAlt')}
        width={800}
        height={600}
      />

      {/* Icon label */}
      <IconTrash label={t('actions.delete')} />

      {/* Aria label */}
      <button aria-label={t('actions.closeDialog')}>
        <IconX aria-hidden />
      </button>

      {/* Error messages */}
      {error && <span role="alert">{t('errors.generic')}</span>}

      {/* Loading states */}
      {isLoading && <div>{t('common.loading')}</div>}

      {/* Title/heading */}
      <h1>{t('page.title')}</h1>

      {/* Paragraph text */}
      <p>{t('page.description')}</p>
    </div>
  );
}
```

#### Zod Schema Translation

```typescript
// ✅ CORRECT: Schema with translation function
import { useTranslations } from 'next-intl';
import { z } from 'zod';

const createLoginSchema = (t: (key: string) => string) =>
  z.object({
    email: z
      .string()
      .email(t('errors.email.invalid'))
      .min(1, t('errors.email.required')),
    password: z
      .string()
      .min(8, t('errors.password.min'))
      .max(100, t('errors.password.max'))
  });

export function LoginForm() {
  const t = useTranslations('Login');
  const schema = useMemo(() => createLoginSchema(t), [t]);

  const { register } = useForm({
    resolver: zodResolver(schema)
  });
  // ...
}
```

**What MUST be translated (complete list):**

- ✅ Button text (`<button>`, `<Link>`)
- ✅ Input placeholders
- ✅ Image alt text
- ✅ Icon labels
- ✅ Aria labels
- ✅ Aria descriptions
- ✅ Form labels
- ✅ Zod schema error messages
- ✅ Toast/notification messages
- ✅ Error messages
- ✅ Success messages
- ✅ Loading states
- ✅ Empty states
- ✅ Headings
- ✅ Paragraph text
- ✅ Dialog titles
- ✅ Confirmation prompts
- ✅ **Any text visible to users**

**FLAG IF YOU SEE:**
Any English string literal in UI code without `t()` - ❌ **CRITICAL**

```typescript
// ❌ CRITICAL VIOLATIONS
<button>Submit</button>
<input placeholder="Enter your email" />
<Image alt="Product photo" />
<IconTrash label="Delete" />
<button aria-label="Close dialog">X</button>
z.string().email('Invalid email address')
{error && <span>An error occurred</span>}
<h1>Welcome to our site</h1>
```

---

### 7. TypeScript Patterns

**Source:** All LLM files

#### Prefer `type` Over `interface`

```typescript
// ✅ PREFER: type alias
type User = {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
};

// ❌ AVOID: interface (unless extending)
interface User {
  id: number;
  name: string;
}

// ✅ EXCEPTION: When extending is needed
interface AdminUser extends BaseUser {
  permissions: string[];
  accessLevel: number;
}
```

#### Favor Type Inference

```typescript
// ❌ VERBOSE: Unnecessary explicit types
const getUser = async (
  id: number
): Promise<{ ok: true; user: User } | NotFoundError> => {
  // ...
};

const posts: Post[] = await getPosts(); // Don't need annotation

const config: Config = {
  apiKey: 'secret'
}; // Don't need if initial value is obvious

// ✅ CLEAN: Let TypeScript infer
const getUser = async (id: number) => {
  const user = await db.findById(id);
  if (!user) return new NotFoundError();
  return { ok: true as const, user };
  // Infers: Promise<NotFoundError | { ok: true; user: User }>
};

const posts = await getPosts(); // Infers from function return

const config = {
  apiKey: 'secret'
}; // Infers shape
```

#### Avoid `any` - Use `unknown`

```typescript
// ❌ BAD: any bypasses all type checking
function processData(data: any) {
  return data.value.nested.property; // No safety at all
}

function handleError(error: any) {
  // ❌ WRONG
  console.log(error.message);
}

// ✅ GOOD: unknown forces validation
function processData(data: unknown) {
  const validated = dataSchema.parse(data); // Zod validation
  return validated.value; // Type-safe
}

function handleError(error: unknown) {
  // ✅ CORRECT
  if (error instanceof Error) {
    console.log(error.message); // Type-safe
  } else {
    console.log('Unknown error:', error);
  }
}

// ✅ ALSO GOOD: Type guards
function processData(data: unknown) {
  if (
    typeof data === 'object' &&
    data !== null &&
    'value' in data &&
    typeof data.value === 'string'
  ) {
    return data.value; // Narrowed to string
  }
  throw new Error('Invalid data structure');
}
```

#### Use `readonly` for Immutability

```typescript
// ✅ Prevents accidental mutations
type Config = {
  readonly apiKey: string;
  readonly endpoints: readonly string[];
  readonly settings: Readonly<{
    timeout: number;
    retries: number;
  }>;
};

type Post = {
  readonly id: number;
  readonly createdAt: Date;
  title: string; // Mutable fields don't need readonly
  body: string;
};

// Usage
const config: Config = {
  apiKey: 'secret',
  endpoints: ['https://api.example.com'],
  settings: { timeout: 5000, retries: 3 }
};

config.apiKey = 'new'; // ❌ Compiler error: Cannot assign to readonly
config.endpoints.push('new'); // ❌ Compiler error: push does not exist on readonly array
config.settings.timeout = 10000; // ❌ Compiler error: Cannot assign to readonly
```

#### Functions Over Classes

```typescript
// ❌ AVOID: Class for simple stateless logic
class UserValidator {
  constructor(private schema: z.Schema) {}

  validate(data: unknown) {
    return this.schema.parse(data);
  }
}

class EmailSender {
  constructor(private apiKey: string) {}

  async send(to: string, subject: string, body: string) {
    // ...
  }
}

// ✅ PREFER: Pure functions with dependency injection
function validateUser(schema: z.Schema, data: unknown) {
  return schema.parse(data);
}

async function sendEmail(
  config: { apiKey: string },
  to: string,
  subject: string,
  body: string
) {
  // ...
}

// ✅ EXCEPTION: When you need state or lifecycle
class RateLimiter {
  private requests = new Map<string, number[]>();

  isAllowed(key: string, limit: number, window: number): boolean {
    // Stateful logic requiring instance
  }
}
```

#### React.ComponentProps

```typescript
// ❌ UGLY: Extremely verbose
type ButtonProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  variant: 'primary' | 'secondary';
};

type DivProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>;

type InputProps = React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>;

// ✅ CLEAN: Much more readable
type ButtonProps = React.ComponentProps<'button'> & {
  variant: 'primary' | 'secondary';
};

type DivProps = React.ComponentProps<'div'>;
type InputProps = React.ComponentProps<'input'>;

// ✅ Works with custom components
type CardProps = React.ComponentProps<typeof Card> & {
  elevated?: boolean;
};
```

**FLAG IF YOU SEE:**

- Usage of `any` type - ❌ WRONG
- `interface` for simple type aliases - ❌ Prefer `type`
- Over-annotated return types - ❌ Let TypeScript infer
- Mutable arrays/objects where `readonly` appropriate - ❌ Use `readonly`
- Classes for simple stateless logic - ❌ Use functions
- Verbose `DetailedHTMLProps` - ❌ Use `React.ComponentProps<'element'>`

---

### 8. Classname Utilities

#### cn() from @perimetre/classnames

```typescript
import { cn } from '@perimetre/classnames';

// ✅ Intelligently merges (later values override)
<div className={cn(
  'p-4 bg-red-500',    // Initial
  'p-2 bg-blue-500'    // Overrides both → p-2 bg-blue-500
)} />

// ✅ Conditional classes (clean)
<button className={cn(
  'px-4 py-2 rounded font-semibold transition-colors',
  isActive && 'bg-blue-500 text-white ring-2 ring-blue-300',
  isDisabled && 'opacity-50 cursor-not-allowed',
  isLoading && 'animate-pulse'
)} />

// ✅ With props
<Card className={cn(
  'p-6 rounded-lg shadow',
  elevated && 'shadow-xl',
  className // Allow override from parent
)} />

// ❌ WRONG: Manual concatenation (doesn't handle conflicts)
<div className={`base ${isActive ? 'active' : ''} ${className || ''}`} />
```

#### cva() for Complex Variants

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@perimetre/classnames';

const buttonVariants = cva(
  // Base classes (always applied)
  'inline-flex items-center justify-center font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-300',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-300',
        danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300',
        ghost: 'bg-transparent hover:bg-gray-100 focus:ring-gray-300',
        link: 'bg-transparent underline-offset-4 hover:underline text-blue-600'
      },
      size: {
        sm: 'text-sm px-3 py-1.5 h-8',
        md: 'text-base px-4 py-2 h-10',
        lg: 'text-lg px-6 py-3 h-12',
        icon: 'h-10 w-10 p-0'
      }
    },
    compoundVariants: [
      {
        variant: 'ghost',
        size: 'sm',
        className: 'px-2 py-1'
      },
      {
        variant: 'link',
        size: 'sm',
        className: 'h-auto p-0'
      }
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

// Export type for components
export type ButtonVariants = VariantProps<typeof buttonVariants>;

// Usage in component
interface ButtonProps extends React.ComponentProps<'button'>, ButtonVariants {}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

// Usage
<Button variant="primary" size="lg">
  {t('actions.submit')}
</Button>

<Button variant="danger" size="sm">
  {t('actions.delete')}
</Button>

<Button variant="ghost" size="icon" aria-label={t('actions.close')}>
  <IconX aria-hidden />
</Button>
```

**When to use `cva`:**

- 3+ variant options
- Multiple variant dimensions (variant + size + state)
- Compound variants (special combinations)
- Component reused across codebase
- Need type-safe variant props

**FLAG IF YOU SEE:**

- Manual string concatenation: `` `base ${isActive ? 'active' : ''}` `` - ❌ Use `cn()`
- Complex nested conditionals for variants - ❌ Use `cva`
- Not using `cn()` from `@perimetre/classnames` - ❌ WRONG

---

### 9. State Management

#### URL State with nuqs

**Source:** https://nuqs.dev

```typescript
import {
  useQueryState,
  useQueryStates,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  parseAsBoolean,
  parseAsArrayOf
} from 'nuqs';

function ProductList() {
  // ✅ Single state
  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1)
  );

  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault('')
  );

  // ✅ Enum validation
  const [sortBy, setSortBy] = useQueryState(
    'sort',
    parseAsStringEnum(['name', 'price', 'date']).withDefault('name')
  );

  // ✅ Boolean state
  const [showOnlyActive, setShowOnlyActive] = useQueryState(
    'active',
    parseAsBoolean.withDefault(false)
  );

  // ✅ Multiple states (atomic updates)
  const [{ category, tags }, setFilters] = useQueryStates({
    category: parseAsString,
    tags: parseAsArrayOf(parseAsString)
  });

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('search.placeholder')}
      />

      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
        <option value="name">{t('sort.name')}</option>
        <option value="price">{t('sort.price')}</option>
        <option value="date">{t('sort.date')}</option>
      </select>

      <button onClick={() => setPage(page + 1)}>
        {t('pagination.next')}
      </button>
    </div>
  );
}
```

**Use URL state for:**

- Pagination (`page`, `limit`, `offset`)
- Search queries (`q`, `search`, `query`)
- Filters (`category`, `status`, `tags`)
- Sort order (`sortBy`, `order`, `direction`)
- Tab selection (`tab`, `view`)
- Date ranges (`startDate`, `endDate`)

**DON'T use URL state for:**

- Modal open/closed states
- Hover/focus states
- Temporary form data
- Loading states
- Accordion expand/collapse

#### React Context

```typescript
import { createContext, useContext, useState, type ReactNode } from 'react';

type ThemeContextType = {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

**FLAG IF YOU SEE:**

- Redux/MobX/Zustand for simple state - ❌ Use Context
- Component state for pagination/filters - ❌ Use `nuqs`
- Global state for component-local concerns - ❌ Use `useState`

---

### 10. GraphQL + TanStack Query

**Source:** `graphql.md`, `tanstack-query.md`

#### Query Factory Pattern (REQUIRED)

```typescript
// File: components/Templates/Blog/graphql.ts
import { graphql } from '@/server/graphql/__generated__';
import {
  graphqlOptions,
  graphqlMutationOptions
} from '@/shared/react-query/graphql';
import type {
  GetPostQueryVariables,
  CreatePostMutationVariables
} from '@/server/graphql/__generated__/graphql';

// ✅ Query without variables
export const GetPostsDocument = graphql(/* GraphQL */ `
  query GetPosts {
    posts {
      data {
        id
        title
        body
        excerpt
        featuredImage {
          sourceUrl
          altText
          mediaDetails {
            width
            height
          }
        }
        author {
          name
          avatar
        }
        publishedAt
      }
    }
  }
`);

export const getPostsQuery = () => graphqlOptions(GetPostsDocument);

// ✅ Query with variables
export const GetPostDocument = graphql(/* GraphQL */ `
  query GetPost($id: ID!) {
    post(id: $id) {
      id
      title
      body
      featuredImage {
        sourceUrl
        altText
        mediaDetails {
          width
          height
        }
      }
      author {
        name
        avatar
      }
      comments {
        id
        body
        author {
          name
        }
      }
    }
  }
`);

export const getPostQuery = (variables: GetPostQueryVariables) =>
  graphqlOptions(GetPostDocument, variables);

// ✅ Mutation
export const CreatePostDocument = graphql(/* GraphQL */ `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      title
      body
      publishedAt
    }
  }
`);

export const createPostMutation = () =>
  graphqlMutationOptions(CreatePostDocument);
```

**⚠️ CRITICAL:** After adding/modifying GraphQL queries, run:

```bash
pnpm codegen
```

#### Client Component - Query

```typescript
'use client';
import { useQuery } from '@tanstack/react-query';
import { getPostsQuery } from './graphql';

export default function PostsList() {
  const { data, error, isLoading, isFetching } = useQuery(getPostsQuery());

  if (isLoading) return <div>{t('common.loading')}</div>;
  if (error) return <div role="alert">{t('errors.generic')}</div>;

  return (
    <div>
      {isFetching && <div className="text-sm text-gray-500">{t('common.updating')}</div>}

      <ul className="space-y-4">
        {data.posts?.data?.map((post) => (
          <li key={post?.id} className="border rounded-lg p-4">
            <h2 className="text-xl font-bold">{post?.title}</h2>
            <p className="text-gray-600">{post?.excerpt}</p>
            {post?.featuredImage && (
              <Image
                src={post.featuredImage.sourceUrl}
                alt={post.featuredImage.altText ?? t('blog.postImage')}
                width={post.featuredImage.mediaDetails?.width ?? 800}
                height={post.featuredImage.mediaDetails?.height ?? 600}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

#### Client Component - Mutation with Cache Invalidation

```typescript
'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPostMutation, getPostsQuery } from './graphql';

export default function CreatePostForm() {
  const queryClient = useQueryClient();

  const { mutate, isPending, isError, error } = useMutation({
    ...createPostMutation(),
    onSuccess: async (data) => {
      // ✅ Invalidate related queries after mutation
      await queryClient.invalidateQueries({
        queryKey: getPostsQuery().queryKey
      });

      // Optional: Optimistically add to cache
      queryClient.setQueryData(
        getPostsQuery().queryKey,
        (old: any) => ({
          posts: {
            data: [data.createPost, ...(old?.posts?.data ?? [])]
          }
        })
      );
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);

    mutate({
      input: {
        title: formData.get('title') as string,
        body: formData.get('body') as string
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input name="title" placeholder={t('form.titlePlaceholder')} />
      <textarea name="body" placeholder={t('form.bodyPlaceholder')} />

      <button type="submit" disabled={isPending}>
        {isPending ? t('common.submitting') : t('actions.submit')}
      </button>

      {isError && (
        <div role="alert" className="text-red-600">
          {error.message}
        </div>
      )}
    </form>
  );
}
```

#### Server Component - Prefetching

```typescript
import { getQueryClient } from '@/shared/react-query';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getPostsQuery, getPostQuery } from './graphql';
import PostsList from './posts-list';

export default async function BlogPage({
  params
}: {
  params: { slug: string };
}) {
  const queryClient = getQueryClient();

  // ✅ Prefetch multiple queries in parallel
  await Promise.all([
    queryClient.prefetchQuery(getPostsQuery()),
    queryClient.prefetchQuery(getPostQuery({ id: params.slug }))
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostsList /> {/* Client component has instant data */}
    </HydrationBoundary>
  );
}
```

**FLAG IF YOU SEE:**

- Inline query definition (not factory pattern) - ❌ WRONG
- Not running `pnpm codegen` after GraphQL changes - ❌ **CRITICAL**
- `queryClient.fetchQuery()` in client component - ❌ **CRITICAL**
- Missing cache invalidation after mutations - ❌ WRONG
- Hardcoded query keys (not from factory) - ❌ WRONG

---

## Additional Critical Patterns

### Server/Client Component Boundaries

```tsx
// ❌ CRITICAL VIOLATION - Server-only API in client component
'use client';
const queryClient = getQueryClient(); // ❌ Server-only
await queryClient.fetchQuery(someQuery()); // ❌ Server-only

// ✅ CORRECT - Proper client hooks
('use client');
const { data } = useQuery(someQuery()); // ✅ GET operations
const { mutateAsync } = useMutation(someMutation()); // ✅ POST/PUT/DELETE

// ✅ Client component can receive server data
export default function ClientComponent({
  initialData
}: {
  initialData: Data;
}) {
  const { data } = useQuery({
    ...getDataQuery(),
    initialData
  });
}
```

### Layout Shift Prevention

```tsx
// ❌ WRONG - Causes layout shift (CLS penalty)
'use client';
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);

if (!mounted) return null; // ❌ Renders nothing on server
return <Navbar />; // Pops in on client

// ✅ CORRECT - Render on both server and client
return <Navbar />;

// ✅ CORRECT - If truly client-only, use CSS
<div className="animate-fade-in opacity-0">
  <ClientOnlyComponent />
</div>;
```

### Responsive Design - No Fixed Heights

```tsx
// ❌ WRONG - Fixed heights don't adapt
<header className="h-20 md:h-24 lg:h-28">
<nav className="h-16">
<footer className="h-[400px]">

// ✅ CORRECT - Padding defines height (adapts to content)
<header className="py-4 md:py-6 lg:py-8">
<nav className="py-4">
<footer className="py-12 md:py-16">

// ✅ CORRECT - Min height with padding
<section className="min-h-screen py-20">
```

### Component Reuse Over Duplication

```tsx
// ❌ WRONG - Duplicating SectionHeading component markup
<div className="mb-12">
  <h2 className="text-3xl font-bold text-center mb-4">
    <GradientText>{block.title}</GradientText>
  </h2>
  <p className="text-gray-600 text-center max-w-2xl mx-auto">
    {block.description}
  </p>
</div>

// ✅ CORRECT - Reuse existing component
<SectionHeading
  title={block.title}
  description={block.description}
/>
```

### Link Navigation (Not Anchors)

```tsx
// ❌ WRONG - Native anchor causes full page reload
<a href="/contact">{t('nav.contact')}</a>
<a href={`/products/${slug}`}>{product.name}</a>

// ✅ CORRECT - Next.js Link with i18n
import { Link } from '@/i18n/navigation';

<Link href="/contact">{t('nav.contact')}</Link>
<Link href={`/products/${slug}`}>{product.name}</Link>

// ✅ CORRECT - External links use anchor
<a href="https://external.com" target="_blank" rel="noopener noreferrer">
  {t('links.external')}
</a>
```

### Props vs Hooks (Avoid Prop Drilling)

```tsx
// ❌ WRONG - Prop drilling when hook available
export default function Page() {
  const locale = useLocale();
  return (
    <Layout locale={locale}>
      <Footer locale={locale} />
    </Layout>
  );
}

function Footer({ locale }: { locale: string }) {
  return <p>{locale}</p>;
}

// ✅ CORRECT - Use the hook directly
function Footer() {
  const locale = useLocale(); // from next-intl
  return <p>{locale}</p>;
}
```

### CSS Location - Component vs Global

```css
/* ❌ WRONG: Component-specific styles in globals.css */
.contact-form input {
  padding: 1rem;
  border: 1px solid #ccc;
}

.contact-form button {
  background: #0070f3;
  color: white;
}
```

```tsx
// ✅ CORRECT: Styles colocated with component
export function ContactForm() {
  return (
    <form>
      <input className="rounded border border-gray-300 p-4" />
      <button className="rounded bg-blue-500 px-6 py-2 text-white" />
    </form>
  );
}
```

**globals.css should ONLY contain:**

- CSS resets
- Base typography
- Truly global utilities (container, prose)
- Third-party library overrides (when unavoidable)

### Environment Variables

```bash
# ❌ CRITICAL - Removing required variables
# NEXT_PUBLIC_BASE_URL="https://example.com" # Removed
# DATABASE_URL="..." # Commented out

# ✅ CORRECT - All required vars present
NEXT_PUBLIC_BASE_URL="https://example.com"
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SITE_NAME="My Site"
```

**FLAG IF YOU SEE:**

- Deleted/commented env vars in `.env`, `.env.example` - ❌ **CRITICAL**
- Missing vars in `.env.example` that exist in `.env` - ❌ WRONG
- Hardcoded values that should be env vars - ❌ WRONG

### Middleware Matcher Completeness

```typescript
// ❌ WRONG - Missing important routes
export const config = {
  matcher: '/((?!api|_next).*)'
};

// ✅ CORRECT - Complete exclusions for SEO and assets
export const config = {
  matcher:
    '/((?!api|trpc|favicon.ico|_next|_vercel|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'
};
```

### ESLint - Fix Don't Ignore

```javascript
// ❌ WRONG - Ignoring files that should be auto-fixed
export default {
  ignores: [
    'messages/**/*.json',     // Should be fixed
    'src/components/**/*.tsx' // Should be fixed
  ]
};

// ✅ CORRECT - Only ignore truly generated or third-party files
export default {
  ignores: [
    'node_modules',
    '.next',
    'dist',
    'build',
    '__generated__' // Generated files OK to ignore
  ]
};

// Run: eslint --fix . to auto-fix
```

### GraphQL Variable Naming

```graphql
# ❌ WRONG - Generic, unreadable names
mutation SubmitContactForm(
  $field1Value: String!
  $field2Value: String!
  $field3Value: String!
  $field4Value: String!
)

# ✅ CORRECT - Descriptive, self-documenting names
mutation SubmitContactForm(
  $name: String!
  $email: String!
  $company: String!
  $phone: String!
  $message: String!
)
```

---

## Code Quality Checks

### DRY (Don't Repeat Yourself)

**Look for:**

- Duplicated markup (same component structure repeated)
- Repeated validation logic (extract to shared schema)
- Copy-pasted functions (extract to utility)
- Duplicated API calls (extract to query factory)

**Fix:** Extract to reusable components, utilities, or shared modules.

### SOLID Principles

**Single Responsibility:**

```typescript
// ❌ WRONG - Component doing too much
function UserDashboard() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => { /* fetch user */ }, []);
  useEffect(() => { /* fetch posts */ }, []);
  useEffect(() => { /* track analytics */ }, []);
  useEffect(() => { /* setup websocket */ }, []);

  // 200+ lines of rendering logic
}

// ✅ CORRECT - Split into focused components
function UserDashboard() {
  return (
    <>
      <UserProfile />
      <UserPosts />
      <UserAnalytics />
    </>
  );
}
```

### Magic Numbers

```typescript
// ❌ BAD - Unclear magic numbers
if (user.age > 18 && credits > 100 && status === 2) {
  // ...
}

setTimeout(callback, 5000);

// ✅ GOOD - Named constants
const MINIMUM_AGE = 18;
const REQUIRED_CREDITS = 100;
const STATUS_ACTIVE = 2;
const DEBOUNCE_DELAY_MS = 5000;

if (
  user.age > MINIMUM_AGE &&
  credits > REQUIRED_CREDITS &&
  status === STATUS_ACTIVE
) {
  // ...
}

setTimeout(callback, DEBOUNCE_DELAY_MS);
```

---

## Security Checks

### Input Validation at Boundaries

```typescript
// ❌ BAD - No validation of external input
export async function POST(request: Request) {
  const body = await request.json();
  const user = await createUser(body); // ❌ Unsafe!
  return Response.json(user);
}

// ✅ GOOD - Validate at boundary
export async function POST(request: Request) {
  const body = await request.json();
  const validated = createUserSchema.parse(body); // ✅ Throws if invalid
  const result = await createUser(validated);

  if (!('ok' in result)) {
    return Response.json(
      { error: result.message },
      { status: result.statusCode }
    );
  }

  return Response.json(result.user);
}
```

### Type Assertions as Security Risk

```typescript
// ❌ BAD - Bypasses runtime safety
const user = externalApiData as User; // ❌ What if shape changed?
const config = localStorage.getItem('config') as Config; // ❌ Unsafe

// ✅ GOOD - Runtime validation
const user = userSchema.parse(externalApiData);
const config = configSchema.parse(
  JSON.parse(localStorage.getItem('config') ?? '{}')
);
```

---

## Accessibility Requirements

```typescript
// ✅ Icons MUST have aria-hidden or label
<IconCheck aria-hidden />
<IconTrash label={t('actions.delete')} />

// ✅ Images MUST have descriptive alt
<Image alt={t('products.photo', { name: product.name })} />

// ✅ Form inputs MUST have labels
<label htmlFor="email">{t('form.email')}</label>
<input id="email" {...register('email')} />

// ✅ Error messages MUST have role="alert"
{error && <span role="alert">{t('errors.generic')}</span>}

// ✅ Icon-only buttons MUST have aria-label or label prop
<button aria-label={t('actions.close')}>
  <IconX aria-hidden />
</button>

// ✅ Loading states should be announced
<div role="status" aria-live="polite">
  {isLoading ? t('common.loading') : null}
</div>
```

---

## Performance Patterns

### useMemo - Use Sparingly

```typescript
// ✅ GOOD - Expensive computation
const sortedFilteredUsers = useMemo(() => {
  return users
    .filter((u) => u.active && u.role === selectedRole)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 100);
}, [users, selectedRole]);

// ✅ GOOD - Object/array reference stability
const filterOptions = useMemo(
  () => [
    { value: 'all', label: t('filters.all') },
    { value: 'active', label: t('filters.active') }
  ],
  [t]
);

// ❌ AVOID - Simple operations (unnecessary)
const isActive = useMemo(() => status === 'active', [status]);
const userName = useMemo(() => user.name, [user]);
const doubled = useMemo(() => count * 2, [count]);
```

### Parallel vs Sequential Operations

```typescript
// ✅ GOOD - Parallel (no dependencies)
const [user, posts, comments] = await Promise.all([
  getUser(id),
  getPosts(userId),
  getComments(userId)
]);

// ❌ SLOW - Sequential (when could be parallel)
const user = await getUser(id);
const posts = await getPosts(userId);
const comments = await getComments(userId);

// ✅ CORRECT - Sequential when dependencies exist
const user = await getUser(id);
const posts = await getPosts(user.id); // ✅ Needs user.id
const comments = await getComments(posts[0].id); // ✅ Needs posts
```

---

## Review Process (5 Perspectives)

### Perspective 1: Framework Pattern Compliance

Using fetched docs, verify:

- ✅ Error-as-values (no `ok: false`)
- ✅ Service layer (no logic in routes)
- ✅ Single shared Zod schema
- ✅ Icons (currentColor, accessibility at usage)
- ✅ Images (relative parent for fill, i18n alt)
- ✅ All text uses `t()` (i18n)
- ✅ TypeScript (no `any`, inference, readonly)
- ✅ Classnames (`cn()`, `cva` for variants)
- ✅ State (nuqs for URL state)

### Perspective 2: Shallow Bug Scan

Scan git diff only for **obvious bugs**:

- Logic errors, incorrect conditionals
- Null/undefined access without checks
- Off-by-one errors
- Incorrect operators
- Missing error handling in critical paths
- API misuse (wrong signatures)

**Ignore:** Style, linter issues, nitpicks

### Perspective 3: Historical Context

**EXECUTE:**

```bash
git log --oneline -10 -- <file>
git blame <file>
```

Check for:

- Regressions (re-introducing fixed bugs)
- Breaking changes to established patterns
- Deviations from file's coding style

### Perspective 4: Previous PR Comments

**EXECUTE (if reviewing PR):**

```bash
gh pr list --search "path:<file>" --state all --limit 10
gh pr view <number> --comments
```

Check if previous feedback applies to current changes.

### Perspective 5: Code Comment Compliance

Read comments in modified files:

- `// TODO:` - Is change completing or conflicting?
- `// !` - Warning about constraints
- `// ?` - Questions needing answers
- `// *` - Important notes
- `// HACK:` - Workarounds that need attention
- `// FIXME:` - Known issues

Verify changes respect documented constraints.

---

## Confidence Scoring Rubric

For each issue, score **0-100**:

- **0**: False positive or pre-existing issue
- **25**: Might be real, unverified, stylistic (not in docs explicitly)
- **50**: Real but minor nitpick, low frequency in practice
- **75**: Verified real, high impact OR explicitly mentioned in fetched docs
- **100**: Definitely real, happens frequently, evidence confirms

**For doc-based issues:** MUST verify fetched docs **actually call this out**. Quote exact section.

**Filter threshold:** Only report confidence ≥ 80.

---

## Output Format

````markdown
### Code Review

Found [N] issues:

1. **[Brief issue description]** (Confidence: [score])

**Evidence:** According to `[doc-name].md`:

> [EXACT QUOTE from the documentation you fetched]

**File:** `[path/to/file.ts:lines]`

**Current:**

```[lang]
[actual problematic code from git diff]
```
````

**Fix:**

```[lang]
[corrected code with explanation if needed]
```

**Why:** [Impact statement - what breaks, what fails, what happens]

**Reference:** https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/[doc-name].md

---

2. [Next issue following same format...]

---

### Summary

**Recommendation:** [APPROVE / REQUEST CHANGES]

**Issues by severity:**

- Critical: [count] (pattern violations, security, breaking changes)
- High: [count] (common issues from Top 10, performance impacts)
- Medium: [count] (minor improvements, style preferences)

**Documentation Fetched:**

- PATTERNS.md (comprehensive reference)
- [actual list of all LLM docs you fetched]

**Patterns Verified:**

- Error-as-values pattern (error-handling-exception.md)
- [list other patterns you actually checked]

**Next steps:**

1. [Specific actionable step with file:line reference]
2. [Specific actionable step with file:line reference]
3. [Additional steps as needed]

````

**Output requirements:**
- Concise and actionable
- MUST cite EXACT quotes from fetched docs
- Provide code examples for EVERY issue
- Include confidence scores
- No emojis (except in signature if needed)

**If NO issues found (confidence ≥ 80):**

```markdown
### Code Review

No issues found above confidence threshold (≥80).

**Checked:**
- Framework pattern compliance
- Obvious bugs
- Historical context
- Code comment compliance

**Documentation Fetched:**
- PATTERNS.md
- [list of fetched docs]

**Patterns Verified:**
- [list of patterns checked]

**Recommendation:** APPROVE
````

---

## False Positives - NEVER Flag These

- Pre-existing issues (not in current git diff)
- Issues linters/TypeScript/compilers would catch (missing imports, type errors, formatting)
- Stylistic preferences not explicitly called out in documentation
- Issues on lines user did not modify
- Intentional functionality changes clearly related to PR purpose
- Code explicitly silenced with lint ignore comments
- Pedantic nitpicks a senior engineer wouldn't mention
- General code quality suggestions (test coverage, documentation) unless explicitly required in docs

---

## Final Execution Checklist

**YOU MUST (in this order):**

1. ✅ Execute `gh api repos/perimetre/framework/contents/LLMs --jq '.[].name'`
2. ✅ Execute `git status && git diff`
3. ✅ Fetch PATTERNS.md (always - 981 comprehensive lines)
4. ✅ Fetch relevant LLM docs based on Step 2 mapping
5. ✅ Read ALL fetched documentation completely
6. ✅ Review code from 5 perspectives
7. ✅ Score confidence 0-100 for each issue
8. ✅ Filter to ONLY report confidence ≥ 80
9. ✅ Quote EXACT docs when citing issues
10. ✅ Provide code examples for every fix
11. ✅ Format output exactly as specified

**DO NOT:**

- ❌ Skip fetching documentation
- ❌ Assume patterns without reading docs
- ❌ Flag issues not explicitly in docs
- ❌ Report issues below 80 confidence
- ❌ Be pedantic about style not in docs
- ❌ Approve with unresolved critical issues (confidence ≥ 90)

**GOAL:** Prevent CI failures and maintain code quality using production-validated patterns, not achieve theoretical perfection.
