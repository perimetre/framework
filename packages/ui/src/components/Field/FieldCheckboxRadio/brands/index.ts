import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { type VariantProps } from 'cva';
import {
  fieldCheckboxRadioAcornVariants,
  fieldCheckboxRadioBoxAcornVariants,
  fieldCheckboxRadioCheckboxIconAcornVariants,
  fieldCheckboxRadioRadioIconAcornVariants
} from './FieldCheckboxRadio.acorn.brand';
import {
  fieldCheckboxRadioBoxSprigVariants,
  fieldCheckboxRadioCheckboxIconSprigVariants,
  fieldCheckboxRadioRadioIconSprigVariants,
  fieldCheckboxRadioSprigVariants
} from './FieldCheckboxRadio.sprig.brand';
import {
  fieldCheckboxRadioBoxStelproVariants,
  fieldCheckboxRadioCheckboxIconStelproVariants,
  fieldCheckboxRadioRadioIconStelproVariants,
  fieldCheckboxRadioStelproVariants
} from './FieldCheckboxRadio.stelpro.brand';

export const fieldCheckboxRadioBrandVariants = {
  acorn: fieldCheckboxRadioAcornVariants,
  sprig: compose(
    fieldCheckboxRadioAcornVariants,
    fieldCheckboxRadioSprigVariants
  ),
  stelpro: compose(
    fieldCheckboxRadioAcornVariants,
    fieldCheckboxRadioStelproVariants
  )
} as const satisfies BrandVariants<typeof fieldCheckboxRadioAcornVariants>;

export const fieldCheckboxRadioBoxBrandVariants = {
  acorn: fieldCheckboxRadioBoxAcornVariants,
  sprig: compose(
    fieldCheckboxRadioBoxAcornVariants,
    fieldCheckboxRadioBoxSprigVariants
  ),
  stelpro: compose(
    fieldCheckboxRadioBoxAcornVariants,
    fieldCheckboxRadioBoxStelproVariants
  )
} as const satisfies BrandVariants<typeof fieldCheckboxRadioBoxAcornVariants>;

export const fieldCheckboxRadioCheckboxIconBrandVariants = {
  acorn: fieldCheckboxRadioCheckboxIconAcornVariants,
  sprig: compose(
    fieldCheckboxRadioCheckboxIconAcornVariants,
    fieldCheckboxRadioCheckboxIconSprigVariants
  ),
  stelpro: compose(
    fieldCheckboxRadioCheckboxIconAcornVariants,
    fieldCheckboxRadioCheckboxIconStelproVariants
  )
} as const satisfies BrandVariants<
  typeof fieldCheckboxRadioCheckboxIconAcornVariants
>;

export const fieldCheckboxRadioRadioIconBrandVariants = {
  acorn: fieldCheckboxRadioRadioIconAcornVariants,
  sprig: compose(
    fieldCheckboxRadioRadioIconAcornVariants,
    fieldCheckboxRadioRadioIconSprigVariants
  ),
  stelpro: compose(
    fieldCheckboxRadioRadioIconAcornVariants,
    fieldCheckboxRadioRadioIconStelproVariants
  )
} as const satisfies BrandVariants<
  typeof fieldCheckboxRadioRadioIconAcornVariants
>;

export type FieldCheckboxRadioVariantProps = VariantProps<
  typeof fieldCheckboxRadioAcornVariants
>;
