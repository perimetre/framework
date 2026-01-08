import { cva } from '@/lib/cva';

/**
 * Acorn brand ImageCarouselContainer variant
 */
export const imageCarouselContainerAcornVariants = cva({
  base: [
    'pui:flex',
    'pui:touch-pan-y',
    'pui:touch-pinch-zoom',
    'pui:-ml-4',
    'pui:h-full'
  ]
});
