import { cva } from '@/lib/cva';

/**
 * MicroBird Commercial brand FieldGooglePlacesAutocomplete container variants.
 *
 * Composed on top of Acorn via `compose()` in `brands/index.ts`. All
 * brand-level differences (input bg, border, placeholder colour, radius)
 * are handled via semantic CSS tokens overridden in
 * `packages/tokens/src/sets/brands/microbird-commercial.json`. This file is
 * kept as scaffolding so future class-level differences (typography,
 * decoration, brand-specific structural overrides) can be added here
 * without touching the registry.
 */
export const fieldGooglePlacesAutocompleteMicroBirdCommercialVariants = cva({
  base: []
});
