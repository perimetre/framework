import { cva } from '@/lib/cva';

/**
 * Stelpro brand CarouselButton variant overrides.
 *
 * Figma `Button/Controls` (node 17639:28872 / 29521): a 48px white circle with a
 * `color/icon/primary` (#2e2e2e → `fg-default` under Stelpro) chevron and a
 * two-layer drop shadow. Composes on the acorn base (white circle, `rounded-full`),
 * tuning size, icon color, and the exact Figma shadow.
 */
export const carouselButtonStelproVariants = cva({
  base: [
    'pui:size-12',
    'pui:bg-pui-bg-default',
    'pui:text-pui-fg-default',
    'pui:shadow-[0_1px_2px_-1px_rgba(0,0,0,0.1),0_1px_3px_0_rgba(0,0,0,0.1)]',
    'hover:pui:bg-pui-bg-default',
    'hover:pui:shadow-[0_1px_2px_-1px_rgba(0,0,0,0.1),0_1px_3px_0_rgba(0,0,0,0.1)]'
  ]
});
