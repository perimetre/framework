---
title: CVA Configuration and Variant Design Patterns
impact: CRITICAL
impactDescription: governs all component styling and brand composition
tags: cva, variants, tailwind-merge, compose, styling, class-variance-authority
---

## CVA Configuration and Variant Design Patterns

The design system uses CVA (Class Variance Authority) 1.0.0-beta.4 with a custom configuration that integrates `tailwind-merge` for class conflict resolution.

### CVA Setup

The library wraps CVA with a `twMerge` hook:

```typescript
// src/lib/cva/index.ts
import { defineConfig } from 'cva';
import { twMerge } from 'tailwind-merge';

export const { compose, cva, cx } = defineConfig({
  hooks: {
    onComplete: (className) => twMerge(className)
  }
});
```

**Why twMerge?** When brands compose variants via `compose()`, conflicting Tailwind classes must resolve correctly. Without `twMerge`, `bg-pui-interactive-primary` from Acorn and `bg-pui-accent` from Sprig would both appear in the class string. `twMerge` ensures the last one wins.

### Defining Variants

**Correct variant structure:**

```typescript
import { cva } from '@/lib/cva';

export const buttonAcornVariants = cva({
  base: [
    // Group related classes on separate lines for readability
    'pui:bg-pui-interactive-primary pui:text-pui-interactive-on-primary',
    'pui:rounded-pui-button',
    'pui:shadow-pui-button pui:hover:shadow-pui-button-hover',
    'pui:transition-shadow pui:duration-pui-normal',
    'pui:inline-flex pui:items-center pui:justify-center'
  ],
  variants: {
    size: {
      small: 'pui:px-5 pui:py-1.5 pui:text-base pui:tracking-widest',
      default: 'pui:px-8 pui:py-2.5 pui:text-lg pui:tracking-[0.1125rem]'
    },
    variant: {
      primary:
        'pui:bg-pui-interactive-primary pui:text-pui-interactive-on-primary',
      secondary:
        'pui:bg-transparent pui:text-pui-fg-default pui:border pui:border-pui-border-default'
    }
  },
  defaultVariants: {
    size: 'default',
    variant: 'primary'
  }
});
```

**Incorrect patterns:**

```typescript
// WRONG: Using raw Tailwind classes without pui: prefix
export const buttonVariants = cva({
  base: 'bg-blue-500 text-white rounded-lg' // No pui: prefix!
});

// WRONG: Using raw color values
export const buttonVariants = cva({
  base: 'pui:bg-[#3b82f6]' // Hardcoded color!
});

// WRONG: Tokenizing structural properties
export const buttonVariants = cva({
  base: 'pui:display-flex pui:items-center' // display/alignment are structural
});
```

### The compose() Pattern

`compose()` merges CVA configurations. Later values override earlier ones via `twMerge`:

```typescript
import { compose, cva } from '@/lib/cva';

// Base brand defines everything
const acornVariants = cva({
  base: ['pui:bg-pui-interactive-primary pui:text-pui-overlay-12'],
  variants: {
    size: {
      small: 'pui:px-5 pui:py-1.5',
      default: 'pui:px-8 pui:py-2.5'
    }
  }
});

// Override brand specifies only what differs
const sprigVariants = cva({
  base: ['pui:text-pui-overlay-1'] // Override: different text color
  // No 'size' variant needed - inherits from acorn
});

// Compose: sprig gets acorn's structure + its own overrides
const sprigComposed = compose(acornVariants, sprigVariants);
// Result: pui:bg-pui-interactive-primary pui:text-pui-overlay-1 (overlay-12 replaced by overlay-1)
```

**Key compose() rules:**

1. Always put the base brand FIRST: `compose(acornVariants, brandVariants)`
2. The second argument overrides conflicting classes from the first
3. Non-conflicting classes from both are preserved
4. Variant definitions are merged (brand can override specific variant values)

### Extracting Variant Props Type

Always extract variant props from the ACORN base (it defines all possible variants):

```typescript
import type { VariantProps } from 'cva';

export type ButtonVariantProps = VariantProps<typeof buttonAcornVariants>;
// Result: { size?: 'small' | 'default'; variant?: 'primary' | 'secondary' }
```

### Using Variants in Components

```typescript
const Component = ({ size, variant, className, ...props }) => {
  const componentVariants = getBrandVariant(componentBrandVariants);

  return (
    <div className={componentVariants({ size, variant, className })} {...props} />
  );
};
```

- Always pass `className` to the CVA function (not to `cn()` separately)
- CVA + twMerge ensures consumer className overrides work correctly
- Variant props are optional when `defaultVariants` is set

### Compound Variants

Use compound variants for combinations that need special treatment:

```typescript
export const badgeAcornVariants = cva({
  base: ['pui:inline-flex pui:items-center pui:justify-center'],
  variants: {
    size: {
      small: 'pui:px-2 pui:py-0.5 pui:text-xs',
      default: 'pui:px-3 pui:py-1 pui:text-sm'
    },
    variant: {
      default:
        'pui:bg-pui-interactive-primary pui:text-pui-interactive-on-primary',
      outline:
        'pui:border pui:border-pui-border-default pui:text-pui-fg-default'
    }
  },
  compoundVariants: [
    {
      variant: 'outline',
      size: 'small',
      class: 'pui:border-[1.5px]' // Thinner border for small outline badges
    }
  ]
});
```

### When to Add a New Variant

Add a variant when:

- A component needs 2+ visually distinct modes (primary/secondary/destructive)
- Size variations exist with different padding/font-size combinations
- The design system explicitly defines the variant in Figma

Do NOT add a variant when:

- The difference is achievable via `className` override
- It's a one-off usage for a specific consumer
- It would only be used by one brand (use brand override instead)
