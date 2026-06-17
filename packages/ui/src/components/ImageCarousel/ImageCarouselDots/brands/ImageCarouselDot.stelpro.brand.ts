import { cva } from '@/lib/cva';

/**
 * Stelpro brand ImageCarouselDot variant overrides.
 *
 * Figma `Carousel/Pagination` (node 17639:29524): eight equal 8px dots; the
 * active one is `color/icon/accent` (#cc0000 → `interactive-primary` under
 * Stelpro), the rest are `color/icon/subtle` (#d4d4d4 → `border-rule-secondary`).
 * Same size for every dot — only the color changes. Overrides the acorn
 * white-on-image dot and drops the acorn `scale-125`.
 */
export const imageCarouselDotStelproVariants = cva({
  base: ['pui:w-2', 'pui:h-2', 'pui:rounded-full', 'pui:scale-100'],
  variants: {
    selected: {
      false: 'pui:bg-pui-border-rule-secondary hover:pui:bg-pui-fg-subtle',
      true: 'pui:bg-pui-interactive-primary'
    }
  }
});
