---
title: Component File Structure and Brand Variant Composition
impact: CRITICAL
impactDescription: ensures consistent component architecture across the library
tags: component, structure, brands, variants, props, cva, composition
---

## Component File Structure and Brand Variant Composition

Every component in `@perimetre/ui` follows the same file structure and composition pattern. Deviating from this pattern breaks brand switching and type safety.

### Required File Structure

```
src/components/ComponentName/
├── index.tsx                              # Main component (brand-agnostic)
├── ComponentName.stories.tsx              # Ladle stories
└── brands/
    ├── index.ts                           # Brand variants registry
    ├── ComponentName.acorn.brand.ts       # Base brand (REQUIRED)
    ├── ComponentName.sprig.brand.ts       # Optional overrides
    └── ComponentName.stelpro.brand.ts     # Optional overrides
```

### The Main Component (index.tsx)

The component itself is brand-agnostic. It delegates all styling to the active brand's variant:

**Correct:**

```tsx
import { getBrandVariant } from '@/lib/brand-registry';
import { Slot } from 'radix-ui';
import { componentBrandVariants, type ComponentVariantProps } from './brands';

export type ComponentProps = {
  asChild?: boolean;
} & ComponentVariantProps &
  React.ComponentProps<'div'>;

const Component: React.FC<PropsWithChildren<ComponentProps>> = ({
  asChild,
  children,
  className,
  variant,
  size,
  ...props
}) => {
  const Comp = asChild ? Slot.Slot : 'div';
  const componentVariants = getBrandVariant(componentBrandVariants);

  return (
    <Comp
      className={componentVariants({ variant, size, className })}
      {...props}
    >
      {children}
    </Comp>
  );
};

export default Component;
```

Key patterns:

- `getBrandVariant()` retrieves the correct CVA function for the active brand
- Props extend both `ComponentVariantProps` (from CVA) and `React.ComponentProps<'element'>`
- `className` is passed to CVA for merging via `twMerge`
- `asChild` enables Radix Slot composition
- Component has zero hardcoded brand-specific styles

**Incorrect:**

```tsx
// WRONG: Hardcoding brand-specific styles
const Button = ({ className, ...props }) => {
  return (
    <button className={cn('rounded-full bg-blue-500', className)} {...props} />
  );
};

// WRONG: Using React Context for brand
const Button = () => {
  const { brand } = useBrandContext(); // Don't use Context
  // ...
};

// WRONG: Conditional brand logic in component
const Button = ({ brand }) => {
  const bg = brand === 'sprig' ? 'bg-green-500' : 'bg-teal-500'; // No!
};
```

### The Brand Variants Registry (brands/index.ts)

```tsx
import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { componentAcornVariants } from './Component.acorn.brand';
import { componentSprigVariants } from './Component.sprig.brand';
import { componentStelproVariants } from './Component.stelpro.brand';
import type { VariantProps } from 'cva';

export type ComponentVariantProps = VariantProps<typeof componentAcornVariants>;

export const componentBrandVariants = {
  acorn: componentAcornVariants,
  sprig: compose(componentAcornVariants, componentSprigVariants),
  stelpro: compose(componentAcornVariants, componentStelproVariants)
} as const satisfies BrandVariants<typeof componentAcornVariants>;
```

Key patterns:

- `acorn` is always the base, never composed with itself
- Other brands use `compose(acornVariants, brandVariants)` to inherit + override
- `satisfies BrandVariants<T>` provides type safety (acorn is required, others optional)
- Variant props type is extracted from the acorn base

### The Acorn Base (ComponentName.acorn.brand.ts)

Contains ALL structural and default styles:

```tsx
import { cva } from '@/lib/cva';

export const componentAcornVariants = cva({
  base: [
    // Tokenized appearance (changes between brands)
    'pui:bg-pui-interactive-primary pui:text-pui-interactive-on-primary',
    'pui:rounded-pui-button',
    'pui:shadow-pui-button pui:hover:shadow-pui-button-hover',
    'pui:transition-shadow pui:duration-pui-normal',
    // Structural (never changes - hardcoded)
    'pui:inline-flex pui:items-center pui:justify-center',
    // Typography tokens
    'pui:leading-[1.335rem] pui:font-bold pui:uppercase'
  ],
  variants: {
    size: {
      small: 'pui:px-5 pui:py-1.5 pui:text-base pui:tracking-widest',
      default: 'pui:px-8 pui:py-2.5 pui:text-lg pui:tracking-[0.1125rem]'
    }
  }
});
```

### Brand Override Files (ComponentName.brand.brand.ts)

Only specify what DIFFERS from Acorn:

```tsx
// Button.sprig.brand.ts - only overrides text color
import { cva } from '@/lib/cva';

export const buttonSprigVariants = cva({
  base: ['pui:text-pui-overlay-1'] // Different text color for Sprig
});
```

If a brand has NO differences for a component, the file can export an empty CVA:

```tsx
export const buttonStelproVariants = cva({
  base: ['pui:text-pui-overlay-5']
});
```

### Props Patterns

**Always extend native HTML element props:**

```tsx
export type ButtonProps = {
  asChild?: boolean;
} & ButtonVariantProps &
  React.ComponentProps<'button'>;
```

**For form components, use detailed HTML props:**

```tsx
export type FieldInputProps = {
  containerClassName?: string;
  leadingAddon?: React.ReactNode;
  trailingAddon?: React.ReactNode;
} & React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>;
```

**Accept `className` and merge it:**

```tsx
// className is passed to CVA which merges via twMerge
<Comp className={variants({ size, className })} {...props}>
```

This ensures consumers can always override styles with their own classes, and `twMerge` resolves conflicts correctly.

### Composite Components

For components with multiple sub-components (like form fields), organize as:

```
src/components/Field/
├── FieldInput/
│   ├── index.tsx
│   └── brands/...
├── FieldLabel/
│   ├── index.tsx
│   └── brands/...
├── FieldError/
│   └── index.tsx
└── FieldContainer/
    └── index.tsx
```

Each sub-component is independently styled and exported. The parent composes them:

```tsx
const FieldInput = ({ label, error, hint, ...inputProps }) => {
  return (
    <FieldContainer>
      <FieldLabel>{label}</FieldLabel>
      <FieldBaseInput {...inputProps} />
      {error && <FieldError>{error}</FieldError>}
      {hint && <FieldHint>{hint}</FieldHint>}
    </FieldContainer>
  );
};
```
