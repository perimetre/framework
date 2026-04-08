import { cva } from '@/lib/cva';

/**
 * Acorn brand SectionHorizontalHeader variants (default/base theme)
 */
export const sectionHorizontalHeaderAcornVariants = cva({
  base: ['pui:font-pui-sans pui:space-y-5'],
  variants: {
    variant: {
      default: [],
      compact: []
    }
  },
  defaultVariants: { variant: 'default' }
});

export const sectionHorizontalHeaderTitleAcornVariants = cva({
  base: ['pui:font-pui-display'],
  variants: {
    variant: {
      default: ['pui:typo-heading-1'],
      compact: ['pui:typo-heading-2']
    }
  },
  defaultVariants: { variant: 'default' }
});
