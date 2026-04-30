import { cva } from '@/lib/cva';

/**
 * MicroBird School brand button variants
 *
 * Since we now use semantic tokens, the text color override is handled
 * via CSS (--pui-color-interactive-on-primary) in microbird-school/styles.css.
 * No JS overrides needed unless there are structural differences.
 */
export const buttonMicroBirdSchoolVariants = cva({
  base: 'pui:normal-case pui:font-light pui:text-xs pui:lg:text-sm pui:px-5',
  variants: {
    variant: {
      primary: [
        'pui:bg-pui-overlay-12',
        'pui:text-pui-primary-9',
        'pui:hover:bg-pui-primary-9',
        'pui:hover:text-pui-overlay-12'
      ],
      secondary: [
        'pui:bg-black',
        'pui:text-pui-primary-2',
        'pui:hover:bg-black',
        'pui:hover:text-white'
      ],
      outline: [
        'pui:border-pui-button-secondary-outline',
        'pui:text-pui-overlay-12'
      ],
      primaryLight: [
        'pui:text-pui-overlay-12',
        'pui:bg-pui-primary-9',
        'pui:hover:bg-pui-primary-10'
      ]
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
