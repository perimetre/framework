import { cva } from '@/lib/cva';

/**
 * Acorn brand ImageCarouselDotsContainer variant
 */
export const imageCarouselDotsContainerAcornVariants = cva({
  base: [
    'pui:absolute',
    'pui:bottom-4',
    'pui:left-1/2',
    'pui:-translate-x-1/2',
    'pui:flex',
    'pui:gap-1.5',
    'pui:pointer-events-none'
  ]
});
