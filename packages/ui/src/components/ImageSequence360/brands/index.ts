import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { type VariantProps } from 'cva';
import { imageSequence360AcornVariants } from './ImageSequence360.acorn.brand';
import { imageSequence360MicroBirdCommercialVariants } from './ImageSequence360.microbird-commercial.brand';
import { imageSequence360MicroBirdSchoolVariants } from './ImageSequence360.microbird-school.brand';

export const imageSequence360BrandVariants = {
  acorn: imageSequence360AcornVariants,
  sprig: imageSequence360AcornVariants,
  stelpro: imageSequence360AcornVariants,
  'microbird-commercial': compose(
    imageSequence360AcornVariants,
    imageSequence360MicroBirdCommercialVariants
  ),
  'microbird-school': compose(
    imageSequence360AcornVariants,
    imageSequence360MicroBirdSchoolVariants
  )
} as const satisfies BrandVariants<typeof imageSequence360AcornVariants>;

export type ImageSequence360VariantProps = VariantProps<
  typeof imageSequence360AcornVariants
>;
