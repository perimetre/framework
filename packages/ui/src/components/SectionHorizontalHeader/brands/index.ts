import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { type VariantProps } from 'cva';
import { sectionHorizontalHeaderAcornVariants } from './SectionHorizontalHeader.acorn.brand';
import { sectionHorizontalHeaderMicrobirdCommercialVariants } from './SectionHorizontalHeader.microbird-commercial.brand';
import { sectionHorizontalHeaderMicrobirdSchoolVariants } from './SectionHorizontalHeader.microbird-school.brand';

export const sectionHorizontalHeaderBrandVariants = {
  acorn: sectionHorizontalHeaderAcornVariants,
  'microbird-commercial': compose(
    sectionHorizontalHeaderAcornVariants,
    sectionHorizontalHeaderMicrobirdCommercialVariants
  ),
  'microbird-school': compose(
    sectionHorizontalHeaderAcornVariants,
    sectionHorizontalHeaderMicrobirdSchoolVariants
  )
} as const satisfies BrandVariants<typeof sectionHorizontalHeaderAcornVariants>;

export type SectionHorizontalHeaderVariantProps = VariantProps<
  typeof sectionHorizontalHeaderAcornVariants
>;
