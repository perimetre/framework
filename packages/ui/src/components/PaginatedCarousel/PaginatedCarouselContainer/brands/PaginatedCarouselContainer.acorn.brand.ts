import { cva } from '@/lib/cva';

/**
 * Acorn brand PaginatedCarouselContainer variant
 */
export const paginatedCarouselContainerAcornVariants = cva({
  base: ['pui:flex', 'pui:touch-pan-y', 'pui:touch-pinch-zoom', 'pui:-ml-4']
});
