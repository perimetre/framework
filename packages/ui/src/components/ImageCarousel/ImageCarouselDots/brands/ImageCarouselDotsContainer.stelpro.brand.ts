import { cva } from '@/lib/cva';

/**
 * Stelpro brand ImageCarouselDotsContainer variant.
 *
 * Figma `Product Section` (node 17639:29523): the pagination sits **below** the
 * image, centered, rather than overlaid on it. Overrides the acorn absolute
 * `bottom-4` placement with static, top-margined, centered layout.
 */
export const imageCarouselDotsContainerStelproVariants = cva({
  base: [
    'pui:static',
    'pui:left-auto',
    'pui:translate-x-0',
    // Figma `Section` (node 17639:29509): dots sit 32px below the image.
    'pui:mt-8',
    'pui:w-full',
    'pui:justify-center',
    // Figma `Dot Container`: 8px between dots.
    'pui:gap-2',
    'pui:items-center'
  ]
});
