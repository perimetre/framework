import { cva } from '@/lib/cva';

/**
 * Acorn brand SectionHorizontalHeader variants (default/base theme)
 */
export const sectionHorizontalHeaderAcornVariants = cva({
  base: [
    'pui:font-pui-sans',
    'pui:justify-between',
    'pui:flex',
    'pui:items-center'
  ],
  variants: {
    variant: {
      h1: [],
      default: []
    }
  },
  defaultVariants: { variant: 'default' }
});
