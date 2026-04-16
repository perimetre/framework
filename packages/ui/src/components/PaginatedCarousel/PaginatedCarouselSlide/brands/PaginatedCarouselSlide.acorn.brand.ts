import { cva } from '@/lib/cva';

/**
 * Acorn brand PaginatedCarouselSlide variant
 *
 * Each slide takes ~65% of the viewport so that the previous and next
 * slides peek in on the sides when combined with `align: 'center'`.
 */
export const paginatedCarouselSlideAcornVariants = cva({
  base: ['pui:flex-[0_0_65%]', 'pui:min-w-0', 'pui:pl-4']
});
