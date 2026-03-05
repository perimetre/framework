import { cva } from '@/lib/cva';

/**
 * Sprig brand FieldCheckboxRadio variant overrides
 */
export const fieldCheckboxRadioSprigVariants = cva({
  base: [],
  variants: {
    type: {
      // Use 1px borders for Sprig checkboxes
      checkbox: 'pui:border pui:size-4.5',
      radio: ''
    },
    variant: {
      // Sprig checkboxes are filled when checked
      default: [
        'pui:checked:bg-pui-control-checked-bg',
        // Match border to bg so the border is invisible on the filled radio
        'pui:checked:border-pui-control-checked-bg'
      ],
      inverted: [
        'pui:checked:bg-pui-control-unchecked-bg',
        'pui:checked:border-pui-control-checked-border-inverted'
      ]
    }
  },
  compoundVariants: [
    {
      // Indeterminate styles only apply to checkboxes — see acorn brand for rationale.
      type: 'checkbox',
      variant: 'default',
      class:
        'pui:indeterminate:bg-pui-control-checked-bg pui:indeterminate:border-pui-control-checked-border'
    },
    {
      type: 'checkbox',
      variant: 'inverted',
      class:
        'pui:indeterminate:bg-pui-control-unchecked-bg pui:indeterminate:border-pui-control-checked-border-inverted'
    }
  ]
});

export const fieldCheckboxRadioBoxSprigVariants = cva({
  base: ['pui:size-4.5']
});

export const fieldCheckboxRadioCheckboxIconSprigVariants = cva({
  base: ['pui:size-4.5', 'pui:group-has-disabled:text-pui-fg-subtle'],
  variants: {
    variant: {
      default: ['pui:text-pui-control-checkmark'],
      inverted: ['pui:text-pui-control-checkmark-inverted']
    }
  }
});

export const fieldCheckboxRadioRadioIconSprigVariants = cva({
  base: [],
  variants: {
    variant: {
      // Sprig default radios are filled green when checked.
      // The dot needs to be white (checkmark) to contrast against the green background.
      default: ['before:pui:bg-pui-control-checkmark'],
      // Sprig inverted radios have a white bg (unchecked-bg) with green border.
      // The dot needs to be green (checked-bg) to contrast against the white background.
      inverted: ['before:pui:bg-pui-control-checked-bg']
    }
  }
});
