# Perimetre Framework Code Review Patterns

**Purpose:** Detailed reference of all patterns, examples, and anti-patterns for code review agents.

**Usage:** This file is referenced by the code review skill/command. Agents should consult relevant sections based on the type of code being reviewed.

---

## Table of Contents

1. [Error-as-Values Pattern](#1-error-as-values-pattern)
2. [Service Layer Architecture](#2-service-layer-architecture)
3. [Single Shared Zod Schema](#3-single-shared-zod-schema)
4. [Icons with @perimetre/icons](#4-icons-with-perimetreicons)
5. [Next.js Image Component](#5-nextjs-image-component)
6. [Internationalization (i18n)](#6-internationalization-i18n)
7. [TypeScript Guidelines](#7-typescript-guidelines)
8. [State Management](#8-state-management)
9. [TanStack Query & GraphQL](#9-tanstack-query--graphql)
10. [High-Priority Common Issues](#10-high-priority-common-issues)

---

## 1. Error-as-Values Pattern

**Reference:** https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/error-handling-exception.md

### ⚠️ CRITICAL RULE

Success uses `ok: true as const`, failures return Error instances. **Never** return `ok: false`.

### ✅ CORRECT Pattern

```typescript
// Define custom error classes
export class NotFoundError extends Error {
  name = 'NotFoundError';
  statusCode = 404 as const;
  constructor(message = 'Not found') {
    super(message);
  }
}

// Function returns error as value
export const getUser = async (id: string) => {
  const user = await db.user.findById(id);

  // ✅ Return Error instance for failures
  if (!user) return new NotFoundError();

  // ✅ Return { ok: true as const, ...data } for success
  return { ok: true as const, user };
};

// Usage: Check for success first (PREFERRED)
const result = await getUser(id);
if (!('ok' in result)) {
  // Handle error
  throw result;
}
// TypeScript knows result.user exists here
return result.user;

// Alternative: instanceof when distinguishing error types
if (result instanceof NotFoundError) {
  return { error: 'User not found' };
} else if (result instanceof UnauthorizedError) {
  return { error: 'Unauthorized' };
} else if ('ok' in result) {
  return result.user;
}
```

### ❌ WRONG Patterns

```typescript
// ❌ NEVER DO THIS: ok: false
export const getUser = async (id: string) => {
  const user = await db.user.findById(id);
  if (!user) return { ok: false, error: 'Not found' }; // ❌ WRONG
  return { ok: true as const, user };
};

// ❌ NEVER DO THIS: Throwing errors in business logic
export const getUser = async (id: string) => {
  const user = await db.user.findById(id);
  if (!user) throw new Error('Not found'); // ❌ Prefer returning
  return user;
};
```

---

## 2. Service Layer Architecture

**Reference:** https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/services.md

### Rule

Business logic MUST be in services. Routes/controllers should be thin and delegate immediately.

### ✅ CORRECT Pattern

```typescript
// File: src/server/services/posts.ts
import { defineService } from '@perimetre/service-builder';
import { NotFoundError } from '@/shared/exceptions';
import { z } from 'zod';

export const postsService = defineService<{ db: Kysely<Database> }>()({
  methods: ({ method }) => ({
    getById: method
      .input(z.object({ id: z.number().int().positive() }))
      .handler(async ({ ctx, input }) => {
        // ✅ Business logic here
        const post = await ctx.db
          .selectFrom('posts')
          .where('id', '=', input.id)
          .executeTakeFirst();

        if (!post) return new NotFoundError();
        return { ok: true as const, post };
      })
  })
});

// File: src/server/routers/posts.ts
export const postsRouter = router({
  getById: procedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      // ✅ Route delegates to service immediately
      const result = await postsService({}).getById(input);
      if (!('ok' in result)) throw result;
      return result.post;
    })
});
```

### ❌ WRONG Pattern

```typescript
// ❌ Business logic in router (violates service layer pattern)
export const postsRouter = router({
  getById: procedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      // ❌ Database queries don't belong in routes
      const post = await ctx.db.posts.findById(input.id);
      if (!post) throw new Error('Not found');

      // ❌ Business logic in route
      if (post.status === 'draft' && !ctx.user.isAdmin) {
        throw new Error('Forbidden');
      }

      return post;
    })
});
```

---

## 3. Single Shared Zod Schema

**Reference:** https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/react-hook-form.md

### ⚠️ CRITICAL RULE

Use ONE shared schema for both client form AND server router. Export from `form.ts`.

### ✅ CORRECT Pattern

```typescript
// File: components/Templates/Login/form.ts (NO 'use client' directive)
import { z } from 'zod';

// Single schema - source of truth
export const loginSchema = z.object({
  email: z.string().email('Invalid email').min(1, 'Required'),
  password: z.string().min(8, 'Min 8 characters')
});

export type LoginInput = z.infer<typeof loginSchema>;

// ---

// File: components/Templates/Login/index.tsx (client)
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from './form';

export function LoginForm() {
  const { register, handleSubmit, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema) // ← Same schema
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {formState.errors.email && <span>{formState.errors.email.message}</span>}

      <input type="password" {...register('password')} />
      {formState.errors.password && <span>{formState.errors.password.message}</span>}
    </form>
  );
}

// ---

// File: server/routers/session.ts (server)
import { router, procedure } from '.';
import { loginSchema, type LoginInput } from '@/components/Templates/Login/form';

export const sessionRouter = router({
  login: procedure
    .input(loginSchema) // ← SAME schema as client
    .mutation(async ({ input }: { input: LoginInput }) => {
      // input validated identically to client
      const isValid = await checkCredentials(input.email, input.password);
      if (!isValid) return new UnauthorizedError();
      return { ok: true as const };
    })
});
```

### ❌ WRONG Patterns

```typescript
// ❌ WRONG: Inline validation rules
<input {...register('email', { required: true, pattern: /.../ })} />

// ❌ WRONG: Controlled state (causes re-render per keystroke)
const [email, setEmail] = useState('');
<input value={email} onChange={(e) => setEmail(e.target.value)} />

// ❌ WRONG: Separate schemas (leads to drift)
// Client
const clientSchema = z.object({ email: z.string() });

// Server (different file, different rules)
const serverSchema = z.object({ email: z.string().email() });
```

---

## 4. Icons with @perimetre/icons

**Reference:** https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/icons.md

### ✅ CORRECT Pattern

```typescript
// File: components/icons/IconCheck.tsx
import Icon, { type IconProps } from '@perimetre/icons';

const IconCheck: React.FC<IconProps> = (props) => (
  <Icon {...props}> {/* ✅ Spread props */}
    <svg viewBox="0 0 24 24">
      <path d="M5 13l4 4L19 7" fill="currentColor" /> {/* ✅ currentColor */}
    </svg>
  </Icon>
);

export default IconCheck;

// Usage: Decorative icon (with text)
<button>
  <IconCheck aria-hidden className="mr-2" /> {/* ✅ aria-hidden at usage */}
  Save Changes
</button>

// Usage: Meaningful icon (icon-only)
<button>
  <IconTrash label="Delete item" /> {/* ✅ label at usage */}
</button>

// Usage: With i18n
<button>
  <IconSettings label={t('actions.settings')} />
</button>
```

### ❌ WRONG Patterns

```typescript
// ❌ WRONG: Using Image for static SVG icon
<Image src="/icons/check.svg" width={24} height={24} alt="Check" />

// ❌ WRONG: Adding aria-hidden in component declaration
const IconWrong: React.FC<IconProps> = (props) => (
  <Icon {...props} aria-hidden> {/* ❌ Don't add here */}
    <svg>...</svg>
  </Icon>
);

// ❌ WRONG: Hardcoded colors instead of currentColor
<svg viewBox="0 0 24 24">
  <path d="..." fill="#000000" /> {/* ❌ Use currentColor */}
</svg>

// ❌ WRONG: No accessibility prop at usage
<button>
  <IconCheck /> {/* ❌ Missing aria-hidden or label */}
</button>
```

---

## 5. Next.js Image Component

**Reference:** https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/image-component.md

### ✅ CORRECT Patterns

```typescript
// ✅ Remote image with dimensions
<Image
  src={cmsImage.sourceUrl}
  alt={cmsImage.altText}
  width={cmsImage.mediaDetails.width}
  height={cmsImage.mediaDetails.height}
  sizes="(max-width: 768px) 100vw, 50vw"
/>

// ✅ Responsive fill with relative parent
<div className="relative aspect-video w-full">
  <Image
    src={post.image}
    alt={post.title}
    fill
    sizes="(max-width: 768px) 100vw, 50vw"
  />
</div>

// ✅ Hero image with priority
<div className="relative h-[500px]">
  <Image
    src={heroImage}
    alt={t('hero.imageAlt')}
    fill
    priority
    sizes="100vw"
  />
</div>
```

### ❌ WRONG Patterns

```typescript
// ❌ WRONG: Using Image for SVG icons
<Image src="/icons/check.svg" width={24} height={24} alt="Check" />

// ❌ WRONG: Missing width/height on remote images
<Image src="https://example.com/photo.jpg" alt="Photo" />

// ❌ WRONG: fill without relative parent
<Image fill alt="Photo" src={url} /> {/* Parent needs position: relative */}

// ❌ WRONG: priority on non-hero images
<Image src={productImage} alt="Product" priority /> {/* Slows initial load */}

// ❌ WRONG: Hardcoded alt text (not translated)
<Image src={photo} alt="Product photo" />
```

---

## 6. Internationalization (i18n)

### ⚠️ CRITICAL RULE

ALL user-facing text MUST be translated. No hardcoded English strings.

### ✅ CORRECT Patterns

```typescript
// ✅ Zod schema with translations
import { useTranslations } from 'next-intl';

const createLoginSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email({ message: t('errors.email.invalid') }),
    password: z.string().min(8, { message: t('errors.password.min') })
  });

export function LoginForm() {
  const t = useTranslations('Login');
  const schema = createLoginSchema(t);
  // ...
}

// ✅ Image alt text
<Image
  src={product.image}
  alt={product.altText || t('products.defaultAlt')}
  width={800}
  height={600}
/>

// ✅ Icon labels
<IconTrash label={t('actions.delete')} />

// ✅ Aria labels
<button aria-label={t('actions.closeDialog')}>
  {t('actions.close')}
</button>

// ✅ Button text
<button>{t('actions.submit')}</button>

// ✅ Placeholder
<input placeholder={t('form.emailPlaceholder')} />

// ✅ Error messages
{error && <span>{t('errors.generic')}</span>}
```

### ❌ WRONG Patterns

```typescript
// ❌ Hardcoded error messages
const schema = z.object({
  email: z.string().email('Invalid email') // ❌ Not translated
});

// ❌ Hardcoded alt text
<Image src={photo} alt="Product photo" />

// ❌ Hardcoded labels
<IconTrash label="Delete" />

// ❌ Hardcoded aria
<button aria-label="Close dialog">X</button>

// ❌ Hardcoded text
<button>Submit</button>
<input placeholder="Enter your email" />
```

**What MUST be translated:**

- Zod schema error messages
- Image alt text (unless from CMS)
- Icon labels
- Aria labels
- Button text
- Placeholder text
- Form labels
- Error/success messages
- Loading states
- Any visible text

---

## 7. TypeScript Guidelines

**Reference:** [Total TypeScript Essentials](https://www.totaltypescript.com/books/total-typescript-essentials)

### 1. TypeScript Only

```typescript
// ❌ BAD: Plain JavaScript
const processUser = (user) => user.name;

// ✅ GOOD: TypeScript
const processUser = (user: User) => user.name;
```

### 2. Prefer `type` Over `interface`

```typescript
// ❌ AVOID: Unless extending
interface User {
  id: number;
  name: string;
}

// ✅ PREFER: Use type
type User = {
  id: number;
  name: string;
};

// ✅ EXCEPTION: When extending
interface AdminUser extends BaseUser {
  permissions: string[];
}
```

### 3. Favor Type Inference

```typescript
// ❌ VERBOSE: Unnecessary explicit type
const getUser = async (id: number): Promise<User | NotFoundError> => {
  // TypeScript can infer this
};

// ✅ CLEAN: Let TypeScript infer
const getUser = async (id: number) => {
  const user = await db.findById(id);
  if (!user) return new NotFoundError();
  return { ok: true as const, user };
  // Infers: Promise<NotFoundError | { ok: true; user: User }>
};
```

### 4. Avoid `any`

```typescript
// ❌ BAD: Using any
const processData = (data: any) => data.value;

// ✅ GOOD: Use unknown and validate
const processData = (data: unknown) => {
  const validated = dataSchema.parse(data);
  return validated.value;
};

// ✅ EXCEPTION: When no access to types, create stub
type StubType = {
  value: unknown;
  // Document what you know
};
```

### 5. Template Literal Types

```typescript
// ✅ GOOD: Auto-typed error codes
type Feature = 'auth' | 'payment' | 'user';
type Action = 'create' | 'update' | 'delete';
type ErrorCode = `${Feature}_${Action}_failed`;
// Creates 9 combinations automatically

class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message?: string
  ) {
    super(message || code);
  }
}
```

### 6. Immutability & readonly

```typescript
// ✅ GOOD: Immutable operations
const addItem = (cart: Cart, item: Item): Cart => {
  return {
    ...cart,
    items: [...cart.items, item] // No mutation
  };
};

// ✅ GOOD: Use readonly
type Cart = {
  readonly items: readonly Item[];
  readonly total: number;
};

// Compiler prevents mutation
cart.items.push(item); // ❌ Error
```

### 7. Functions Over Classes

```typescript
// ❌ AVOID: Classes for simple logic
class UserProcessor {
  async process(userId: number) { ... }
}

// ✅ PREFER: Functions
const processUser = async (db: Database, userId: number) => {
  // ...
};
```

---

## 8. State Management

### 1. Prefer Localized State

```typescript
// ✅ GOOD: Component-local
function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);
}

// ❌ AVOID: Global for local concerns
const globalEditingState = createStore();
```

### 2. nuqs for URL State

**Reference:** https://nuqs.dev/

```typescript
// ✅ BEST: Use nuqs for type-safe URL state
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs';

function ProductList() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''));

  return (
    <div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
      <button onClick={() => setPage(page + 1)}>Next</button>
    </div>
  );
}

// ✅ GOOD: Manual (if nuqs not available)
const searchParams = useSearchParams();
const page = searchParams.get('page') || '1';
```

**Use URL state for:**

- Pagination
- Search queries
- Filters
- Sort order
- Tab selection

**Don't use URL for:**

- Modal open/closed
- Hover states
- Temporary form data

### 3. Context Over Redux

```typescript
// ✅ GOOD: React Context
const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be within Provider');
  return context;
};
```

---

## 9. TanStack Query & GraphQL

**Reference:**

- https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/tanstack-query.md
- https://raw.githubusercontent.com/perimetre/framework/refs/heads/main/LLMs/graphql.md

### TanStack Query Factory Pattern

```typescript
// ✅ CORRECT: Query factory
// File: queries.ts
export const getPostsQuery = () =>
  queryOptions({
    queryKey: ['posts'],
    queryFn: async () => {
      const response = await fetch('/api/posts');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    }
  });

// Usage in client component
const { data } = useQuery(getPostsQuery());

// Usage in server component
await queryClient.prefetchQuery(getPostsQuery());

// ❌ WRONG: Inline definition
const { data } = useQuery({
  queryKey: ['posts'],
  queryFn: () => fetch('/api/posts').then((r) => r.json())
});
```

### GraphQL with Codegen

```typescript
// ✅ CORRECT: Factory with codegen
// File: graphql.ts
import { graphql } from '@/server/graphql/__generated__';
import { graphqlOptions } from '@/shared/react-query/graphql';

export const GetPostsDocument = graphql(/* GraphQL */ `
  query GetPosts {
    posts {
      id
      title
    }
  }
`);

export const getPostsQuery = () => graphqlOptions(GetPostsDocument);

// In component
const { data } = useQuery(getPostsQuery());

// ⚠️ IMPORTANT: Run pnpm codegen after changes
```

### Cache Invalidation

```typescript
// ✅ CORRECT: Invalidate after mutations
const createPost = useMutation({
  ...createPostMutation(),
  onSuccess: async () => {
    await queryClient.invalidateQueries({
      queryKey: getPostsQuery().queryKey
    });
  }
});
```

---

## 10. High-Priority Common Issues

**Based on analysis of 141 code reviews:**

### 1. Fixed Heights (Most Common)

```typescript
// ❌ BAD: Fixed heights
<nav className="h-20 md:h-[100px] lg:h-[120px]">

// ✅ GOOD: Padding defines height
<nav className="py-4 md:py-6 lg:py-8">
```

### 2. Navigation Links

```typescript
// ❌ BAD: Native anchor
<a href="/contact">Contact</a>

// ✅ GOOD: Next.js Link
import { Link } from '@/i18n/navigation';
<Link href="/contact">Contact</Link>
```

### 3. Props vs Hooks

```typescript
// ❌ BAD: Prop drilling
<Footer locale={locale} />

// ✅ GOOD: Use hook
function Footer() {
  const locale = useLocale();
}
```

### 4. CSS Location

```css
/* ❌ BAD: Component CSS in globals */
.my-component input {
  padding: 1rem;
}
```

```typescript
// ✅ GOOD: In component
<input className="p-4" />
```

### 5. Component Duplication

```typescript
// ❌ BAD: Duplicating markup
<div>
  <h2 className="...">
    <GradientText>{block.title}</GradientText>
  </h2>
</div>

// ✅ GOOD: Use component
<SectionHeading title={block.title} />
```

### 6. React.ComponentProps

```typescript
// ❌ UGLY
type Props = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>;

// ✅ CLEAN
type Props = React.ComponentProps<'div'>;
```

### 7. Classnames Utility

```typescript
// ❌ BAD: Manual concatenation
className={`base ${isActive ? 'active' : ''}`}

// ✅ GOOD: Use cn
import { cn } from '@perimetre/classnames';
className={cn('p-4 bg-red-500', 'p-2 bg-blue-500')}
```

### 8. CVA for Variants

```typescript
// ❌ BAD: Manual conditionals
className={cn(
  'base',
  size === 'sm' && 'text-sm',
  variant === 'primary' && 'bg-blue-500'
)}

// ✅ GOOD: Use cva
import { cva } from 'class-variance-authority';

const variants = cva('base', {
  variants: {
    variant: { primary: 'bg-blue-500', secondary: 'bg-gray-500' },
    size: { sm: 'text-sm', md: 'text-base' }
  }
});
```

### 9. Code Comments

```typescript
// ✅ GOOD: Better Comments patterns
// * Important highlight
// ! Warning - do not modify
// ? Question - should this handle nulls?
// TODO: Add rate limiting (ticket: PROJ-123)
//// Deprecated - use newFunction instead

// ❌ BAD: Vague TODOs
// TODO: fix this
```

### 10. Performance - useMemo

```typescript
// ✅ GOOD: Complex computation
const sortedUsers = useMemo(() => {
  return users
    .filter((u) => u.active)
    .sort((a, b) => a.name.localeCompare(b.name));
}, [users]);

// ❌ AVOID: Simple operations
const isActive = useMemo(() => status === 'active', [status]); // Overkill
const userName = useMemo(() => user.name, [user]); // Unnecessary
```

---

## Code Smell Detection

### DRY Violations

Look for:

- Duplicated markup across components
- Repeated validation logic
- Copy-pasted utility functions
- Duplicated API calls

**Fix:** Extract to reusable components/functions

### Single Responsibility Violations

Look for:

- Components doing too much (fetching + rendering + state + analytics)
- Services with multiple unrelated responsibilities
- Utility files mixing concerns

**Fix:** Split into focused units

### Magic Numbers

```typescript
// ❌ BAD
if (user.age > 18 && credits > 100) { ... }

// ✅ GOOD
const MIN_AGE = 18;
const MIN_CREDITS_REQUIRED = 100;
if (user.age > MIN_AGE && credits > MIN_CREDITS_REQUIRED) { ... }
```

---

## Security Checks

### Input Validation

```typescript
// ❌ BAD: No validation
const body = await request.json();
await createUser(body); // Unsafe!

// ✅ GOOD: Zod validation
const validated = createUserSchema.parse(body);
await createUser(validated);
```

### Environment Variables

**Flag:** Any deletions or modifications to `.env`, `.env.example`

### Type Assertions

```typescript
// ❌ BAD: Bypasses type safety
const user = data as User;

// ✅ GOOD: Runtime validation
const user = userSchema.parse(data);
```

---

## Accessibility Checks

### Required Patterns

```typescript
// ✅ Icons need aria-hidden or label
<IconCheck aria-hidden /> // Decorative
<IconTrash label={t('delete')} /> // Meaningful

// ✅ Images need descriptive alt
<Image alt={t('products.photo', { name: product.name })} />

// ✅ Form inputs need labels
<label htmlFor="email">{t('form.email')}</label>
<input id="email" {...register('email')} />

// ✅ Error messages need role="alert"
{error && <span role="alert">{error.message}</span>}
```

---

## Historical Top 10 Issues

From 141 reviews across 56 PRs:

1. **Fixed heights** (High frequency, Medium severity)
2. **`<a>` vs `<Link>`** (High frequency, Medium severity)
3. **Unnecessary props** (High frequency, Medium severity)
4. **CSS in globals** (Medium frequency, Medium severity)
5. **Client/Server misuse** (Medium-High frequency, High severity)
6. **Image component** (Medium-High frequency, Medium severity)
7. **Code duplication** (Medium frequency, Medium severity)
8. **Hardcoded values** (Medium frequency, Medium severity)
9. **Generic GraphQL names** (Medium frequency, Low severity)
10. **ESLint ignores** (Medium frequency, Medium severity)
