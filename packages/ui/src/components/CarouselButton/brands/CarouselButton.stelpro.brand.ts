import { cva } from '@/lib/cva';

/**
 * Stelpro brand CarouselButton variant overrides
 */
export const carouselButtonStelproVariants = cva({
  base: [
    'pui:bg-pui-interactive-primary',
    'pui:text-pui-interactive-on-primary',
    'pui:rounded-pui-button',
    'hover:pui:bg-pui-interactive-primary'
  ]
});
