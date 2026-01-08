import { cva } from '@/lib/cva';

/**
 * Sprig brand ImageCarouselNavButton variant overrides
 */
export const imageCarouselNavButtonSprigVariants = cva({
  base: [
    'pui:bg-pui-interactive-primary',
    'pui:text-pui-interactive-on-primary',
    'hover:pui:bg-pui-interactive-primary'
  ]
});
