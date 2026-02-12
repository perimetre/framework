import { cva } from '@/lib/cva';

/**
 * Acorn brand autocomplete input variants (default/base theme)
 *
 * Reuses the same semantic tokens as FieldBaseInput/FieldBaseSelect.
 */
export const fieldBaseAutocompleteInputAcornVariants = cva({
  base: [
    // Structural styles
    'pui:col-start-1 pui:row-start-1 pui:block pui:w-full pui:px-3 pui:py-1.5 pui:text-base pui:border pui:border-solid pui:sm:text-sm/6',
    // Semantic: input field colors
    'pui:bg-pui-input-bg pui:text-pui-input-text pui:border-pui-input-border',
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
 * Acorn brand autocomplete options panel variants
 */
export const fieldBaseAutocompleteOptionsAcornVariants = cva({
  base: [
    'pui:bg-pui-dropdown-bg pui:border pui:border-solid pui:border-pui-dropdown-border pui:rounded-pui-dropdown pui:shadow-pui-dropdown',
    'pui:mt-1 pui:max-h-60 pui:overflow-auto pui:py-1',
    'pui:empty:invisible'
  ]
});

/**
 * Acorn brand autocomplete option item variants
 */
export const fieldBaseAutocompleteOptionAcornVariants = cva({
  base: [
    'pui:text-pui-dropdown-text pui:bg-pui-dropdown-item-bg',
    'pui:w-full pui:cursor-pointer pui:select-none pui:px-3 pui:py-2 pui:text-sm',
    'pui:data-focus:bg-pui-dropdown-item-hover-bg pui:data-focus:text-pui-dropdown-text-active',
    'pui:data-selected:font-semibold'
  ]
});
