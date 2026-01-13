import { cva } from '@/lib/cva';

/**
 * Acorn brand ImageCarouselRoot variant
 */
export const imageCarouselRootAcornVariants = cva({
  base: ['pui:relative', 'pui:h-full'],
  variants: {
    layout: {
      default: [],
      'with-thumbnails-bottom': ['pui:flex', 'pui:flex-col'],
      'with-thumbnails-left': ['pui:flex', 'pui:flex-row']
    }
  },
  defaultVariants: {
    layout: 'default'
  }
});
