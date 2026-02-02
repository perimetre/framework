import { cva } from '@/lib/cva';

/**
 * Acorn brand FieldCheckboxRadio variants (default/base theme)
 */
export const fieldCheckboxRadioAcornVariants = cva({
  base: [
    // Structural styles
    'pui:appearance-none pui:border-2 pui:border-solid',
    // Default colors
    'pui:border-pui-control-unchecked-border pui:bg-pui-control-unchecked-bg',
    // Focus state
    'pui:focus-visible:outline-none pui:focus-visible:shadow-pui-input-focus',
    // Disabled state
    'pui:disabled:cursor-not-allowed pui:disabled:border-pui-control-unchecked-border pui:disabled:bg-pui-bg-subtle',
    // Disabled checked/indeterminate state - override checked colors with gray
    'pui:disabled:checked:border-pui-control-unchecked-border pui:disabled:indeterminate:border-pui-control-unchecked-border',
    // Accessibility
    'forced-colors:pui:appearance-auto'
  ],
  variants: {
    type: {
      checkbox: '',
      radio: ''
    },
    variant: {
      default: [
        // Primary icon on white/transparent background (not filled)
        'pui:checked:border-pui-control-checked-border',
        'pui:indeterminate:border-pui-control-checked-border'
      ],
      inverted: [
        // Icon on primary background (filled)
        'pui:checked:border-pui-control-checked-border-inverted pui:checked:bg-pui-control-checked-bg',
        'pui:indeterminate:border-pui-control-checked-border-inverted pui:indeterminate:bg-pui-control-checked-bg',
        'pui:disabled:checked:bg-pui-bg-subtle'
      ]
    }
  },
  defaultVariants: {
    variant: 'default'
  }
});

export const fieldCheckboxRadioBoxAcornVariants = cva({
  base: ['pui:group pui:grid pui:grid-cols-1 pui:size-4']
});

export const fieldCheckboxRadioCheckboxIconAcornVariants = cva({
  base: [
    // Structural styles
    'pui:pointer-events-none pui:col-start-1 pui:row-start-1 pui:size-3.5 pui:self-center pui:justify-self-center'
  ],
  variants: {
    variant: {
      default: [
        // Primary color icon
        'pui:stroke-pui-control-checkmark',
        'pui:group-has-disabled:stroke-pui-fg-subtle'
      ],
      inverted: [
        // Inverted icon
        'pui:stroke-pui-control-checkmark-inverted',
        'pui:group-has-disabled:stroke-pui-fg-subtle'
      ]
    }
  },
  defaultVariants: {
    variant: 'default'
  }
});

export const fieldCheckboxRadioRadioIconAcornVariants = cva({
  base: [
    // Inner dot structural styles
    'before:pui:content-[""] before:pui:absolute before:pui:rounded-full',
    // Hide when not checked, show when checked (using custom utility)
    'before:pui:hidden pui:checked:before:block',
    // Accessibility
    'forced-colors:before:pui:hidden'
  ],
  variants: {
    variant: {
      default: [
        // Primary color dot - 10px dot centered in 16px circle
        'before:pui:inset-[3px]',
        'before:pui:bg-pui-control-checked-bg'
      ],
      inverted: [
        // Inverted dot - 10px dot for filled background
        'before:pui:inset-[3px]',
        'before:pui:bg-pui-control-checkmark-inverted',
        'pui:disabled:checked:before:bg-pui-fg-subtle'
      ]
    }
  },
  defaultVariants: {
    variant: 'default'
  }
});
