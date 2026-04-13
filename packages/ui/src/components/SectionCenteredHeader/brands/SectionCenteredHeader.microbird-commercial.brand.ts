import { cva } from '@/lib/cva';

/**
 * MicroBird Commercial brand SectionCenteredHeader variants.
 *
 * Font family override is handled via CSS tokens (--pui-primitive-font-display → 'Big Shoulders Text').
 * No additional CVA overrides needed.
 */
export const sectionCenteredHeaderMicroBirdCommercialVariants = cva({
  base: [],
  variants: {
    variant: {
      default: [],
      h1: []
    }
  }
});

export const sectionCenteredHeaderTitleMicroBirdCommercialVariants = cva({
  base: [],
  variants: {
    variant: {
      default: [],
      h1: []
    }
  }
});
