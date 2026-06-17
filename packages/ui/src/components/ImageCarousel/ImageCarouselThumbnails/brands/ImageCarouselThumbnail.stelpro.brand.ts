import { cva } from '@/lib/cva';

/**
 * Stelpro brand ImageCarouselThumbnail variant overrides.
 *
 * Figma `Thumbnail` (node 17639:28864…): a square cell with a 1px
 * `color/border/default` (#e5e5e5) hairline and sharp corners. The thumbnail
 * fills its grid cell (the container is a 5-col grid), so width is stretched and
 * the cell is kept square via `aspect-square` — overriding the acorn fixed
 * `w-20 h-16`.
 *
 * Unselected: 1px `color/border/default` (#e5e5e5) hairline. Selected: a single
 * thick (2px) dark slate (`button-primary-fill` = #353c43) border — no separate
 * ring, so the active frame reads as one solid dark edge.
 *
 * Stelpro thumbnails render at full opacity (Figma shows no dimming). The shared
 * component dims unselected thumbnails to 60% via the inner `<span>`; we override
 * that span back to full opacity with a child selector scoped to this brand
 * variant only — other brands keep the default dim.
 */
export const imageCarouselThumbnailStelproVariants = cva({
  base: [
    'pui:rounded-none',
    'pui:w-full',
    'pui:aspect-square',
    'pui:ring-0',
    // No transition on the selected border/ring — it changes instantly.
    // Overrides the acorn base `transition-all`.
    'pui:transition-none',
    'pui:[&>span]:opacity-100!'
  ],
  variants: {
    selected: {
      false: 'pui:border pui:border-pui-border-default',
      true: 'pui:border-2 pui:border-pui-button-primary-fill'
    },
    orientation: {
      horizontal: ['pui:h-auto'],
      vertical: ['pui:h-auto']
    }
  }
});
