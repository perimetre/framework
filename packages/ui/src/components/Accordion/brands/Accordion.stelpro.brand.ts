import { cva } from '@/lib/cva';

/**
 * Stelpro brand Accordion variants
 *
 * Implements Figma STEL — Menu/Accordion (US website file, node 17639:28832).
 * Each item is a flat gray card (bg-subtle) with no dividers, separated by
 * 12px gaps; the answer panel is a white inset. Title/content colors and
 * typography come from token overrides in `@perimetre/tokens`
 * (`brands/stelpro.json`): fg-default/fg-body → text-primary (#2E2E2E),
 * accordion-title → Body/lg (20px / 150% / regular).
 */
export const accordionStelproVariants = cva({
  base: [
    // Flat gray card per item — no acorn dividers
    'pui:bg-pui-bg-subtle pui:border-b-0',
    // 12px gap between items
    'pui:mt-3 pui:first:mt-0'
  ]
});

export const accordionTriggerStelproVariants = cva({
  base: [
    // Figma: padding 16px 12px, gap 12px
    'pui:px-3 pui:py-4 pui:gap-3'
  ]
});

export const accordionIconStelproVariants = cva({
  base: [
    // 24px icon box (glyph stays centered); dark when closed,
    // brand red when open
    'pui:flex pui:size-6 pui:items-center pui:justify-center',
    'pui:text-pui-fg-default',
    'pui:group-data-[state=open]/accordion-trigger:text-pui-interactive-primary'
  ]
});

export const accordionContentInnerStelproVariants = cva({
  base: [
    // White answer panel inset in the gray card — Figma: padding 32px 12px
    'pui:bg-pui-bg-default pui:px-3 pui:py-8'
  ]
});
