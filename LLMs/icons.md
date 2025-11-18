# Icon Implementation Guide for LLMs

**Purpose**: Guide for implementing accessible, production-ready icons in Perimetre applications.

## Core Principles

1. **Never use `<Image>` for static SVG icons** - Reserved only for CMS/dynamic content (`src={data.image}`)
2. **Always use `currentColor`** - Enables theme-aware, contextual coloring
3. **Optimize before implementing** - Use [SVGOMG](https://svgomg.net/) to reduce file size
4. **Enforce accessibility** - TypeScript requires either `aria-hidden` or `label`

## Quick Reference

```tsx
// ✅ Decorative icon (with visible text)
<button>
  <IconCheck aria-hidden className="mr-2" />
  Save Changes
</button>

// ✅ Meaningful icon (icon-only button)
<button>
  <IconTrash label="Delete item" />
</button>

// ❌ NEVER - Static SVG in Image component
<Image src="/icons/check.svg" />

// ✅ ONLY for dynamic CMS images
<Image src={data.iconUrl} />
```

## Implementation Steps

### 1. Optimize SVG

Use https://svgomg.net/ with these settings:

- Remove `width`/`height` attributes (keep `viewBox`)
- Remove colors → Replace with `currentColor`
- Remove unnecessary groups
- Precision: 2-3 decimals

**Before:**

```svg
<svg width="24" height="24" fill="#000000">
  <path d="..." stroke="#333" />
</svg>
```

**After:**

```svg
<svg viewBox="0 0 24 24">
  <path d="..." fill="currentColor" stroke="currentColor" />
</svg>
```

### 2. Create Icon Component

**File**: `src/components/icons/IconName.tsx`

```tsx
import Icon, { type IconProps } from '@perimetre/icons';

const IconName: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="..." fill="currentColor" />
    </svg>
  </Icon>
);

export default IconName;
```

**Key points:**

- Use PascalCase: `IconCheckCircle`, `IconArrowLeft`
- Always accept `IconProps` from `@perimetre/icons`
- ALWAYS Spread `{...props}` onto `<Icon>`
- SVG must use `currentColor` for fills/strokes

### 3. Usage Patterns

#### Decorative Icons (with text)

```tsx
<button className="flex items-center">
  <IconPlus aria-hidden className="mr-2 h-4 w-4" />
  Add Item
</button>
```

#### Meaningful Icons (standalone)

```tsx
<button aria-label="Close dialog">
  <IconX label="Close" className="h-6 w-6" />
</button>
```

#### Contextual Colors

```tsx
// Success state
<IconCheck aria-hidden className="text-green-600" />

// Error state
<IconAlert aria-hidden className="text-red-500" />

// Hover effect
<button className="text-gray-600 hover:text-blue-600">
  <IconEdit label="Edit" />
</button>
```

## File Organization

```
src/components/icons/
├── monotone/          # Single-color icons using currentColor
│   ├── IconCheck.tsx
│   ├── IconX.tsx
│   └── IconArrowRight.tsx
└── multicolor/        # Multi-color icons (brand logos, illustrations)
    ├── LogoGoogle.tsx
    └── LogoBrand.tsx
```

**Monotone** (90% of cases): Support `currentColor`, themeable
**Multicolor** (10% of cases): Brand compliance, fixed colors

Import icons directly from their files:

```tsx
import IconCheck from '@/components/icons/monotone/IconCheck';
import LogoBrand from '@/components/icons/multicolor/LogoBrand';
```

## When NOT to Use `currentColor`

1. **Brand logos** with strict color guidelines
2. **Multi-color illustrations** where colors convey meaning
3. **CMS/user-uploaded content** (use `<Image>`)

Example multicolor icon:

```tsx
const LogoBrand: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <svg viewBox="0 0 100 100">
      {/* Specific brand colors required */}
      <path fill="#FF5733" d="..." />
      <path fill="#3498DB" d="..." />
    </svg>
  </Icon>
);
```

## TypeScript Enforcement

The package enforces accessibility at compile-time:

```tsx
// ✅ Valid
<MyIcon aria-hidden />
<MyIcon label="Description" />

// ❌ TypeScript error - Missing accessibility prop
<MyIcon />

// ❌ TypeScript error - aria-hidden=false requires label
<MyIcon aria-hidden={false} />
```

## Common Patterns

### Icon with tooltip

```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>
      <IconInfo label="More information" className="h-4 w-4" />
    </TooltipTrigger>
    <TooltipContent>Additional details here</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Loading states

```tsx
{
  isLoading ? (
    <IconSpinner aria-hidden className="animate-spin" />
  ) : (
    <IconCheck aria-hidden className="text-green-600" />
  );
}
```

### Icon buttons

```tsx
<button
  onClick={handleDelete}
  className="text-gray-500 transition-colors hover:text-red-600"
>
  <IconTrash label="Delete item" className="h-5 w-5" />
</button>
```

## Production Checklist

- [ ] SVG optimized via SVGOMG
- [ ] All colors replaced with `currentColor` (if monotone)
- [ ] Component accepts `IconProps`
- [ ] Props spread onto `<Icon>` wrapper
- [ ] Either `aria-hidden` or `label` provided at usage
- [ ] Placed in correct directory (`monotone/` or `multicolor/`)

## Icon Libraries

Suggested existing icon libraries:

- **Heroicons**: https://heroicons.com/
- **Radix Icons**: https://www.radix-ui.com/icons
- **Lucide**: https://lucide.dev/

## Additional Resources

- Full documentation: `packages/icons/README.md`
- TypeScript types: `@perimetre/icons`
