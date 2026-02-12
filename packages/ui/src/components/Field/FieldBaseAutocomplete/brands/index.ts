import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { type VariantProps } from 'cva';
import {
  fieldBaseAutocompleteInputAcornVariants,
  fieldBaseAutocompleteOptionAcornVariants,
  fieldBaseAutocompleteOptionsAcornVariants
} from './FieldBaseAutocomplete.acorn.brand';
import {
  fieldBaseAutocompleteInputSprigVariants,
  fieldBaseAutocompleteOptionSprigVariants,
  fieldBaseAutocompleteOptionsSprigVariants
} from './FieldBaseAutocomplete.sprig.brand';
import {
  fieldBaseAutocompleteInputStelproVariants,
  fieldBaseAutocompleteOptionStelproVariants,
  fieldBaseAutocompleteOptionsStelproVariants
} from './FieldBaseAutocomplete.stelpro.brand';

export const fieldBaseAutocompleteInputBrandVariants = {
  acorn: fieldBaseAutocompleteInputAcornVariants,
  sprig: compose(
    fieldBaseAutocompleteInputAcornVariants,
    fieldBaseAutocompleteInputSprigVariants
  ),
  stelpro: compose(
    fieldBaseAutocompleteInputAcornVariants,
    fieldBaseAutocompleteInputStelproVariants
  )
} as const satisfies BrandVariants<
  typeof fieldBaseAutocompleteInputAcornVariants
>;

export const fieldBaseAutocompleteOptionsBrandVariants = {
  acorn: fieldBaseAutocompleteOptionsAcornVariants,
  sprig: compose(
    fieldBaseAutocompleteOptionsAcornVariants,
    fieldBaseAutocompleteOptionsSprigVariants
  ),
  stelpro: compose(
    fieldBaseAutocompleteOptionsAcornVariants,
    fieldBaseAutocompleteOptionsStelproVariants
  )
} as const satisfies BrandVariants<
  typeof fieldBaseAutocompleteOptionsAcornVariants
>;

export const fieldBaseAutocompleteOptionBrandVariants = {
  acorn: fieldBaseAutocompleteOptionAcornVariants,
  sprig: compose(
    fieldBaseAutocompleteOptionAcornVariants,
    fieldBaseAutocompleteOptionSprigVariants
  ),
  stelpro: compose(
    fieldBaseAutocompleteOptionAcornVariants,
    fieldBaseAutocompleteOptionStelproVariants
  )
} as const satisfies BrandVariants<
  typeof fieldBaseAutocompleteOptionAcornVariants
>;

export type FieldBaseAutocompleteInputVariantProps = VariantProps<
  typeof fieldBaseAutocompleteInputAcornVariants
>;
