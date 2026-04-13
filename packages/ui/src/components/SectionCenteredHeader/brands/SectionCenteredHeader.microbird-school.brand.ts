import { cva } from '@/lib/cva';

/**
 * MicroBird School brand SectionCenteredHeader variants.
 *
 * Font family override is handled via CSS tokens (--pui-primitive-font-display → 'Big Shoulders Text').
 * No additional CVA overrides needed.
 */
export const sectionCenteredHeaderMicroBirdSchoolVariants = cva({
  base: [],
  variants: {
    variant: {
      default: [],
      h1: []
    }
  }
});

export const sectionCenteredHeaderTitleMicroBirdSchoolVariants = cva({
  base: [],
  variants: {
    variant: {
      default: [],
      h1: []
    }
  }
});
