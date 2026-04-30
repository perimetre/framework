import { cva } from '@/lib/cva';

/**
 * Acorn brand Collapse variants (default/base theme).
 * Uses semantic tokens for themeable properties:
 * - text-pui-fg-*: title/body/eyebrow colors
 * - border-pui-border-*: divider between collapsed items
 */
export const collapseAcornVariants = cva({
  base: [
    'pui:flex pui:w-full pui:flex-col',
    'pui:border-b pui:border-pui-overlay-12/20'
  ]
});

export const collapseTriggerAcornVariants = cva({
  base: [
    'pui:flex pui:w-full pui:items-center pui:justify-between pui:gap-4',
    'pui:py-4 pui:text-left',
    'pui:cursor-pointer pui:appearance-none pui:bg-transparent pui:border-0',
    'pui:focus-visible:outline-none pui:focus-visible:shadow-pui-input-focus'
  ]
});

export const collapseHeadingAcornVariants = cva({
  base: ['pui:flex pui:flex-col-reverse pui:gap-1']
});

export const collapseEyebrowAcornVariants = cva({
  base: ['pui:typo-tagline pui:text-pui-fg-muted']
});

export const collapseTitleAcornVariants = cva({
  base: ['pui:typo-heading-5 pui:text-pui-fg-default']
});

export const collapseIconAcornVariants = cva({
  base: ['pui:shrink-0 pui:text-pui-interactive-primary']
});

export const collapseContentAcornVariants = cva({
  base: ['pui:overflow-hidden']
});

export const collapseContentInnerAcornVariants = cva({
  base: ['pui:typo-base pui:text-pui-fg-body pui:pb-4']
});
