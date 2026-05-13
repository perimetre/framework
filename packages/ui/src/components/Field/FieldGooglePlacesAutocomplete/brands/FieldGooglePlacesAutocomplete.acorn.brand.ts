import { cva } from '@/lib/cva';

/**
 * Acorn brand FieldGooglePlacesAutocomplete container variants (default/base theme).
 *
 * Layered on top of `inputVariants` from FieldBaseInput — captures the overlay
 * styling that is specific to this component (the real input lives inside the
 * gmp-place-autocomplete shadow DOM, so we use `focus-within:*` rather than
 * `focus:*` for the outer container).
 *
 * Semantic tokens used (brand-overridable via CSS):
 * - bg-pui-bg-subtle / text-pui-fg-subtle / border-pui-bg-subtle (disabled)
 * - border-pui-input-border-focus (focus-within border)
 * - shadow-pui-input-focus (focus-within ring)
 * - color-pui-feedback-error (error focus-within ring)
 */
export const fieldGooglePlacesAutocompleteAcornVariants = cva({
  base: ['pui:flex pui:items-center'],
  variants: {
    disabled: {
      false: null,
      true: 'pui:cursor-not-allowed pui:bg-pui-bg-subtle pui:text-pui-fg-subtle pui:border-pui-bg-subtle'
    },
    error: {
      false: null,
      true: null
    }
  },
  compoundVariants: [
    {
      disabled: false,
      error: false,
      class:
        'pui:focus-within:outline-none pui:focus-within:border-pui-input-border-focus pui:focus-within:shadow-pui-input-focus'
    },
    {
      disabled: false,
      error: true,
      class:
        'pui:focus-within:outline-none pui:focus-within:border-pui-input-border-focus pui:focus-within:shadow-[0_0_0_2px_var(--color-pui-feedback-error)]'
    }
  ],
  defaultVariants: {
    disabled: false,
    error: false
  }
});
