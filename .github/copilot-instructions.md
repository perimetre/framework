**Flag only >75% confidence issues introduced by this PR. Prevent build failures.**

## CRITICAL

### 1. Error-as-Values: `ok: true` for Success ONLY

```tsx
// ✅ if (!user) return new NotFoundError(); return { ok: true as const, user };
// ❌ return { ok: false, error: '...' }; // NEVER
// Check: if (!('ok' in result)) throw result;
```

### 2. Service Layer Required

```tsx
// ✅ const result = await postsService({}).getById({ id }); if (!('ok' in result)) throw result;
// ❌ const post = await ctx.db.posts.findById(id); // Business logic in router - WRONG
```

### 3. Forms: Zod Only

```tsx
// ✅ const schema = z.object({...}); useForm({ resolver: zodResolver(schema) });
// ❌ {...register('email', { required: true })} // NEVER inline validation
```

Never controlled state (value + onChange) for standard inputs.

### 4. Icons: @perimetre/icons

```tsx
// Declaration: const Icon = (props) => <Icon {...props}><svg><path fill="currentColor" /></svg></Icon>;
// Usage: <Icon aria-hidden /> or <Icon label="..." />
// ❌ <Image src="/icons/check.svg" /> // NEVER
```

Never aria-hidden/label in declaration, only at usage. Always currentColor for fills/strokes.

### 5. Next.js Image

```tsx
// ✅ <Image src={url} alt={text} width={w} height={h} sizes="(max-width: 768px) 100vw, 50vw" />
// ❌ <Image src={url} fill /> // Missing sizes
```

Only `priority` on 1-2 above-fold images.

### 6. Server/Client Boundaries

```tsx
// ❌ queryClient.fetchQuery() in 'use client' - CRITICAL ERROR
'use client';
const queryClient = getQueryClient();
await queryClient.fetchQuery(query()); // WRONG - server only

// ✅ Client uses hooks
('use client');
const { data } = useQuery(query()); // GET
const { mutateAsync } = useMutation(mutation()); // POST
```

fetchQuery/prefetchQuery only in server components/actions.

### 7. Layout Shift Prevention

```tsx
// ❌ Causes flash/blink
'use client';
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
return mounted ? <Nav /> : null;

// ✅ Render on server
return <Nav />;
```

## HIGH PRIORITY

1. **No fixed heights:** `py-4` not `h-20`
2. **`<Link>` not `<a>`** (breaks prefetch/i18n)
3. **Hooks not props:** `useLocale()` not drilling
4. **CSS in components** not globals.css
5. **`React.ComponentProps<'div'>`** not DetailedHTMLProps
6. **`cn` from @perimetre/classnames**
7. **`cva` for variants** (3+ combinations)
8. **Extract duplicates** into components
9. **GraphQL names:** $name not $field1Value
10. **Phone:** `z.string().e164()` not regex
11. **ESLint:** Fix not ignore
12. **Middleware:** Include sitemap.xml, robots.txt

## TypeScript

- No `as` → Zod/guards
- Prefer inference
- Typed params always

## Security

- Validate input (Zod)
- Flag removed env vars
- No secrets in code
- Parameterized SQL

## GraphQL

- Factories: `export const getQuery = () => graphqlOptions(Doc);`
- Run `pnpm codegen` after changes
- Invalidate: `queryClient.invalidateQueries({ queryKey: getQuery().queryKey })`
- Dependent: `enabled: !!data`

## Performance

- No N+1 (use Promise.all)
- Parallel: `Promise.all([a, b])`
- Image: proper `sizes`, single `priority`

## Accessibility

- Icons: aria-hidden or label
- Images: descriptive alt, use t()
- Forms: aria-invalid, aria-describedby
- Buttons: aria-label when icon-only

## Code Smells

- DRY: Extract duplicates
- SRP: One responsibility
- No magic numbers
- Early returns

## Scoring

**>75% only**

- 0-75%: Skip
- 75-100%: Flag

## DON'T Flag

Pre-existing, style, linter-caught, nitpicks

## DO Flag

Build failures, security, violations, missing a11y, N+1

## Approach

Ask questions ("What if X?"), cite lines, show examples, explain why.
Verdict: "Patch correct/incorrect" + confidence (0-1) + justification.

Build: `pnpm build`
Refs: `github.com/perimetre/framework/tree/main/LLMs`

**Trust these.**
