import { cva } from '@/lib/cva';

/**
 * Acorn brand button variants (default/base theme)
 * These styles apply when no specific brand is set or when data-pui-brand="acorn"
 *
 * Uses semantic tokens for themeable properties:
 * - bg-pui-interactive-primary: Button background (--pui-color-interactive-primary)
 * - text-pui-interactive-on-primary: Button text (--pui-color-interactive-on-primary)
 * - rounded-pui-button: Button radius (--pui-radius-button)
 * - shadow-pui-button: Button shadow (--pui-shadow-button)
 */
export const buttonAcornVariants = cva({
  base: [
    // Semantic shape tokens - themeable
    'pui:rounded-pui-button',
    // Semantic motion tokens - themeable
    'pui:transition-shadow pui:duration-pui-normal',
    // Structural styles
    'pui:inline-flex pui:items-center pui:justify-center pui:gap-2',
    // Typography
    'pui:leading-[1.335rem] pui:font-bold pui:uppercase'
  ],
  variants: {
    variant: {
      primary: [
        'pui:bg-pui-interactive-primary',
        'pui:text-pui-interactive-on-primary',
        'pui:shadow-pui-button',
        'pui:hover:bg-pui-button-hover'
      ],
      secondary: [
        'pui:bg-pui-overlay-12',
        'pui:text-pui-interactive-on-primary',
        'pui:shadow-pui-button',
        'pui:hover:bg-pui-interactive-primary'
      ],
      outline: [
        'pui:bg-transparent',
        'pui:text-pui-interactive-primary',
        'pui:border',
        'pui:border-pui-interactive-primary',
        'pui:hover:border-pui-overlay-12',
        'pui:hover:text-pui-overlay-12'
      ],
      primaryLight: [
        'pui:text-pui-primary-9',
        'pui:bg-pui-primary-2',
        'pui:hover:bg-pui-primary-10',
        'pui:hover:text-pui-primary-2'
      ]
    },
    size: {
      small: 'pui:px-5 pui:py-1.5 pui:text-base pui:tracking-widest',
      default: 'pui:px-8 pui:py-2.5 pui:text-lg pui:tracking-[0.1125rem]'
    }
  },
  defaultVariants: {
    variant: 'primary',
    size: 'default'
  }
});
