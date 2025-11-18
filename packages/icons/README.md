# @perimetre/icons

Accessible React icon wrapper component for Perimetre projects.

## What it does

Provides a type-safe, accessible wrapper for SVG icons that enforces proper accessibility attributes. Icons must either be hidden from screen readers (`aria-hidden`) or have a descriptive label.

## Why it exists

Ensures all icons in Perimetre projects meet accessibility standards by enforcing at the type level that icons are either decorative (hidden) or meaningful (labeled).

## Installation

```bash
pnpm add @perimetre/icons
```

## Usage

### Creating Icon Components

**IMPORTANT**: Never add `aria-hidden` or `label` to the icon component declaration. These should ALWAYS be provided at the usage site.

```tsx
import Icon, { type IconProps } from '@perimetre/icons';

// ✅ CORRECT: No aria-hidden or label in declaration
const IconEyeOpen: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="currentColor" />
    </svg>
  </Icon>
);

// ❌ WRONG: Don't add aria-hidden in declaration
const IconWrong: React.FC<IconProps> = (props) => (
  <Icon {...props} aria-hidden>
    <svg>...</svg>
  </Icon>
);

// ❌ WRONG: Don't add label in declaration
const IconAlsoWrong: React.FC<IconProps> = (props) => (
  <Icon {...props} label="Settings">
    <svg>...</svg>
  </Icon>
);
```

### Complete Example

Create individual icon components that wrap the base `Icon` component:

```tsx
import Icon, { type IconProps } from '@perimetre/icons';

// Icon component - no accessibility props here
const IconEyeOpen: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <svg
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="currentColor">
        <circle cx="12" cy="14" fill="currentColor" r="5" strokeWidth="0" />
        <path
          d="m22.707,10.293c-.703-.703-1.406-1.315-2.111-1.879l2.016-2.589-1.578-1.229-2.055,2.639c-1.064-.69-2.129-1.223-3.195-1.596l.86-3.082-1.926-.538-.871,3.121c-1.231-.21-2.463-.21-3.694,0l-.871-3.121-1.926.538.86,3.082c-1.066.374-2.131.907-3.195,1.596l-2.055-2.639-1.578,1.229,2.016,2.589c-.704.564-1.408,1.176-2.111,1.879l-.707.707,1.414,1.414.707-.707c6.253-6.253,12.333-6.253,18.586,0l.707.707,1.414-1.414-.707-.707Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  </Icon>
);

export default IconEyeOpen;
```

### Using Icons in Your App

Accessibility props are provided at the usage site, not in the component declaration:

```tsx
import IconEyeOpen from './icons/IconEyeOpen';

// ✅ Decorative icon (next to text) - add aria-hidden at usage
function Button() {
  return (
    <button>
      <IconEyeOpen aria-hidden className="mr-2" />
      View Details
    </button>
  );
}

// ✅ Meaningful icon (icon-only button) - add label at usage
function IconButton() {
  return (
    <button>
      <IconEyeOpen label="View Details" />
    </button>
  );
}

// ✅ With internationalization
function I18nButton() {
  const { t } = useTranslation();
  return (
    <button>
      <IconEyeOpen label={t('view_details')} />
    </button>
  );
}
```

## TypeScript Enforcement

The `IconProps` type enforces accessibility at compile time:

```tsx
// ✅ Valid: aria-hidden is true
<MyIcon aria-hidden />

// ✅ Valid: label is provided
<MyIcon label="Settings" />

// ❌ TypeScript error: Must provide either aria-hidden or label
<MyIcon />

// ❌ TypeScript error: aria-hidden false requires a label
<MyIcon aria-hidden={false} />
```

## Best Practices

### 1. Optimize SVGs Before Creating Components

Before creating icon components, optimize your SVG files using [SVGOMG](https://svgomg.net/) or [svgo](https://github.com/svg/svgo):

```bash
# Using svgo CLI
pnpm add -g svgo
svgo input.svg -o output.svg
```

This removes unnecessary metadata, comments, and redundant attributes, resulting in smaller file sizes and cleaner code.

### 2. Use `currentColor` for Icon Colors

Prefer `currentColor` in your SVG `fill` and `stroke` attributes so icons inherit the text color from their parent:

```tsx
// ✅ Good: Icon color follows text color
<svg>
  <path fill="currentColor" d="..." />
</svg>

// ❌ Avoid: Hard-coded colors
<svg>
  <path fill="#000000" d="..." />
</svg>
```

This allows icons to automatically adapt to different themes, states (hover, active), and contexts without additional styling.

### 3. Choose Between Decorative and Meaningful

**Use `aria-hidden` when:**

- Icon is purely decorative
- Icon is accompanied by visible text
- Icon doesn't convey unique information

**Use `label` when:**

- Icon is the only visual element (e.g., icon-only button)
- Icon conveys meaning not present in surrounding text
- Icon serves as an interactive control

### 4. Consistent Icon Sizing

Use consistent sizing utilities from your design system:

```tsx
<MyIcon aria-hidden className="h-4 w-4" />  // Small
<MyIcon aria-hidden className="h-6 w-6" />  // Medium
<MyIcon aria-hidden className="h-8 w-8" />  // Large
```

## Framework Compatibility

This package works with any React-based framework:

- ✅ Next.js
- ✅ Vite
- ✅ Astro (with React integration)
- ✅ Remix
- ✅ Create React App

No bundling configuration needed - your project's bundler will handle the JSX transformation.

## TypeScript Support

This package includes full TypeScript definitions with strict accessibility type checking.
