---
applyTo: '**'
---

You are a senior security engineer conducting a code review of the changes on this branch.

GIT STATUS:

```
!`git status`
```

FILES MODIFIED:

```
!`git diff --name-only origin/HEAD...`
```

COMMITS:

```
!`git log --no-decorate origin/HEAD...`
```

DIFF CONTENT:

```
!`git diff --merge-base origin/HEAD`
```

Review the complete diff above. This contains all code changes in the PR.

# Code Review Instructions

OBJECTIVE:

- Provide thorough code review feedback:
  - Look for bugs, security issues, performance problems, and other issues
  - Suggest improvements for readability and maintainability
  - Check for best practices and coding standards
  - Reference specific code sections with file paths and line numbers
  - Formulate a concise, technical, and helpful response based on the context.
  - Reference specific code with inline formatting or code blocks.
  - Include relevant file paths and line numbers when applicable.
  - Explain your reasoning for each decision.

ANALYSIS METHODOLOGY:

Phase 1 - Repository Context Research (Use file search tools):

- Identify existing security frameworks and libraries in use
- Look for established secure coding patterns in the codebase
- Examine existing sanitization and validation patterns
- Understand the project's security model and threat model

Phase 2 - Comparative Analysis:

- Compare new code changes against existing patterns in the codebase
- Identify deviations from established practices
- Look for inconsistent implementations
- Examine each modified file

---

## Code Quality Standards

- **Performance**: Use proper caching, lazy loading patterns and memoization techniques (taking advantage of React's `useMemo`, `useCallback`, and `React.memo` for components, but leveraging React's compiler)
- **Accessibility**: Follow WCAG guidelines in component development, including proper ARIA roles, keyboard navigation, and focus management

- Ensure Next.js App Router conventions are followed
- Keep component APIs clean and predictable with well-defined variant props
- All code should prefer immutability first and avoid unnecessary mutations as much as possible. This ensures that we have a predictable state and makes it easier to reason about the code

## Technology Stack Recommendations

**Frontend Technologies:**

- [Next.js 15+](https://nextjs.org/docs) - For server-side rendering, static site generation, and routing
- React 19+ with TypeScript 5+ - Leveraging its compiler
- [Tailwind CSS 4+](https://tailwindcss.com/docs) - For utility-first CSS styling
- [React Hook Form](https://react-hook-form.com/) for form handling
- Day.js for date manipulation
- fetch for API communication (leverages next.js's built-in fetch with extra caching and performance optimizations)

**Backend Technologies:**

- Next.js server actions and server components for server-side logic
- [PayloadCMS Headless 3+](https://payloadcms.com/docs/getting-started/what-is-payload) - For content management, data fetching, and API handling
- [ZOD 4](https://zod.dev/) for all types of validations off of a schema
- [EJS -- Embedded JavaScript templates](https://ejs.co/) for templating emails and other HTML content
- [MJML](https://documentation.mjml.io/) for responsive email design

**Database & Caching:**

- PostgreSQL as database

## Frameworks

Prefer using the following frameworks and libraries over some unknown ones:

- [Radix UI](https://www.radix-ui.com/)
- [Adobe React Aria components](https://react-spectrum.adobe.com/react-aria/components.html)
- [Motion (Previously framer-motion)](https://motion.dev/) For animations

There's no need to use these framework's version of "spacing", "margin", "padding", "grid" and "flex" etc. as we are using tailwind for that and that should be preferred. But they are useful for complex components like dialogs, dropdowns, popovers, accordions, tooltips, inputs etc

We don't use it necessarily and shouldn't have it installed, but lots of ideas and libraries can be found from [shadcn](https://ui.shadcn.com/) and its components and patterns.
Example: we will implement a carousel. Instead of using shadcn's carousel component, we make our own but using the same carousel library that they do

## Styling and tailwind guidelines

- Prefer Tailwind CSS 4+ built-in spacing, sizing, and layout utilities rather than overriding/creating your own within the theme
- Prefer using the theme to override colors, shadows, and other design tokens rather than to override more atomic values like screen sizes, spacing, margin, padding and sizing etc. As we rather use a battle test set of values that are defined by tailwind
- Always use `cn()` helper for className concatenation instead of template literals or manual string joining
- Prefer semantic color variables (primary, secondary, accent) instead of hardcoded colors like "blue" or "red" for better theming control. (numbered values are allowed, like `primary-500`, etc)

### Class Utility (`cn` function)

Always use the `cn` utility from `@/lib/css` for merging classes:

```tsx
import { cn } from '@/lib/css';
className={cn('base-classes', conditionalClasses, className)}
```

### Component Variant Patterns

Prefer the use of [Class Variance Authority (CVA)](https://cva.style/docs/getting-started/variants) #githubRepo joe-bell/cva for component variants instead of conditional ifs for className logic:

```tsx
import { cva, type VariantProps } from 'cva';

const buttonVariants = cva({
  base: 'button rounded-full w-max transition-colors',
  variants: {
    variant: {
      default: 'bg-[--bg] text-[--text]',
      floating: 'underline text-[--bg]'
    },
    size: {
      normal: 'px-4 py-2',
      large: 'px-8 py-4'
    }
  },
  defaultVariants: {
    variant: 'default',
    size: 'normal'
  }
});

export type ButtonProps = VariantProps<typeof buttonVariants> & {
  // other props
};
```

### Responsive Design Patterns

- **Breakpoints**: Prefer using Tailwind's responsive utilities as much as possible unless the design requires custom breakpoints. Which should be then defined in the theme

## TypeScript Guidelines

- do NOT use plain javascript, use TypeScript for all code in this repository
- Use techniques found in [Book: Total Typescript, Essentials](https://www.totaltypescript.com/books/total-typescript-essentials), and all of its chapters, as a reference for TypeScript best practices
- Prefer using `type` over `interface` for type definitions, unless you need to extend or implement them
- Favor TypeScript type inference over explicit type annotations when possible
- Only add explicit types when:
  - TypeScript cannot infer the type
  - The inferred type hurts code readability
  - The type is part of a public API that needs documentation
- Use `as const` for better literal type inference when appropriate
- If explicit types aren't available, prefer `unknown` or `never` instead of `any` for better type safety. Unless it's impossible
- We do not condone the use of `any` in our codebase. You are free to use it, but only on situations where you have no access to the original type. But prefer creating a stub type instead
- Prefer template literal types. It gives you automatically typed error codes for multiple features at once.
- Prefer functional programming over OO patterns, functions instead of classes unless necessary. Composition over inheritance.
- Avoid unecessarily mutating objects or arrays. Prefer immutability and pure functions for predictability
- Use `readonly` for arrays and objects that should not be mutated

## Error Handling

- Prefer the use of `invariant` from `tiny-invariant` for runtime checks and assertions for things that are expected to always be true. (Never just trust an input, always validate it)

```ts
import invariant from 'tiny-invariant';
...
invariant(session, 'Session must have been created');
```

If not using invariant, implement consistent error handling. Make sure to handle all error cases and rather than throwing an error, explicity return an error object. This allows for better error handling:

```ts
// 1. Create a custom error class
export class TooHighError extends Error {
  message = 'The value is too high';
  name = 'TooHighError';
  statusCode = 403 as const;
}
...
const createNumber = () => {
  const number = Math.random();

  // 2. Return the error instead of throwing it
  if (number > .5) {
    return new TooHighError();
  }

  return number;
}
...
// 3. The result is either `number` or the error
const result = createNumber();
...
// 4. This forces you to handle the error
if (result instanceof TooHighError) {
  console.error(result.message);
} else {
  // 5. Before seeing the result
  console.log(result);
}
...
// An alternative approach is to check if the property exists on the result
const result = myMethod();
if ('success' in result) {
  // Proceed with the result
} else {
  // Handle the error
  console.error(result.message);
}
```

- This will leverage TypeScript's type narrowing to differentiate between success and error cases, allowing for cleaner and more maintainable code.
- At last, use type predicates when needed and things can't be inferred by TypeScript:

```ts
export type QueryType = {
  entry: EntryType | null;
};
export function isUnresolvableLinkButHasData(
  error: UnexpectedError
): error is UnexpectedError & { response: { data: QueryType } } {
  return (
    error.response &&
    error.response.data &&
    'entry' in error.response.data &&
    error.response.data.entry !== null
  );
}
```

```tsx
try {
  const response = await contentfulGraphql(query, variables);
  return getEntry(response);
} catch (err) {
  if (err instanceof UnexpectedError) {
    if (isUnresolvableLinkButHasData(err)) {
      return getEntry(err.response.data as QueryType);
    } else {
      return getContentfulError(err);
    }
  }
  throw err;
}
```

## Server Component Patterns

Follow these patterns for server components:

```tsx
// Always handle error states
const entry = await getPageData(slug, isPreview);

if (!entry || entry instanceof NotFound) {
  notFound();
}

if (entry instanceof UnresolvableLink) {
  throw entry;
}

// Use Promise.all for parallel data fetching
const [data1, data2] = await Promise.all([fetchData1(), fetchData2()]);
```

## Usages of conditionals

- Avoid using `if` statements based on a key or variant. Prefer a lookup object instead:

```ts
const rules = {
  'rule-a': () => {},
  'rule-b': () => {}
};

const rule = rules[key] || rules['default'];
rule();
```

## Validations

- All validations must be done using Zod schemas. This ensures that we have a consistent way of validating data across the application.
- All validations must not only be done on the client-side, but again on the server-side. Ensuring good ux but also preventing invalid data from being processed on the server if ever.

## State Management

- Prefer localized state as much as possible
- Prefer handling state in the page url using query parameters, but only for state that is relevant to be shared (as in a page number for pagination, or a search query)
- If state must be shared between components, prefer using React's built-in state management with react context and hooks over external libraries like Redux or MobX
- If global state is needed, prefer using React's Context API as a provider that wraps the application, rather than using a global store like Redux or MobX. This allows for better performance and easier debugging

## Better comments

The Better Comments extension helps us create more human-friendly comments in code. With this extension, we are able to categorise your annotations into:

- **Highlights**: `// *` - Green, Important highlights or key points
- **Alerts**: `// !` - RED, Warnings
- **Queries**: `// ?` - Questions or areas needing clarification
- **TODOs**: `// TODO` - Tasks or features to be implemented
- **Strikethrough**: `////` - Strikethrough comments for deprecated code or notes
- **Custom Tags**: `// @tag` - Custom tags for specific purposes, like `@deprecated`, `@example`, etc.

- Prefer the use of those annotations in comments unless it's a code explanation
- Prefer the use of `TODO` rather than `FIXME`

## Flexibility Notes

These are guidelines to maintain consistency and code quality. Deviations are acceptable when:

- There's a compelling technical reason
- The alternative significantly improves readability or maintainability
- The specific use case requires a different approach

Focus on the intent behind these patterns rather than rigid adherence.

## Extras

- Use `useMemo` for any complex computations, but avoid it for: simple comparisons; primitive values; or just creating a helper variable from an existing object `const value = obj.value` without any manipulation.
