import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { type VariantProps } from 'cva';
import { fieldGooglePlacesAutocompleteAcornVariants } from './FieldGooglePlacesAutocomplete.acorn.brand';
import { fieldGooglePlacesAutocompleteMicroBirdCommercialVariants } from './FieldGooglePlacesAutocomplete.microbird-commercial.brand';
import { fieldGooglePlacesAutocompleteMicroBirdSchoolVariants } from './FieldGooglePlacesAutocomplete.microbird-school.brand';

export const fieldGooglePlacesAutocompleteBrandVariants = {
  acorn: fieldGooglePlacesAutocompleteAcornVariants,
  'microbird-commercial': compose(
    fieldGooglePlacesAutocompleteAcornVariants,
    fieldGooglePlacesAutocompleteMicroBirdCommercialVariants
  ),
  'microbird-school': compose(
    fieldGooglePlacesAutocompleteAcornVariants,
    fieldGooglePlacesAutocompleteMicroBirdSchoolVariants
  )
} as const satisfies BrandVariants<
  typeof fieldGooglePlacesAutocompleteAcornVariants
>;

export type FieldGooglePlacesAutocompleteVariantProps = VariantProps<
  typeof fieldGooglePlacesAutocompleteAcornVariants
>;
