import { cva } from '@/lib/cva';

/**
 * Acorn brand Accordion variants (default/base theme).
 * Uses semantic tokens for themeable properties:
 * - text-pui-fg-*: title/body/eyebrow colors
 * - border-pui-border-accordion-*: per-position dividers (first / between / last)
 * - --pui-typo-accordion-*: title and content typography (applied inline
 *   below — these tokens are accordion-specific, so no `@utility` is needed)
 */
export const accordionAcornVariants = cva({
  base: [
    'pui:flex pui:w-full pui:flex-col',
    'pui:border-b pui:border-pui-border-accordion-between',
    'pui:first:border-t pui:first:border-t-pui-border-accordion-first',
    'pui:last:border-b-pui-border-accordion-last'
  ]
});

export const accordionTriggerAcornVariants = cva({
  base: [
    'group/accordion-trigger pui:group/accordion-trigger',
    'pui:flex pui:w-full pui:items-center pui:justify-between pui:gap-4',
    'pui:py-4 pui:text-left',
    'pui:cursor-pointer pui:appearance-none pui:bg-transparent pui:border-0',
    'pui:focus-visible:outline-none pui:focus-visible:shadow-pui-input-focus'
  ]
});

export const accordionHeadingAcornVariants = cva({
  base: ['pui:flex pui:flex-col-reverse pui:gap-1']
});

export const accordionEyebrowAcornVariants = cva({
  base: ['pui:typo-tagline pui:text-pui-fg-muted']
});

export const accordionTitleAcornVariants = cva({
  base: [
    'pui:text-pui-fg-default',
    'pui:font-(family-name:--pui-typo-accordion-title-family,var(--pui-primitive-font-sans))',
    'pui:text-(length:--pui-typo-accordion-title-size)',
    'pui:leading-(--pui-typo-accordion-title-leading)',
    'pui:font-(--pui-typo-accordion-title-weight)',
    'pui:tracking-(--pui-typo-accordion-title-tracking)',
    'pui:[text-transform:var(--pui-typo-accordion-title-transform)]'
  ]
});

export const accordionIconAcornVariants = cva({
  base: ['pui:shrink-0 pui:text-pui-interactive-primary']
});

export const accordionIconBarAcornVariants = cva({
  base: [
    'pui:origin-center pui:transition-[transform,opacity]',
    'pui:duration-pui-normal pui:ease-pui-out-quad',
    'pui:motion-reduce:transition-none',
    'pui:group-data-[state=open]/accordion-trigger:rotate-90',
    'pui:group-data-[state=open]/accordion-trigger:opacity-0'
  ]
});

export const accordionContentAcornVariants = cva({
  base: [
    'pui:overflow-hidden',
    'pui:data-[state=open]:animate-accordion-down',
    'pui:data-[state=closed]:animate-accordion-up',
    'pui:motion-reduce:animate-none'
  ]
});

export const accordionContentInnerAcornVariants = cva({
  base: [
    'pui:text-pui-fg-body pui:pb-4',
    'pui:font-(family-name:--pui-typo-accordion-content-family,var(--pui-primitive-font-sans))',
    'pui:text-(length:--pui-typo-accordion-content-size)',
    'pui:leading-(--pui-typo-accordion-content-leading)',
    'pui:font-(--pui-typo-accordion-content-weight)',
    'pui:tracking-(--pui-typo-accordion-content-tracking)',
    'pui:[text-transform:var(--pui-typo-accordion-content-transform)]',
    'pui:animate-in pui:fade-in pui:duration-pui-normal pui:delay-75 pui:fill-mode-both pui:ease-pui-out-quad',
    'pui:motion-reduce:animate-none'
  ]
});
