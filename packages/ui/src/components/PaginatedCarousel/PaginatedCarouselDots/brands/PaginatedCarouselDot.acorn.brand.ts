import { cva } from '@/lib/cva';

/**
 * Acorn brand PaginatedCarouselDot variant
 *
 * Uses semantic primary color tokens so brand overrides happen automatically.
 */
export const paginatedCarouselDotAcornVariants = cva({
  base: [
    'pui:rounded-full',
    'pui:transition-all',
    'pui:duration-200',
    'pui:cursor-pointer'
  ],
  variants: {
    selected: {
      false: 'pui:w-2 pui:h-2 pui:bg-pui-overlay-7 hover:pui:bg-pui-overlay-9',
      true: 'pui:w-2.5 pui:h-2.5 pui:bg-pui-primary-9'
    }
  }
});
