import { cva } from '@/lib/cva';

/**
 * MicroBird Commercial brand button variants
 *
 * Since we now use semantic tokens, the text color override is handled
 * via CSS (--pui-color-interactive-on-primary) in microbird-commercial/styles.css.
 * No JS overrides needed unless there are structural differences.
 */
export const buttonMicroBirdCommercialVariants = cva({
  base: 'pui:normal-case pui:font-light pui:text-xs pui:lg:text-sm pui:px-5',
  variants: {
    variant: {
      primary: [],
      secondary: [
        'pui:bg-black',
        'pui:text-pui-interactive-on-primary',
        'pui:hover:bg-pui-interactive-primary'
      ],
      outline: [
        'pui:border-pui-button-secondary-outline',
        'pui:text-pui-primary-9'
      ],
      primaryLight: []
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
