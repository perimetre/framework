import { cva } from '@/lib/cva';

/**
 * Acorn brand PaginatedCarouselActions variant
 *
 * Container for dots and navigation buttons, positioned below the carousel.
 */
export const paginatedCarouselActionsAcornVariants = cva({
  base: [
    'pui:flex',
    'pui:items-center',
    'pui:justify-center',
    'pui:gap-4',
    'pui:mt-6'
  ]
});
