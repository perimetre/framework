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
  base: ['pui:font-pui-display pui:uppercase pui:mb-2'],
  variants: {
    variant: {
      default: ['pui:text-[2.5rem] pui:lg:typo-heading-1'],
      compact: ['pui:text-[2.125rem] pui:lg:typo-heading-2']
    }
  },
  defaultVariants: { variant: 'default' }
});
