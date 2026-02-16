'use client';

import { useGoogleContext } from '@/components/GoogleProvider';
import { cx } from '@/lib/cva';
import { type ForceRequiredProps } from '@perimetre/helpers/types';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import FieldAddon from '../FieldAddon';
import { inputVariants } from '../FieldBaseInput';
import FieldContainer from '../FieldContainer';
import FieldLower, { type FieldLowerProps } from '../FieldLower';
import FieldUpper, { type FieldUpperProps } from '../FieldUpper';

export type FieldGooglePlacesAutocompleteProps = {
  containerClassName?: string;
  disabled?: boolean;
  /**
   * Fields to fetch from the selected place.
   * Controls cost - only request fields you need.
   * @see https://developers.google.com/maps/documentation/javascript/place-class-data-fields
   * @default ['formattedAddress', 'location']
   * @example ['formattedAddress', 'location', 'addressComponents', 'plusCode', 'displayName']
   */
  fields?: string[];
  /**
   * Filter autocomplete results by primary place types.
   * @see https://developers.google.com/maps/documentation/javascript/place-types
   * @example ['restaurant', 'cafe', 'bar']
   */
  includedPrimaryTypes?: string[];
  /**
   * Restrict autocomplete results to specific region codes (ISO 3166-1 alpha-2).
   * @example ['ca', 'us']
   */
  includedRegionCodes?: string[];
  /**
   * When true, requests the user's browser geolocation on mount,
   * reverse-geocodes the coordinates, fills the input with the address,
   * biases autocomplete results toward the user's location, and fires
   * `onPlaceSelect` with the geocoded result.
   *
   * Requires the `geocoding` library (loaded automatically).
   * @default true
   */
  isGeolocationEnabled?: boolean;
  leading?: React.ReactNode;
  /**
   * Bias results toward a location or viewport.
   * Does not restrict results, just preferences them.
   * @see https://developers.google.com/maps/documentation/javascript/place-autocomplete-new#best-practices
   */
  locationBias?: google.maps.places.LocationBias;
  /**
   * Restrict results to a location or viewport.
   * Only returns results within the specified area.
   * @see https://developers.google.com/maps/documentation/javascript/place-autocomplete-new#best-practices
   */
  locationRestriction?: google.maps.places.LocationRestriction;
  name: string;
  /**
   * Called when geolocation completes (or fails).
   * Only fires when `isGeolocationEnabled` is true.
   */
  onGeolocationResult?: (result: GeolocationResult) => void;
  onLoadError?: (error: Error) => void;
  /**
   * Called when a place is selected.
   * The place object contains the fields you requested in the `fields` prop.
   */
  onPlaceSelect?: (place: google.maps.places.Place) => void;
  placeholder?: string;
  /**
   * Language for autocomplete results (BCP 47 language code).
   * @example 'en', 'fr', 'es'
   */
  requestedLanguage?: string;
  /**
   * Region code for autocomplete results (ISO 3166-1 alpha-2).
   * @example 'CA', 'US'
   */
  requestedRegion?: string;
  required?: boolean;
  trailing?: React.ReactNode;
} & ForceRequiredProps<Partial<FieldLowerProps>, 'error'> &
  Partial<FieldUpperProps>;

export type GeolocationResult =
  | { didSucceed: false }
  | { didSucceed: true; location: { lat: number; lng: number } };

/**
 * CSS injected into the PlaceAutocompleteElement shadow DOM.
 * References PUI CSS custom properties which cascade through the shadow DOM boundary,
 * so brand-specific token overrides apply automatically.
 */
function getShadowStyles(): string {
  return `
/* ──────────── HOST ──────────── */

:host {
  font-family: inherit !important;
  line-height: inherit !important;
  overflow: visible !important;
  position: relative !important;
}

/* ──────────── INPUT AREA ──────────── */

/* Main wrapper — transparent, the outer PUI span handles visuals.
   position:relative provides context for the clear button. */
.widget-container {
  position: relative !important;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  overflow: visible !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
}

/* Input row — transparent, no positioning context so that
   .predictions-anchor positions relative to :host instead */
.input-container {
  position: static !important;
  padding: 0 !important;
  margin: 0 !important;
  min-height: 0 !important;
  height: auto !important;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  width: 100% !important;
  flex: 1 !important;
  min-width: 0 !important;
}

/* Hide Google's built-in search icon — consumers use the leading prop */
.autocomplete-icon {
  display: none !important;
}

/* Hide the back button (used in fullscreen mobile mode) */
.back-button {
  display: none !important;
}

/* Make the Google input transparent. Padding uses CSS custom properties
   set on the host element so leading/trailing addons are accounted for. */
input {
  background: transparent !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  color: var(--pui-color-input-text, inherit) !important;
  font: inherit !important;
  font-size: inherit !important;
  padding: 6px 0 !important;
  padding-left: var(--gmp-pl, 0.75rem) !important;
  padding-right: 0 !important;
  margin: 0 !important;
  width: 100% !important;
  height: auto !important;
  min-height: 0 !important;
  line-height: inherit !important;
  text-align: left !important;
  text-overflow: ellipsis !important;
  overflow: hidden !important;
}

input::placeholder {
  color: var(--pui-color-input-placeholder, inherit) !important;
}

/* Remove Google's focus ring — our container handles focus styling */
.focus-ring {
  display: none !important;
}

/* ──────────── CLEAR BUTTON ──────────── */

.clear-button {
  position: static !important;
  flex-shrink: 0 !important;
  color: var(--pui-color-fg-default, #21201c) !important;
  background: transparent !important;
  border: none !important;
  z-index: 5 !important;
  padding: 2px 4px !important;
  margin-right: 4px !important;
  opacity: 0.7 !important;
  display: flex !important;
  align-items: center !important;
}

.clear-button:hover {
  color: var(--pui-color-fg-default, #21201c) !important;
  opacity: 1 !important;
}

/* Override hardcoded fill on the clear button SVG path */
.clear-button svg,
.clear-button svg path {
  fill: currentColor !important;
}

/* ──────────── DROPDOWN ──────────── */

/* Anchor for the dropdown — position absolute to break out of the
   input container. This is what makes the dropdown "float". */
.predictions-anchor {
  position: absolute !important;
  top: 100% !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 50 !important;
  padding: 0 !important;
  margin: 0 !important;
  height: auto !important;
  overflow: visible !important;
}

/* The dropdown panel — styled as a floating panel with PUI tokens */
.dropdown {
  background: var(--pui-color-dropdown-bg, #fff) !important;
  border: 1px solid var(--pui-color-dropdown-border, #e5e5e5) !important;
  border-radius: var(--pui-radius-dropdown, 0.375rem) !important;
  box-shadow: var(--pui-shadow-dropdown, 0 4px 6px -1px rgb(0 0 0 / 0.1)) !important;
  padding: 4px 0 !important;
  margin-top: 4px !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  max-height: 300px !important;
  flex-direction: column !important;
}

/* Subtle scrollbar styling */
.dropdown::-webkit-scrollbar {
  width: 6px !important;
}

.dropdown::-webkit-scrollbar-track {
  background: transparent !important;
}

.dropdown::-webkit-scrollbar-thumb {
  background: var(--pui-color-border-default, #d4d4d4) !important;
  border-radius: 3px !important;
}

.dropdown::-webkit-scrollbar-thumb:hover {
  background: var(--pui-color-fg-muted, #999) !important;
}

/* The listbox (ul) — reset list styles */
[role="listbox"] {
  list-style: none !important;
  padding: 0 !important;
  margin: 0 !important;
  display: block !important;
}

/* ── GLOBAL SVG RESET — prevents Google light-dark() leaking ── */

svg, svg path, svg circle, svg rect {
  fill: currentColor !important;
}

/* ── SUGGESTION ITEMS ── */

/* Inactive state */
[role="option"] {
  color: var(--pui-color-dropdown-text, #1a1a1a) !important;
  background: var(--pui-color-dropdown-item-bg, #fff) !important;
  border: none !important;
  border-bottom: 1px solid var(--pui-color-dropdown-separator, #f5f5f5) !important;
  padding: 8px 12px !important;
  margin: 0 !important;
  cursor: pointer !important;
  transition: background-color 150ms, color 150ms !important;
  list-style: none !important;
  font-size: 0.875rem !important;
  line-height: 1.25rem !important;
}

[role="option"]:last-child {
  border-bottom: none !important;
}

/* Active / hovered state */
[role="option"]:hover,
[role="option"][aria-selected="true"] {
  background: var(--pui-color-dropdown-item-hover-bg, #f9f9f9) !important;
  color: var(--pui-color-dropdown-text-active, #1a1a1a) !important;
}

/* Reset all borders/outlines inside prediction items */
[role="option"] * {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

/* Prediction item layout */
.place-autocomplete-element-row {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 0 !important;
  margin: 0 !important;
  height: auto !important;
  min-height: 0 !important;
  border: none !important;
  background: transparent !important;
}

/* Hide prediction item icons — cleaner look matching FieldSelect */
[part="prediction-item-icon"],
.place-autocomplete-element-place-icon {
  display: none !important;
}

/* Prediction item text */
.place-autocomplete-element-text-div {
  padding: 0 !important;
  margin: 0 !important;
  height: auto !important;
  min-height: 0 !important;
  border: none !important;
}

/* ── INACTIVE TEXT COLORS ── */

/* Primary text — override Google light-dark() on place-name spans */
[role="option"] .place-autocomplete-element-place-name,
[role="option"] [part="prediction-item-main-text"] {
  color: var(--pui-color-dropdown-text, #1a1a1a) !important;
}

/* Matched text — highlighted with the brand primary color */
[role="option"] .place-autocomplete-element-place-result--matched,
[role="option"] [part="prediction-item-match"] {
  color: var(--pui-color-dropdown-text-matched, #0077b6) !important;
  font-weight: 600 !important;
}

/* Secondary text (city, country) */
[role="option"] .place-autocomplete-element-place-details,
[role="option"] [part="prediction-item-detail-text"] {
  color: var(--pui-color-dropdown-text-secondary, #63635e) !important;
  font-size: 0.8125rem !important;
  line-height: 1.125rem !important;
}

/* ── ACTIVE / HOVERED TEXT COLORS ── */

[role="option"]:hover .place-autocomplete-element-place-name,
[role="option"][aria-selected="true"] .place-autocomplete-element-place-name,
[role="option"]:hover [part="prediction-item-main-text"],
[role="option"][aria-selected="true"] [part="prediction-item-main-text"] {
  color: var(--pui-color-dropdown-text-active, #1a1a1a) !important;
}

[role="option"]:hover .place-autocomplete-element-place-result--matched,
[role="option"][aria-selected="true"] .place-autocomplete-element-place-result--matched,
[role="option"]:hover [part="prediction-item-match"],
[role="option"][aria-selected="true"] [part="prediction-item-match"] {
  color: var(--pui-color-dropdown-text-matched-active, #0077b6) !important;
}

[role="option"]:hover .place-autocomplete-element-place-details,
[role="option"][aria-selected="true"] .place-autocomplete-element-place-details,
[role="option"]:hover [part="prediction-item-detail-text"],
[role="option"][aria-selected="true"] [part="prediction-item-detail-text"] {
  color: var(--pui-color-dropdown-text-secondary-active, #63635e) !important;
}

/* ──────────── ATTRIBUTION ──────────── */

/* Hide the attribution row inside the dropdown.
   Google Maps attribution is shown via the prediction item icons. */
.attributions {
  display: none !important;
}
`;
}

/**
 * A Google Places autocomplete field component with cost-optimized field selection.
 *
 * Follows the same visual structure as FieldInput (label, addons, hint/error)
 * but renders a Google PlaceAutocompleteElement inside the input container.
 * A native placeholder input is SSR-rendered to prevent layout shift while
 * the Google library loads lazily on the client.
 *
 * **Cost Optimization**: Use the `fields` prop to only request data you need.
 * Each field category has different billing tiers (Essentials, Pro, Enterprise).
 * @see https://developers.google.com/maps/documentation/javascript/place-class-data-fields
 *
 * **Performance**: Use `locationBias`, `locationRestriction`, and `includedPrimaryTypes`
 * to improve relevance and reduce unnecessary results.
 * @see https://developers.google.com/maps/documentation/javascript/place-autocomplete-new#best-practices
 *
 * Requires a {@link GoogleProvider} ancestor to configure the API key.
 * @example
 * // Minimal cost - only fetch location data
 * <FieldGooglePlacesAutocomplete
 *   name="address"
 *   label="Shipping Address"
 *   placeholder="Search for an address..."
 *   fields={['formattedAddress', 'location']}
 *   requestedRegion="CA"
 *   includedRegionCodes={['ca', 'us']}
 *   onPlaceSelect={(place) => {
 *     setValue('address', place.formattedAddress);
 *     setValue('lat', place.location?.lat());
 *     setValue('lng', place.location?.lng());
 *   }}
 * />
 * @example
 * // Advanced - fetch additional fields as needed
 * <FieldGooglePlacesAutocomplete
 *   name="restaurant"
 *   label="Restaurant"
 *   placeholder="Search for a restaurant..."
 *   fields={['displayName', 'formattedAddress', 'location', 'rating', 'priceLevel']}
 *   includedPrimaryTypes={['restaurant', 'cafe', 'bar']}
 *   locationBias={{ lat: 45.5017, lng: -73.5673 }} // Montreal
 *   onPlaceSelect={(place) => {
 *     console.log(place.displayName);
 *     console.log(place.rating);
 *     console.log(place.priceLevel);
 *   }}
 * />
 */
const FieldGooglePlacesAutocomplete: React.FC<
  FieldGooglePlacesAutocompleteProps
> = ({
  containerClassName,
  corner,
  description,
  disabled,
  error,
  fields = ['formattedAddress', 'location'],
  hint,
  includedPrimaryTypes,
  includedRegionCodes,
  isGeolocationEnabled = true,
  label,
  leading,
  locationBias,
  locationRestriction,
  name,
  onGeolocationResult,
  onLoadError,
  onPlaceSelect,
  placeholder,
  requestedLanguage,
  requestedRegion,
  required,
  trailing
}) => {
  const google = useGoogleContext();
  const containerRef = useRef<HTMLSpanElement>(null);
  const autocompleteRef =
    useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const originalAttachShadowRef = useRef<
    null | typeof Element.prototype.attachShadow
  >(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  onPlaceSelectRef.current = onPlaceSelect;
  const onGeolocationResultRef = useRef(onGeolocationResult);
  onGeolocationResultRef.current = onGeolocationResult;

  // Intercept attachShadow to inject PUI styles into the web component's shadow DOM.
  // Must run before importLibrary since Google creates the shadow DOM during element construction.
  useLayoutEffect(() => {
    if (disabled || autocompleteRef.current) return;

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalAttachShadow = Element.prototype.attachShadow;
    originalAttachShadowRef.current = originalAttachShadow;

    /**
     * Override attachShadow to inject PUI token styles into the Google web component.
     * Forces open mode so CSS custom properties and styling work reliably.
     */
    Element.prototype.attachShadow = function (init: ShadowRootInit) {
      const overriddenInit =
        this.tagName === 'GMP-PLACE-AUTOCOMPLETE'
          ? { ...init, mode: 'open' as const }
          : init;
      const shadowRoot = originalAttachShadow.call(this, overriddenInit);
      if (this.tagName === 'GMP-PLACE-AUTOCOMPLETE') {
        const style = document.createElement('style');
        style.textContent = getShadowStyles();
        shadowRoot.appendChild(style);
      }
      return shadowRoot;
    };

    /** Load Google Places library, create the autocomplete element, and mount it */
    const setup = async () => {
      try {
        const { importLibrary, setOptions } =
          await import('@googlemaps/js-api-loader');
        setOptions({
          key: google.apiKey,
          ...(google.language && { language: google.language }),
          ...(google.region && { region: google.region })
        });

        await importLibrary('places');

        if (!containerRef.current) return;

        const element = new window.google.maps.places.PlaceAutocompleteElement({
          ...(requestedLanguage && { requestedLanguage }),
          ...(requestedRegion && { requestedRegion }),
          ...(includedRegionCodes && { includedRegionCodes }),
          ...(includedPrimaryTypes && { includedPrimaryTypes }),
          ...(locationBias && { locationBias }),
          ...(locationRestriction && { locationRestriction })
        });

        // Set placeholder via attribute (web component property)
        if (placeholder) {
          (element as unknown as HTMLElement).setAttribute(
            'placeholder',
            placeholder
          );
        }

        // Make the web component host element transparent — visual styling
        // comes from the container span via inputVariants.
        // Fill the overlay span so the dropdown positions correctly.
        // Set --gmp-pl / --gmp-pr so shadow DOM input padding matches addons.
        const hostEl = element as unknown as HTMLElement;
        hostEl.style.width = '100%';
        hostEl.style.height = '100%';
        hostEl.style.background = 'transparent';
        hostEl.style.border = 'none';
        hostEl.style.outline = 'none';
        hostEl.style.padding = '0';
        hostEl.style.margin = '0';
        hostEl.style.lineHeight = 'inherit';
        hostEl.style.setProperty('--gmp-pl', leading ? '2.5rem' : '0.75rem');
        hostEl.style.setProperty('--gmp-pr', trailing ? '2.5rem' : '0.75rem');

        autocompleteRef.current = element;
        containerRef.current.appendChild(element);
        setIsLoaded(true);
      } catch (err) {
        onLoadError?.(err instanceof Error ? err : new Error(String(err)));
      }
    };

    void setup();

    return () => {
      autocompleteRef.current?.remove();
      autocompleteRef.current = null;
      setIsLoaded(false);
      if (originalAttachShadowRef.current) {
        Element.prototype.attachShadow = originalAttachShadowRef.current;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  // Handle place selection events
  useEffect(() => {
    if (!isLoaded || !autocompleteRef.current) return;

    /**
     * Handle gmp-placeselect event, fetch requested fields, and call onPlaceSelect.
     * Only fetches the fields specified in the `fields` prop to optimize cost.
     */
    const handleSelect = (event: Event) => {
      void (async () => {
        try {
          const { placePrediction } = event as unknown as {
            placePrediction: google.maps.places.PlacePrediction;
          };

          const place = placePrediction.toPlace();

          // Fetch only the requested fields to optimize cost
          await place.fetchFields({ fields });

          // Pass the native Place object with the requested fields populated
          onPlaceSelect?.(place);
        } catch (err) {
          console.error('Error fetching place details:', err);
        }
      })();
    };

    autocompleteRef.current.addEventListener('gmp-placeselect', handleSelect);

    return () => {
      autocompleteRef.current?.removeEventListener(
        'gmp-placeselect',
        handleSelect
      );
    };
  }, [isLoaded, onPlaceSelect, fields]);

  // Geolocate the user on mount: reverse-geocode their position,
  // fill the input with the address, bias results, and fire callbacks.
  useEffect(() => {
    if (!isGeolocationEnabled || !isLoaded || !autocompleteRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- geolocation may be unavailable in some environments
    if (!navigator.geolocation) {
      onGeolocationResultRef.current?.({ didSucceed: false });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void (async () => {
          try {
            const { latitude: lat, longitude: lng } = position.coords;

            const { importLibrary } = await import('@googlemaps/js-api-loader');
            await importLibrary('geocoding');

            const geocoder = new window.google.maps.Geocoder();
            const { results } = await geocoder.geocode({
              location: { lat, lng }
            });

            const first = results[0] as google.maps.GeocoderResult | undefined;
            if (!first) {
              onGeolocationResultRef.current?.({ didSucceed: false });
              return;
            }

            const location = {
              lat: first.geometry.location.lat(),
              lng: first.geometry.location.lng()
            };

            /** Recursively polls until the shadow DOM input is available, then fills it with the geocoded address. */
            const fillInput = () => {
              if (!autocompleteRef.current) return;
              const innerInput = Object.values(autocompleteRef.current).find(
                (v): v is HTMLInputElement => v instanceof HTMLInputElement
              );
              if (innerInput) {
                if (!innerInput.value && first.formatted_address) {
                  innerInput.value = first.formatted_address;
                }
                return;
              }
              requestAnimationFrame(fillInput);
            };
            requestAnimationFrame(fillInput);

            onGeolocationResultRef.current?.({
              didSucceed: true,
              location
            });
          } catch {
            onGeolocationResultRef.current?.({ didSucceed: false });
          }
        })();
      },
      () => {
        // User denied or geolocation failed
        onGeolocationResultRef.current?.({ didSucceed: false });
      }
    );
  }, [isLoaded, isGeolocationEnabled]);

  const ariaDescribedBy = error
    ? `${name}-error`
    : description
      ? `${name}-description`
      : hint
        ? `${name}-hint`
        : undefined;

  return (
    <FieldContainer className={containerClassName} name={name}>
      <FieldUpper
        corner={corner}
        description={description}
        label={label}
        name={name}
        required={!!required}
      />

      <div className="pui:relative pui:grid pui:grid-cols-1">
        {/* Visual container styled like FieldBaseInput via inputVariants.
            focus-within: replaces focus: because the actual input lives
            in the gmp-place-autocomplete shadow DOM. */}
        <span
          aria-describedby={ariaDescribedBy}
          aria-invalid={!!error || undefined}
          id={`${name}-input`}
          className={inputVariants({
            className: cx(
              'pui:flex pui:items-center',
              disabled &&
                'pui:cursor-not-allowed pui:bg-pui-bg-subtle pui:text-pui-fg-subtle pui:border-pui-bg-subtle',
              !disabled &&
                'pui:focus-within:outline-none pui:focus-within:border-pui-input-border-focus',
              !disabled &&
                (error
                  ? 'pui:focus-within:shadow-[0_0_0_2px_var(--color-pui-feedback-error)]'
                  : 'pui:focus-within:shadow-pui-input-focus')
            ),
            error: !!error,
            leading: !!leading,
            trailing: !!trailing
          })}
        >
          {/* Placeholder input — defines the container height and shows
              during SSR / before Google API loads */}
          <input
            aria-hidden
            disabled
            className="pui:invisible"
            placeholder={isLoaded ? undefined : placeholder}
            tabIndex={-1}
            style={{
              background: 'transparent',
              border: 'none',
              font: 'inherit',
              outline: 'none',
              padding: 0,
              width: '100%'
            }}
          />
        </span>

        {/* The gmp-place-autocomplete element is mounted here via ref.
            Absolutely positioned to overlay the visual container without
            affecting its height. The dropdown overflows naturally below.
            No padding here — padding is applied to the shadow DOM input
            via --gmp-pl / --gmp-pr custom properties so the dropdown
            can span the full container width. */}
        <span
          ref={containerRef}
          className="pui:absolute pui:inset-0 pui:z-10 pui:flex pui:items-center pui:overflow-visible"
        />

        {leading && (
          <FieldAddon
            leading
            asChild={typeof leading !== 'string'}
            trailing={!!trailing}
          >
            {leading}
          </FieldAddon>
        )}
        {trailing && (
          <FieldAddon
            trailing
            asChild={typeof trailing !== 'string'}
            leading={!!leading}
          >
            {trailing}
          </FieldAddon>
        )}
      </div>

      <FieldLower error={error} hint={hint} name={name} />
    </FieldContainer>
  );
};

export default FieldGooglePlacesAutocomplete;
