import { cva } from '@/lib/cva';

/**
 * Acorn brand SectionHorizontalHeader variants (default/base theme)
 */
export const sectionHorizontalHeaderAcornVariants = cva({
  base: ['pui:font-pui-sans pui:space-y-5 pui:text-center pui:lg:text-left'],
  variants: {
    variant: {
      default: [],
      compact: []
    }
  },
  defaultVariants: { variant: 'default' }
});

export const sectionHorizontalHeaderTitleAcornVariants = cva({
  base: ['pui:font-pui-display pui:uppercase'],
  variants: {
    variant: {
      default: ['pui:text-3xl pui:lg:typo-heading-1'],
      compact: ['pui:text-4xl pui:lg:typo-heading-2']
    }
  },
  defaultVariants: { variant: 'default' }
});
