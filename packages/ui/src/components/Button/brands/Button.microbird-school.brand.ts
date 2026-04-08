import { cva } from '@/lib/cva';

/**
 * MicroBird School brand button variants
 *
 * Since we now use semantic tokens, the text color override is handled
 * via CSS (--pui-color-interactive-on-primary) in microbird-school/styles.css.
 * No JS overrides needed unless there are structural differences.
 */
export const buttonMicroBirdSchoolVariants = cva({
  base: ['pui:normal-case', 'pui:font-light', 'pui:text-[1rem]', 'pui:px-5'],
  variants: {
    variant: {
      primary: [
        'pui:bg-pui-overlay-12',
        'pui:text-pui-primary-9',
        'pui:hover:bg-pui-primary-9',
        'pui:hover:text-pui-overlay-12'
      ],
      outline: [
        'pui:border-pui-button-secondary-outline',
        'pui:text-pui-pui-overlay-12',
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
