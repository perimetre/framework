import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { type VariantProps } from 'cva';
import {
  sectionCenteredHeaderAcornVariants,
  sectionCenteredHeaderTitleAcornVariants
} from './SectionCenteredHeader.acorn.brand';
import {
  sectionCenteredHeaderMicroBirdCommercialVariants,
  sectionCenteredHeaderTitleMicroBirdCommercialVariants
} from './SectionCenteredHeader.microbird-commercial.brand';
import {
  sectionCenteredHeaderMicroBirdSchoolVariants,
  sectionCenteredHeaderTitleMicroBirdSchoolVariants
} from './SectionCenteredHeader.microbird-school.brand';

export const sectionCenteredHeaderBrandVariants = {
  acorn: sectionCenteredHeaderAcornVariants,
  'microbird-commercial': compose(
    sectionCenteredHeaderAcornVariants,
    sectionCenteredHeaderMicroBirdCommercialVariants
  ),
  'microbird-school': compose(
    sectionCenteredHeaderAcornVariants,
    sectionCenteredHeaderMicroBirdSchoolVariants
  )
} as const satisfies BrandVariants<typeof sectionCenteredHeaderAcornVariants>;

export const sectionCenteredHeaderTitleBrandVariants: BrandVariants<
  typeof sectionCenteredHeaderTitleAcornVariants
> = {
  acorn: sectionCenteredHeaderTitleAcornVariants,
  'microbird-commercial': compose(
    sectionCenteredHeaderTitleAcornVariants,
    sectionCenteredHeaderTitleMicroBirdCommercialVariants
  ),
  'microbird-school': compose(
    sectionCenteredHeaderTitleAcornVariants,
    sectionCenteredHeaderTitleMicroBirdSchoolVariants
  )
};

export type SectionCenteredHeaderVariantProps = VariantProps<
  typeof sectionCenteredHeaderAcornVariants
>;
