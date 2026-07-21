import { cva } from '@/lib/cva';

/**
 * Acorn brand dropdown trigger variants (default/base theme).
 *
 * Mirrors FieldBaseAutocomplete's input so the acorn dropdown matches the
 * other fields, but consumes dropdown-scoped semantic tokens so brands can
 * theme the dropdown in isolation:
 * - border-pui-dropdown-field-border: rest-state trigger border (acorn = input border)
 * - focus:border-pui-input-border-focus / focus:shadow-pui-input-focus: focus ring
 * - rounded-pui-input, bg-pui-input-bg, text-pui-input-text: shared input tokens
 */
export const fieldBaseDropdownInputAcornVariants = cva({
  base: [
    // Structural styles
    'pui:col-start-1 pui:row-start-1 pui:block pui:w-full pui:cursor-pointer pui:px-3 pui:py-1.5 pui:text-base pui:border pui:border-solid pui:sm:text-sm/6',
    // Semantic: input field colors (rest border is dropdown-scoped)
    'pui:bg-pui-input-bg pui:text-pui-input-text pui:border-pui-dropdown-field-border',
    // Semantic: input radius
    'pui:rounded-pui-input',
    // Semantic: placeholder
    'pui:placeholder:text-pui-input-placeholder',
    // Semantic: focus ring and border
    'pui:focus:outline-none pui:focus:shadow-pui-input-focus pui:focus:border-pui-input-border-focus',
    // Semantic: motion
    'pui:transition-shadow pui:duration-pui-normal',
    // Semantic: disabled state
    'pui:disabled:cursor-not-allowed pui:disabled:bg-pui-bg-subtle pui:disabled:text-pui-fg-subtle pui:disabled:border-pui-bg-subtle'
  ],
  variants: {
    error: {
      false: null,
      true: 'pui:border-pui-feedback-error-strong/50 pui:text-pui-feedback-error/80 pui:placeholder:text-pui-feedback-error-light/70 pui:focus:shadow-[0_0_0_2px_var(--color-pui-feedback-error)]'
    },
    leading: {
      false: null,
      true: 'pui:pl-10'
    },
    trailing: {
      false: null,
      true: 'pui:pr-10'
    }
  }
});

/**
 * Acorn brand dropdown options panel variants.
 *
 * Uses the dropdown-scoped elevation token so brands can swap the panel
 * shadow (e.g. OIQ's hard offset shadow) without touching the shared
 * dropdown shadow used by autocomplete/select.
 * - shadow-pui-dropdown-panel: panel elevation
 * - border-pui-dropdown-border, rounded-pui-dropdown, bg-pui-dropdown-bg
 */
export const fieldBaseDropdownOptionsAcornVariants = cva({
  base: [
    'pui:bg-pui-dropdown-bg pui:border pui:border-solid pui:border-pui-dropdown-border pui:rounded-pui-dropdown pui:shadow-pui-dropdown-panel',
    'pui:mt-1 pui:max-h-60 pui:overflow-auto pui:py-1',
    'pui:empty:invisible'
  ]
});

/**
 * Acorn brand dropdown option item variants.
 *
 * Hover and selected backgrounds are dropdown-scoped tokens: acorn keeps the
 * shared hover and shows selection with weight only (selected-bg defaults to
 * the item background = no fill), while brands override with distinct fills.
 * - data-focus:bg-pui-dropdown-field-item-hover-bg: hover/focus fill
 * - data-selected:bg-pui-dropdown-field-item-selected-bg: selected fill
 */
export const fieldBaseDropdownOptionAcornVariants = cva({
  base: [
    'pui:text-pui-dropdown-text pui:bg-pui-dropdown-item-bg',
    'pui:w-full pui:cursor-pointer pui:select-none pui:px-3 pui:py-2 pui:text-sm',
    'pui:data-focus:bg-pui-dropdown-field-item-hover-bg pui:data-focus:text-pui-dropdown-text-active',
    'pui:data-selected:bg-pui-dropdown-field-item-selected-bg pui:data-selected:font-semibold'
  ]
});
