---
title: Accessibility Patterns for Design System Components
impact: HIGH
impactDescription: ensures WCAG 2.2 compliance and inclusive user experience
tags: accessibility, a11y, aria, keyboard, focus, wcag, form, radix
---

## Accessibility Patterns for Design System Components

Every component in `@perimetre/ui` must be accessible. Use Radix UI primitives for complex interactive patterns. Implement proper ARIA attributes, keyboard navigation, and focus management.

### Core Principles

1. **Use native HTML elements first.** A `<button>` is better than a `<div role="button">`.
2. **No ARIA is better than bad ARIA.** Only add ARIA when HTML semantics aren't sufficient.
3. **Use Radix primitives for complex patterns.** Dialog, Accordion, Tabs, etc. implement APG patterns correctly.
4. **Test with keyboard only.** If you can't use it without a mouse, it's not accessible.

### Focus Management

**Focus rings via token:**

```tsx
// All interactive elements use the tokenized focus ring
'pui:focus-visible:shadow-pui-input-focus';

// The token resolves to a visible focus ring per brand
// e.g., 0 0 0 3px rgba(59, 130, 246, 0.15)
```

**Rules:**

- Use `focus-visible` (not `focus`) to avoid showing rings on mouse clicks
- The focus ring must have sufficient contrast (WCAG 2.2 Focus Appearance)
- Focus rings use the `--pui-shadow-input-focus` token for consistency

### Form Field Accessibility

**FieldInput pattern:**

```tsx
const FieldInput = ({
  label,
  error,
  hint,
  description,
  required,
  id,
  ...inputProps
}) => {
  const inputId = id || useId();
  const errorId = error ? `${inputId}-error` : undefined;
  const descId = description ? `${inputId}-desc` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <FieldContainer>
      <FieldLabel htmlFor={inputId} required={required}>
        {label}
      </FieldLabel>
      {description && (
        <FieldDescription id={descId}>{description}</FieldDescription>
      )}
      <FieldBaseInput
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [errorId, hintId, descId].filter(Boolean).join(' ') || undefined
        }
        required={required}
        {...inputProps}
      />
      {error && <FieldError id={errorId}>{error}</FieldError>}
      {hint && <FieldHint id={hintId}>{hint}</FieldHint>}
    </FieldContainer>
  );
};
```

**Key patterns:**

- `aria-invalid` set when error exists
- `aria-describedby` links to error, hint, and description elements
- `htmlFor` connects label to input
- Required indicator shown visually AND communicated to screen readers

### Checkbox and Radio Accessibility

**FieldCheckboxRadio pattern:**

```tsx
const FieldCheckboxRadio = ({ type, indeterminate, disabled, ...props }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate ?? false;
    }
  }, [indeterminate]);

  return (
    <div className="pui:group pui:grid pui:grid-cols-1">
      <input
        ref={inputRef}
        type={type}
        disabled={disabled}
        className="pui:appearance-none pui:border-2 pui:border-solid"
        {...props}
      />
      {/* SVG visuals respond to :checked/:indeterminate via group-has variants */}
      <svg aria-hidden className="pui:pointer-events-none" />
    </div>
  );
};
```

**Key patterns:**

- Keep a real native `<input>` in the DOM as the interactive control
- Style state with `:checked`, `:indeterminate`, `:disabled` and group-has utilities
- Decorative SVG/icon layers should be `aria-hidden`
- `indeterminate` state supported for three-state checkboxes
- `disabled` state properly styled and communicated
- Ensure associated label text still exists at usage sites (`htmlFor`/`id` or wrapping label)

### Button Accessibility

```tsx
const Button = ({ asChild, children, disabled, ...props }) => {
  const Comp = asChild ? Slot.Slot : 'button';

  return (
    <Comp
      disabled={disabled}
      // type="button" by default (not "submit") for safety
      type={props.type || 'button'}
      {...props}
    >
      {children}
    </Comp>
  );
};
```

**When using `asChild` with links:**

```tsx
// Consumer must ensure the link has proper accessible content
<Button asChild>
  <a href="/page" aria-label="Go to page">
    <ArrowIcon /> {/* Icon-only needs aria-label */}
  </a>
</Button>
```

### Interactive Component Patterns (via Radix)

For complex interactive components, use Radix primitives:

**Dialog (Drawer in the system):**

```tsx
import * as Dialog from 'radix-ui/dialog';

// Radix handles:
// - Focus trap within dialog
// - Escape key closes
// - aria-modal="true"
// - Focus returns to trigger on close
// - Proper role="dialog"
```

### Touch Target Requirements

WCAG 2.2 mandates minimum 24x24 CSS pixel touch targets:

```tsx
// Ensure interactive elements meet minimum size
// Buttons: padding ensures sufficient size
'pui:px-8 pui:py-2.5'; // Default size exceeds 24x24

// Small variants should still meet minimum
'pui:px-5 pui:py-1.5'; // With text, still meets 24px height

// Checkboxes/radios: custom visual must be at least 24x24
'pui:size-5'; // 20px - supplemented by padding on the label
```

### Color Contrast

Tokens must maintain sufficient contrast ratios:

- **Normal text**: 4.5:1 contrast ratio (WCAG AA)
- **Large text** (18px+ or 14px+ bold): 3:1 contrast ratio
- **Interactive elements**: 3:1 against adjacent colors
- **Focus indicators**: 3:1 against the background

When creating brand tokens, verify contrast:

```css
/* These pairs must maintain 4.5:1+ contrast */
--pui-color-fg-default     against  --pui-color-bg-default
--pui-color-interactive-on-primary  against  --pui-color-interactive-primary
--pui-color-feedback-error-strong   against  --pui-color-feedback-error-light
```

### Reduced Motion

Components with animations must respect user preferences:

```tsx
// The duration-pui-normal token can be set to 0ms in reduced-motion themes
// Additionally, use Tailwind's built-in support:
'pui:motion-reduce:pui:transition-none';
'pui:motion-reduce:pui:duration-0';
```

### Accessibility Checklist for New Components

- [ ] Interactive elements use semantic HTML (`<button>`, `<a>`, `<input>`)
- [ ] Focus ring visible via `focus-visible:shadow-pui-input-focus`
- [ ] Keyboard navigation works (Tab, Enter, Space, Escape as appropriate)
- [ ] Touch targets meet 24x24px minimum
- [ ] Form elements have labels connected via `htmlFor`/`id`
- [ ] Error states use `aria-invalid` and `aria-describedby`
- [ ] Icon-only buttons have `aria-label`
- [ ] Color contrast meets WCAG AA ratios
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Complex interactions use Radix primitives (not custom implementations)
- [ ] Disabled state is both visually indicated AND communicated to assistive tech
