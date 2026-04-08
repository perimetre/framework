import { cva } from '@/lib/cva';

/**
 * MicroBird Commercial brand button variants
 *
 * Since we now use semantic tokens, the text color override is handled
 * via CSS (--pui-color-interactive-on-primary) in microbird-commercial/styles.css.
 * No JS overrides needed unless there are structural differences.
 */
export const buttonMicroBirdCommercialVariants = cva({
  base: ['pui:normal-case', 'pui:font-light', 'pui:text-[1rem]', 'pui:px-5'],
  variants: {
    variant: {
      outline: [
        'pui:border-pui-button-secondary-outline',
        'pui:text-pui-primary-9',
        'pui:hover:bg-pui-primary-9',
        'pui:hover:text-pui-interactive-on-primary'
      ],
      primaryLight: ['pui:text-pui-primary-9']
    },
    size: {
      small: '',
      default: 'pui:tracking-[-0.16px]'
    }
  },
  defaultVariants: {
    size: 'default'
  }
});
