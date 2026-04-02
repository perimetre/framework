import { cva } from '@/lib/cva';

/**
 * Acorn brand SectionHorizontalHeader variants (default/base theme)
 */
export const sectionHorizontalHeaderAcornVariants = cva({
  base: ['pui:font-pui-sans'],
  variants: {
    variant: {
      h1: [],
      default: []
    }
  },
  defaultVariants: { variant: 'default' }
});
