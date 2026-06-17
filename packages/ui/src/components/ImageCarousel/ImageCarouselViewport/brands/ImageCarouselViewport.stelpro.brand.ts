import { cva } from '@/lib/cva';

/**
 * Stelpro brand ImageCarouselViewport variant.
 *
 * Figma `Main Image` (node 17639:28862 / 29511): a square frame with a 1px
 * `color/border/default` (#e5e5e5) hairline and sharp corners. Overrides the
 * acorn `rounded-lg`.
 */
export const imageCarouselViewportStelproVariants = cva({
  base: [
    'pui:rounded-none',
    'pui:border',
    'pui:border-pui-border-default',
    'pui:aspect-square'
  ]
});
