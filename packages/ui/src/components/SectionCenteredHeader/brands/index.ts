import { type BrandVariants } from '@/lib/brand-registry';
import { type VariantProps } from 'cva';
import {
  sectionCenteredHeaderAcornVariants,
  sectionCenteredHeaderTitleAcornVariants
} from './SectionCenteredHeader.acorn.brand';

export const sectionCenteredHeaderBrandVariants = {
  acorn: sectionCenteredHeaderAcornVariants
  // 'microbird-commercial': sectionCenteredHeaderAcornVariants,
  // 'microbird-school': sectionCenteredHeaderAcornVariants
} as const satisfies BrandVariants<typeof sectionCenteredHeaderAcornVariants>;

export const sectionCenteredHeaderTitleBrandVariants: BrandVariants<
  typeof sectionCenteredHeaderTitleAcornVariants
> = {
  acorn: sectionCenteredHeaderTitleAcornVariants
  // 'microbird-commercial': sectionCenteredHeaderTitleAcornVariants,
  // 'microbird-school': sectionCenteredHeaderTitleAcornVariants
};

export type SectionCenteredHeaderVariantProps = VariantProps<
  typeof sectionCenteredHeaderAcornVariants
>;
