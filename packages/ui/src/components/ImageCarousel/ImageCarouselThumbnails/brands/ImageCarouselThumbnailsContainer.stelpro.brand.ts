import { cva } from '@/lib/cva';

/**
 * Stelpro brand ImageCarouselThumbnailsContainer variant.
 *
 * Figma `Button Group` (node 17639:28863): a 5-column grid (`gap-2`,
 * `spacing/sm` = 8) that wraps the 6th+ thumbnail onto the next row, rather than
 * the acorn horizontally-scrolling flex row.
 */
export const imageCarouselThumbnailsContainerStelproVariants = cva({
  base: [],
  variants: {
    orientation: {
      // Figma `Image Group` (node 17639:28861): thumbnails sit 28px below the
      // main image (672→700), in a 5-col grid with an 8px gap.
      horizontal: [
        'pui:grid',
        'pui:grid-cols-5',
        'pui:gap-2',
        'pui:mt-7',
        'pui:overflow-visible'
      ],
      vertical: ['pui:grid', 'pui:grid-cols-1', 'pui:gap-2']
    }
  }
});
