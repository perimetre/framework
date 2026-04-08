import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { type VariantProps } from 'cva';
import {
  sectionHorizontalHeaderAcornVariants,
  sectionHorizontalHeaderTitleAcornVariants
} from './SectionHorizontalHeader.acorn.brand';

export const sectionHorizontalHeaderBrandVariants = {
  acorn: sectionHorizontalHeaderAcornVariants,
  'microbird-commercial': sectionHorizontalHeaderAcornVariants,
  'microbird-school': compose(sectionHorizontalHeaderAcornVariants)
} as const satisfies BrandVariants<typeof sectionHorizontalHeaderAcornVariants>;

export const sectionHorizontalHeaderTitleBrandVariants: BrandVariants<
  typeof sectionHorizontalHeaderTitleAcornVariants
> = {
  acorn: sectionHorizontalHeaderTitleAcornVariants,
  'microbird-commercial': sectionHorizontalHeaderTitleAcornVariants,
  'microbird-school': sectionHorizontalHeaderTitleAcornVariants
};

export type SectionHorizontalHeaderVariantProps = VariantProps<
  typeof sectionHorizontalHeaderAcornVariants
>;
