import { cva } from '@/lib/cva';

/**
 * Sprig brand ImageCarouselNavButton variant overrides
 */
export const imageCarouselNavButtonSprigVariants = cva({
  base: [
    'pui:bg-white',
    'pui:text-pui-interactive-primary',
    'hover:pui:bg-gray-50',
    'disabled:hover:pui:bg-white'
  ]
});
