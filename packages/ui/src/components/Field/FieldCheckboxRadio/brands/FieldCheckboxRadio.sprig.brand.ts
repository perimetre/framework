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
        'pui:indeterminate:bg-pui-control-checked-bg',
        'pui:checked:border-pui-control-checked-border',
        'pui:indeterminate:border-pui-control-checked-border'
      ],
      inverted: [
        'pui:checked:bg-pui-control-unchecked-bg',
        'pui:indeterminate:bg-pui-control-unchecked-bg',
        'pui:checked:border-pui-control-checked-border-inverted',
        'pui:indeterminate:border-pui-control-checked-border-inverted'
      ]
    }
  }
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
  base: []
});
