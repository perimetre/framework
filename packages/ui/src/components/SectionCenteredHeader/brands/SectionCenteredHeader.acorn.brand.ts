import { cva } from '@/lib/cva';

/**
 * Acorn brand SectionCenteredHeader variants (default/base theme)
 */
export const sectionCenteredHeaderAcornVariants = cva({
  base: ['pui:text-center pui:font-pui-sans pui:space-y-5'],
  variants: {
    variant: {
      default: [],
      h1: []
    }
  },
  defaultVariants: { variant: 'default' }
});

export const sectionCenteredHeaderTitleAcornVariants = cva({
  base: ['pui:font-pui-display'],
  variants: {
    variant: {
      default: ['pui:typo-heading-2'],
      h1: ['pui:typo-heading-1']
    }
  },
  defaultVariants: { variant: 'default' }
});
