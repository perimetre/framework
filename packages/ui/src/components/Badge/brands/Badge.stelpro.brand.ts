import { cva } from '@/lib/cva';

/**
 * Stelpro brand badge variant overrides
 * These styles compose with the Acorn base variant.
 *
 * Figma "Badges/Tags" (node 554:5225): the Caption type ramp — 14px, regular
 * weight, 1.5 line-height — and a fixed 6px/10px padding, rather than Acorn's
 * 12px/medium/leading-none + size-driven padding. These override the Acorn
 * `size` variant (twMerge last-wins, Stelpro composes after Acorn). The pill
 * shape and per-status colors come from tokens (radius-badge → full,
 * color/badge/*).
 */
export const badgeStelproVariants = cva({
  base: ['pui:text-sm pui:font-normal pui:leading-normal pui:px-2.5 pui:py-1.5']
});
