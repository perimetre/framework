import { cva } from '@/lib/cva';

/**
 * Acorn brand select variants (default/base theme)
 *
 * Reuses the same semantic tokens as FieldBaseInput (input = same purpose: form
 * input field). No primitives; no select-specific tokens. Brands override
 * --pui-color-input-bg, --pui-color-input-border, --pui-radius-input, etc.
 * in CSS, so select and text input stay in sync. appearance-none so the
 * trailing chevron addon can be shown consistently.
 *
 * Semantic tokens used (same as FieldBaseInput; do not add select-only tokens):
 * - bg-pui-input-bg, text-pui-input-text, border-pui-input-border (--pui-color-*)
 * - text-pui-input-placeholder via CSS :has(option[value=""]:checked) (works with uncontrolled inputs)
 * - rounded-pui-input (--pui-radius-input)
 * - shadow-pui-input-focus, border-pui-input-border-focus (focus)
 * - duration-pui-normal (--pui-duration-normal)
 * - bg-pui-bg-subtle, text-pui-fg-subtle (disabled)
 * - feedback-error-* (error state)
 */
export const fieldBaseSelectAcornVariants = cva({
  base: [
    // Structural styles - hardcoded (grid, layout, padding, typography, border)
    'pui:col-start-1 pui:row-start-1 pui:block pui:w-full pui:px-3 pui:py-1.5 pui:text-base pui:border pui:border-solid pui:sm:text-sm/6',
    // Semantic: input field colors (reused from FieldBaseInput – same purpose)
    'pui:bg-pui-input-bg pui:text-pui-input-text pui:border-pui-input-border',
    // Semantic: input radius (reused)
    'pui:rounded-pui-input',
    // Semantic: focus ring and border (reused)
    'pui:focus:outline-none pui:focus:shadow-pui-input-focus pui:focus:border-pui-input-border-focus',
    // Semantic: motion (reused)
    'pui:transition-shadow pui:duration-pui-normal',
    // Semantic: disabled state (reused bg-subtle, fg-subtle)
    'pui:disabled:cursor-not-allowed pui:disabled:bg-pui-bg-subtle pui:disabled:text-pui-fg-subtle pui:disabled:border-pui-bg-subtle',
    // Structural: native select arrow hidden for addon chevron; pointer cursor
    'pui:appearance-none pui:cursor-pointer',
    // Placeholder color when the empty-value option is selected (works with uncontrolled inputs)
    'pui:has-[option[value=""]:checked]:text-pui-input-placeholder'
  ],
  variants: {
    // Semantic: show placeholder color when no value selected (same as text input)
    placeholder: {
      false: null,
      true: 'pui:text-pui-input-placeholder'
    },
    // Semantic: feedback error (reused)
    error: {
      false: null,
      true: 'pui:border-pui-feedback-error-strong/50 pui:text-pui-feedback-error/80 pui:focus:shadow-[0_0_0_2px_var(--color-pui-feedback-error)]'
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
