import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { type VariantProps } from 'cva';
import {
  fieldBaseDropdownInputAcornVariants,
  fieldBaseDropdownOptionAcornVariants,
  fieldBaseDropdownOptionsAcornVariants
} from './FieldBaseDropdown.acorn.brand';
import {
  fieldBaseDropdownInputOiqPlacePourToiVariants,
  fieldBaseDropdownOptionOiqPlacePourToiVariants,
  fieldBaseDropdownOptionsOiqPlacePourToiVariants
} from './FieldBaseDropdown.oiq-place-pour-toi.brand';

export const fieldBaseDropdownInputBrandVariants = {
  acorn: fieldBaseDropdownInputAcornVariants,
  'oiq-place-pour-toi': compose(
    fieldBaseDropdownInputAcornVariants,
    fieldBaseDropdownInputOiqPlacePourToiVariants
  )
} as const satisfies BrandVariants<typeof fieldBaseDropdownInputAcornVariants>;

export const fieldBaseDropdownOptionsBrandVariants = {
  acorn: fieldBaseDropdownOptionsAcornVariants,
  'oiq-place-pour-toi': compose(
    fieldBaseDropdownOptionsAcornVariants,
    fieldBaseDropdownOptionsOiqPlacePourToiVariants
  )
} as const satisfies BrandVariants<
  typeof fieldBaseDropdownOptionsAcornVariants
>;

export const fieldBaseDropdownOptionBrandVariants = {
  acorn: fieldBaseDropdownOptionAcornVariants,
  'oiq-place-pour-toi': compose(
    fieldBaseDropdownOptionAcornVariants,
    fieldBaseDropdownOptionOiqPlacePourToiVariants
  )
} as const satisfies BrandVariants<typeof fieldBaseDropdownOptionAcornVariants>;

export type FieldBaseDropdownInputVariantProps = VariantProps<
  typeof fieldBaseDropdownInputAcornVariants
>;
