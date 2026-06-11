import { cva } from '@/lib/cva';

/**
 * Stelpro brand ImageCarouselControls variant.
 *
 * Fades the prev/next controls in on hover of the carousel viewport — same
 * behavior the PDP gallery had before the refactor (arrows revealed on hover).
 */
export const imageCarouselControlsStelproVariants = cva({
  base: [
    // Figma `Button/Controls` insets: ~18px from the edge on mobile
    // (node 17639:29520), ~30px on desktop (node 17639:28871). Overrides the
    // acorn `px-4`.
    'pui:px-[18px]',
    'lg:pui:px-[30px]',
    'pui:opacity-0',
    'pui:transition-opacity',
    'pui:duration-200',
    'pui:ease-out',
    'pui:group-hover/imageCarousel:opacity-100',
    'pui:motion-reduce:transition-none'
  ]
});
