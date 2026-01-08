import { cva } from '@/lib/cva';

/**
 * Stelpro brand ImageCarouselNavButton variant overrides
 */
export const imageCarouselNavButtonStelproVariants = cva({
  base: [
    'pui:bg-pui-interactive-primary',
    'pui:text-pui-interactive-on-primary',
    'pui:rounded-pui-button',
    'hover:pui:bg-pui-interactive-primary'
  ]
});
