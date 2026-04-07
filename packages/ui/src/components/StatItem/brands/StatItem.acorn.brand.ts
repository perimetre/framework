import { cva } from '@/lib/cva';

export const statItemWrapperAcornVariants = cva({
  base: ['pui:flex', 'pui:flex-col', 'pui:gap-1']
});

export const statItemEyebrowAcornVariants = cva({
  base: ['pui:typo-tagline', 'pui:text-pui-fg-muted']
});

export const statItemContentRowAcornVariants = cva({
  base: ['pui:flex', 'pui:items-baseline', 'pui:gap-2']
});

export const statItemContentAcornVariants = cva({
  base: ['pui:typo-heading-1', 'pui:text-pui-fg-default']
});

export const statItemPrependAcornVariants = cva({
  base: ['pui:typo-large', 'pui:text-pui-fg-muted']
});

export const statItemExtraAcornVariants = cva({
  base: ['pui:typo-small', 'pui:text-pui-fg-muted']
});
