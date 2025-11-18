# React Hook Form Guide for LLMs

Essential patterns for React Hook Form. Full docs: [react-hook-form.com](https://react-hook-form.com/)

---

## ⚠️ CRITICAL RULES

**🚫 NEVER:**

1. Use controlled state (`value` + `onChange`) for standard inputs - causes re-render per keystroke
2. Use inline validation in `register()` - ALWAYS use Zod + `zodResolver()`

**✅ Standard Pattern:**

```tsx
const schema = z.object({ email: z.string().email() });
const { register } = useForm({ resolver: zodResolver(schema) });
<input {...register('email')} />; // Uncontrolled
```

**⚠️ ONLY use controlled (`useController`) for:**

- Autocomplete components
- Third-party UI libraries (Material-UI, Chakra)
- Custom components needing real-time transformation

---

# Part 1: React Hook Form

## Installation

```bash
pnpm add react-hook-form @hookform/resolvers zod
```

## Basic Pattern

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email().min(1),
  password: z.string().min(8)
});
type FormType = z.infer<typeof schema>;

export default function MyForm() {
  const { register, handleSubmit, formState } = useForm<FormType>({
    resolver: zodResolver(schema),
    mode: 'onTouched'
  });

  const onSubmit = handleSubmit(async (data) => {
    console.log(data); // Fully typed
  });

  return (
    <form onSubmit={onSubmit}>
      <input {...register('email')} />
      {formState.errors.email && <p>{formState.errors.email.message}</p>}

      <input type="password" {...register('password')} />
      {formState.errors.password && <p>{formState.errors.password.message}</p>}

      <button type="submit" disabled={formState.isSubmitting}>
        Submit
      </button>
    </form>
  );
}
```

**Why uncontrolled?** No re-renders on keystroke vs controlled (re-renders every keystroke).

---

## Core APIs

### useForm Config

```tsx
useForm({
  resolver: zodResolver(schema), // Required
  mode: 'onTouched', // Validate on blur after touch
  reValidateMode: 'onChange', // Re-validate on change after submit
  defaultValues: { email: '', pwd: '' } // Required for isDirty
});
```

### Key Methods

- `register('field')` - Connect input
- `handleSubmit(fn)` - Wrap submit with validation
- `watch('field')` - Subscribe to changes (triggers re-render)
- `getValues('field')` - Get value without re-render
- `setValue('field', val)` - Update programmatically
- `setError('field', { message })` - Set manual error
- `clearErrors('field')` - Clear errors
- `reset()` - Reset to defaults
- `trigger('field')` - Manually validate

### Form State

```tsx
const { isDirty, isValid, isSubmitting, errors } = formState;
```

---

## Validation (Zod Required)

```tsx
// ❌ NEVER: Inline rules
<input {...register('email', { required: 'Required', pattern: /.../ })} />;

// ✅ ALWAYS: Zod schema
const schema = z.object({
  email: z.string().email('Invalid').min(1, 'Required'),
  password: z.string().min(8, 'Min 8 chars')
});

// With i18n
const createSchema = (t) =>
  z.object({
    email: z
      .string()
      .email({ message: t('email.invalid') })
      .min(1)
  });
type FormType = z.infer<ReturnType<typeof createSchema>>;
```

**Complex example:**

```tsx
z.object({
  client: z
    .object({
      id: z.number().min(1),
      address: z
        .object({
          street: z.string().nonempty(),
          unit: z.string().optional().nullable()
        })
        .required()
    })
    .required(),
  bookings: z
    .array(
      z.object({
        date: z.date(),
        hours: z.number().min(1)
      })
    )
    .min(1),
  confirmed: z.boolean().refine((v) => v === true, 'Must confirm')
});
```

---

## Dynamic Fields (useFieldArray)

```tsx
const { register, control } = useForm({
  defaultValues: { addresses: [{ name: '', street: '' }] }
});

const { fields, append, remove } = useFieldArray({
  control,
  name: 'addresses'
});

return (
  <>
    {fields.map((field, i) => (
      <div key={field.id}>
        {' '}
        {/* Use field.id NOT index */}
        <input {...register(`addresses.${i}.name`)} />
        <input {...register(`addresses.${i}.street`)} />
        <button onClick={() => remove(i)}>Remove</button>
      </div>
    ))}
    <button onClick={() => append({ name: '', street: '' })}>Add</button>
  </>
);
```

---

## Error Handling

**Client errors:** Automatic via Zod resolver

```tsx
{
  formState.errors.email?.message;
}
{
  formState.errors.addresses?.[0]?.street?.message;
}
{
  formState.errors.root?.form?.message;
}
```

**Server errors:**

```tsx
// Utility
export function applyZodErrorsToForm<T extends Record<string, unknown>>(
  errorTree: $ZodErrorTree<T>,
  setError: UseFormSetError<T>
) {
  if (!errorTree.properties) return;
  Object.entries(errorTree.properties).forEach(([field, err]) => {
    err?.errors.forEach((msg) => {
      setError(field as Path<T>, { type: 'manual', message: msg });
    });
  });
}

// Usage
const onSubmit = handleSubmit(async (data) => {
  clearErrors('root.form');
  try {
    const result = await myAction(data);

    // PREFERRED: Check for success first
    if ('ok' in result) return push('/success');

    // Use instanceof to distinguish between error types
    if (result instanceof ValidationError) {
      applyZodErrorsToForm(result.errors, setError);
    } else {
      setError('root.form', { type: 'manual', message: result.message });
    }
  } catch (error: unknown) {
    // Use instanceof for unknown errors in catch blocks
    if (error instanceof Error) {
      setError('root.form', { type: 'manual', message: error.message });
    } else {
      setError('root.form', { type: 'manual', message: 'Error occurred' });
    }
  }
});
```

---

## Custom Inputs

**❌ DON'T couple to React Hook Form:**

```tsx
export function CustomInput({ name }) {
  const { register } = useFormContext(); // ❌ Coupled!
  return <input {...register(name)} />;
}
```

**✅ DO keep self-sufficient:**

```tsx
// CustomInput.tsx - reusable everywhere
type Props = {
  value?: string;
  onChange?: (v: string) => void;
  onBlur?: () => void;
  error?: string;
};

export function CustomInput({ value, onChange, onBlur, error }: Props) {
  return (
    <div>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
      />
      {error && <span className="text-red-500">{error}</span>}
    </div>
  );
}
```

**Integration (prefer `<Controller>`):**

```tsx
import { Controller } from 'react-hook-form';

<Controller
  name="username"
  control={control}
  render={({ field, fieldState }) => (
    <CustomInput {...field} error={fieldState.error?.message} />
  )}
/>;
```

**Alternative (for frequently reused):**

```tsx
// CustomInputField.tsx
export function CustomInputField({ name, control }) {
  const { field, fieldState } = useController({ name, control });
  return <CustomInput {...field} error={fieldState.error?.message} />;
}
```

Use `<Controller>` for one-offs, `useController` wrapper for frequent reuse.

---

## Watching Values

```tsx
// watch() - Re-renders component
const email = watch('email');

// useWatch - Isolated re-render (better for child components)
function Child() {
  const email = useWatch({ control, name: 'email' });
  return <div>{email}</div>;
}

// getValues() - No re-render (use in callbacks)
const onSubmit = () => {
  const email = getValues('email');
};
```

---

## Advanced Patterns

**Nested components:**

```tsx
// Parent
const methods = useForm();
return (
  <FormProvider {...methods}>
    <NestedChild />
  </FormProvider>
);

// Child
const { register } = useFormContext<FormType>();
```

**Reset form:**

```tsx
reset(); // To defaultValues
reset({ email: '' }); // New values
<Dialog onOpenChange={open => !open && reset()}> // On close
```

**Performance:**

```tsx
// Memoize submit
const onSubmit = useMemo(
  () =>
    handleSubmit(async (data) => {
      /* ... */
    }),
  [handleSubmit]
);

// Access state efficiently
const { isDirty } = useFormState({ control }); // ✅ Proxy subscription
```

---

## Common Pitfalls

**❌ Using controlled state:**

```tsx
const [email, setEmail] = useState('');
<input value={email} onChange={(e) => setEmail(e.target.value)} />; // Re-renders!
```

**✅ Use uncontrolled:**

```tsx
<input {...register('email')} />;
const email = watch('email'); // If needed elsewhere
```

**❌ Passing methods to deps:**

```tsx
useEffect(() => {}, [methods]); // Changes every render
```

**✅ Destructure:**

```tsx
const { watch, setValue } = useForm();
useEffect(() => {}, [watch, setValue]); // Stable
```

**❌ Mixing controlled + register:**

```tsx
<input {...register('email')} value={state} /> // Conflict!
```

**❌ Missing defaultValues:**

```tsx
useForm<T>(); // isDirty won't work
```

**✅ Always provide:**

```tsx
useForm<T>({ defaultValues: { email: '' } });
```

---

## Accessibility

```tsx
<label htmlFor="email">Email</label>
<input
  id="email"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
  {...register('email')}
/>
{errors.email && (
  <span id="email-error" role="alert">{errors.email.message}</span>
)}

{errors.root?.form && (
  <p aria-live="polite" role="alert">{errors.root.form.message}</p>
)}
```

---

# Part 2: Architecture

## File Structure

```
src/
├── components/Templates/Login/
│   ├── index.tsx  # Client form
│   └── form.ts    # Shared schema (no 'use client')
└── server/routers/
    └── session.ts # Server logic
```

## Shared Schema Pattern

**form.ts:**

```tsx
import { z } from 'zod';

// Client schema (with i18n)
export const createLoginSchema = (t: (key: string) => string) =>
  z.object({
    email: z
      .string()
      .email({ message: t('email.invalid') })
      .min(1),
    password: z.string().min(8, { message: t('password.min') })
  });
export type LoginFormType = z.infer<ReturnType<typeof createLoginSchema>>;

// Server schema (no i18n)
export const loginSchema = z.object({
  email: z.string().email().min(1),
  password: z.string().min(8)
});
export type LoginInput = z.infer<typeof loginSchema>;
```

**Benefits:** Single source of truth, type safety, no drift.

**Simpler (no i18n):**

```tsx
export const loginSchema = z.object({
  email: z.string().email('Invalid').min(1, 'Required'),
  password: z.string().min(8, 'Min 8')
});
export type LoginInput = z.infer<typeof loginSchema>;
```

---

# Part 3: tRPC Integration

**Client:**

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createLoginSchema, type LoginFormType } from './form';
import { trpc } from '@/client/lib/trpc';

export default function LoginForm() {
  const t = useTranslations('Login');
  const { register, handleSubmit, formState } = useForm<LoginFormType>({
    resolver: zodResolver(createLoginSchema(t)),
    mode: 'onTouched'
  });

  const { mutateAsync: login } = trpc.session.login.useMutation();

  const onSubmit = handleSubmit(async (data) => {
    const result = await login(data);
    if ('ok' in result) push('/dashboard');
  });

  return (
    <form onSubmit={onSubmit}>
      <input {...register('email')} />
      {formState.errors.email && <span>{formState.errors.email.message}</span>}

      <input type="password" {...register('password')} />
      {formState.errors.password && (
        <span>{formState.errors.password.message}</span>
      )}

      <button type="submit" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? 'Loading...' : 'Login'}
      </button>
    </form>
  );
}
```

**Server:**

```tsx
import {
  loginSchema,
  type LoginInput
} from '@/components/Templates/Login/form';

export const sessionRouter = router({
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input }: { input: LoginInput }) => {
      const { email, password } = input;
      const valid = await checkCredentials(email, password);

      if (!valid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials'
        });
      }

      return { ok: true };
    })
});
```

**With error handling:** See Part 1 "Error Handling" section for `applyZodErrorsToForm` pattern.

---

# Part 4: next-safe-action Integration

For projects without tRPC.

**Setup:**

```bash
pnpm add next-safe-action @next-safe-action/adapter-react-hook-form
```

**lib/safe-action.ts:**

```tsx
import { createSafeActionClient } from 'next-safe-action';
export const actionClient = createSafeActionClient();
```

**Server action:**

```tsx
'use server';
import { actionClient } from '@/lib/safe-action';
import { loginSchema } from './form';
import { returnValidationErrors } from 'next-safe-action';

export const loginAction = actionClient
  .schema(loginSchema)
  .action(async ({ parsedInput }) => {
    const { email, password } = parsedInput;
    const valid = await checkCredentials(email, password);

    if (!valid) {
      returnValidationErrors(loginSchema, {
        _errors: ['Invalid credentials']
      });
    }

    return { success: true };
  });
```

**Client:**

```tsx
'use client';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from './form';
import { loginAction } from './actions';

export default function LoginForm() {
  const { form, handleSubmitWithAction, action } = useHookFormAction(
    loginAction,
    zodResolver(loginSchema),
    { formProps: { mode: 'onTouched' } }
  );

  return (
    <form onSubmit={handleSubmitWithAction}>
      <input {...form.register('email')} />
      {form.formState.errors.email && (
        <span>{form.formState.errors.email.message}</span>
      )}

      <input type="password" {...form.register('password')} />
      {form.formState.errors.password && (
        <span>{form.formState.errors.password.message}</span>
      )}

      <button type="submit" disabled={action.isPending}>
        {action.isPending ? 'Loading...' : 'Login'}
      </button>

      {action.result.data?.success && <p>Success!</p>}
      {action.result.serverError && <p>{action.result.serverError}</p>}
    </form>
  );
}
```

**Benefits:** Auto error mapping, type-safe, built-in loading states, cleaner than raw server actions.

---

# Conclusion

## Decision Tree

**1. Files:**

```
components/Templates/MyForm/
├── index.tsx  # Client
└── form.ts    # Schema
```

**2. Schema:**

```tsx
export const mySchema = z.object({ ... });
export type MyInput = z.infer<typeof mySchema>;
```

**3. Client:**

```tsx
const { register } = useForm<MyInput>({
  resolver: zodResolver(mySchema)
});
<input {...register('field')} />;
```

**4. Server (choose one):**

- **tRPC:** `procedure.input(mySchema).mutation(...)`
- **next-safe-action:** `actionClient.schema(mySchema).action(...)`

**Input types:**

- Standard (text, email, etc) → `register()` (uncontrolled)
- Custom component → Keep self-sufficient, use `<Controller>` (preferred) or `useController` wrapper
- Third-party library → `<Controller>` or `useController`

**Common needs:**

- Dynamic fields → `useFieldArray`
- Nested components → `FormProvider` + `useFormContext`
- Display value elsewhere → `watch('field')` (not controlled state)
- Server errors → `setError()` + `applyZodErrorsToForm()`
- Performance → Check controlled state, use `useFormState`/`useWatch`, avoid passing `methods` to deps

## Resources

- [React Hook Form Docs](https://react-hook-form.com/)
- [TypeScript Guide](https://react-hook-form.com/ts)
- [Zod Resolver](https://github.com/react-hook-form/resolvers#zod)
- [next-safe-action](https://next-safe-action.dev/)
