# @perimetre/classnames

Utility for merging and managing CSS class names with Tailwind CSS.

## What it does

Combines `clsx` and `tailwind-merge` to intelligently merge class names, resolving Tailwind CSS conflicts automatically.

## Why it exists

Prevents Tailwind class conflicts (e.g., `p-4 p-2` → `p-2`) and provides a simple API for conditional class names in React components.

## Usage

```bash
pnpm add @perimetre/classnames
```

```tsx
import { cn } from '@perimetre/classnames';

// Merge classes with conflict resolution
cn('p-4 text-red-500', 'p-2 text-blue-500');
// Result: 'p-2 text-blue-500'

// Conditional classes
cn('base-class', condition && 'conditional-class', {
  active: isActive,
  disabled: isDisabled
});

// With component props
function Button({ className, ...props }) {
  return (
    <button className={cn('bg-blue-500 px-4 py-2', className)} {...props} />
  );
}
```

## Custom Class Groups

`tailwind-merge` doesn't recognize custom utility classes defined via Tailwind's `@utility` directive. Use `createCn` to extend the merge behavior with custom class groups.

```ts
// src/lib/cn.ts
import { createCn } from '@perimetre/classnames';

export const cn = createCn({
  extend: {
    classGroups: {
      typography: [
        'typo-heading-1',
        'typo-heading-2',
        'typo-heading-3',
        'typo-small',
        'typo-base'
        // ... other custom typography classes
      ]
    }
  }
});
```

Now conflicting custom classes merge correctly:

```ts
cn('typo-small', 'typo-heading-1');
// Result: 'typo-heading-1'

// Without createCn, both classes would remain:
// 'typo-small typo-heading-1'
```

Call `createCn` once at module level, not inside components.
