import { cva } from '@/lib/cva';

/**
 * Acorn brand SectionHorizontalHeader variants (default/base theme)
 */
export const sectionHorizontalHeaderAcornVariants = cva({
  base: ['pui:font-pui-sans pui:space-y-5'],
  variants: {
    variant: {
      h1: [],
      default: [],
      compact: []
    }
  },
  defaultVariants: { variant: 'default' }
});

export const sectionHorizontalHeaderTitleAcornVariants = cva({
  base: [
    'pui:uppercase',
    'pui:font-pui-display',
    'pui:leading-none',
    'pui:tracking-[-1px]'
  ],
  variants: {
    variant: {
      h1: ['pui:text-[6.25rem]'],
      default: ['pui:text-[6.25rem]'],
      compact: [
        'pui:text-[3.75rem]',
        'pui:leading-[105%]',
        'pui:tracking-[-0.6px]'
      ]
    }
  },
  defaultVariants: { variant: 'default' }
});
