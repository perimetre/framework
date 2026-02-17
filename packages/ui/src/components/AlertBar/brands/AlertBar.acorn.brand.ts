import { cva } from '@/lib/cva';

/**
 * Acorn brand AlertBar variants (default/base theme)
 * Uses semantic tokens for themeable properties
 */
export const alertBarAcornVariants = cva({
  base: [
    'pui:flex pui:items-center pui:justify-center pui:gap-2',
    'pui:w-full pui:px-4 pui:py-2',
    'pui:typo-alertbar pui:text-center'
  ],
  variants: {
    variant: {
      first: ['pui:bg-pui-alertbar-first-bg', 'pui:text-pui-alertbar-first-fg'],
      second: [
        'pui:bg-pui-alertbar-second-bg',
        'pui:text-pui-alertbar-second-fg'
      ],
      third: ['pui:bg-pui-alertbar-third-bg', 'pui:text-pui-alertbar-third-fg'],
      fourth: [
        'pui:bg-pui-alertbar-fourth-bg',
        'pui:text-pui-alertbar-fourth-fg'
      ]
    }
  },
  defaultVariants: { variant: 'first' }
});
