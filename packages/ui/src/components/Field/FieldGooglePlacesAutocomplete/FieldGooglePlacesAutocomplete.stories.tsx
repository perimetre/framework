import type { Story, StoryDefault } from '@ladle/react';
import { AlertTriangle, MapPin, Utensils } from 'lucide-react';
import { useState } from 'react';
import FieldGooglePlacesAutocomplete, {
  type FieldGooglePlacesAutocompleteProps
} from '.';
import FieldInput from '../FieldInput';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

type Props = {
  label: string;
} & FieldGooglePlacesAutocompleteProps;

export default {
  argTypes: {
    corner: {
      control: { type: 'text' }
    },
    description: {
      control: { type: 'text' }
    },
    disabled: {
      control: { type: 'boolean' }
    },
    error: {
      control: { type: 'text' }
    },
    hint: {
      control: { type: 'text' }
    },
    label: {
      control: { type: 'text' },
      defaultValue: 'Address'
    },
    placeholder: {
      control: { type: 'text' },
      defaultValue: 'Search for an address...'
    },
    required: {
      control: { type: 'boolean' },
      defaultValue: true
    }
  }
} satisfies StoryDefault<Props>;

/**
 * Shared place-select handler that logs to the console.
 * The place object contains the fields you requested via the `fields` prop.
 * @see https://developers.google.com/maps/documentation/javascript/place-class-data-fields
 */
function handlePlaceSelect(place: google.maps.places.Place) {
  console.log('Place selected:', {
    displayName: place.displayName,
    formattedAddress: place.formattedAddress,
    location: place.location
      ? { lat: place.location.lat(), lng: place.location.lng() }
      : undefined,
    addressComponents: place.addressComponents,
    plusCode: place.plusCode,
    rating: place.rating,
    priceLevel: place.priceLevel,
    businessStatus: place.businessStatus
  });
}

/**
 * Banner shown when VITE_GOOGLE_MAPS_API_KEY is not configured.
 * Stories still render the component shell (placeholder input) so the
 * layout and styling are always visible, even without a real API key.
 */
function MissingKeyBanner() {
  if (GOOGLE_API_KEY) return null;
  return (
    <div
      style={{
        background: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: 6,
        color: '#92400e',
        fontSize: 13,
        marginBottom: 16,
        padding: '8px 12px'
      }}
    >
      <strong>VITE_GOOGLE_MAPS_API_KEY</strong> is not set. Copy{' '}
      <code>.env.example</code> to <code>.env</code> and add your Google Maps
      API key to enable the autocomplete dropdown.
    </div>
  );
}

export const Default: Story<Props> = ({ ...props }) => (
  <>
    <MissingKeyBanner />
    <FieldGooglePlacesAutocomplete
      containerClassName="pui:max-w-md"
      onPlaceSelect={handlePlaceSelect}
      {...props}
      name="address"
    />
  </>
);
Default.args = {
  label: 'Address',
  placeholder: 'Search for an address...'
};

export const Description: Story<Props> = (props) => <Default {...props} />;
Description.args = {
  ...Default.args,
  description: 'Enter your full shipping address.'
};

export const Hint: Story<Props> = (props) => <Default {...props} />;
Hint.args = {
  ...Default.args,
  hint: 'Start typing to see suggestions.'
};

export const WithError: Story<Props> = (props) => <Default {...props} />;
WithError.args = {
  ...Default.args,
  error: 'Please select a valid address.',
  trailing: (
    <AlertTriangle
      aria-hidden
      className="pui:animate-in pui:fade-in pui:slide-in-from-bottom-25 pui:text-error pui:flex pui:size-5 pui:items-center pui:justify-center pui:sm:size-4"
    />
  )
};

export const Corner: Story<Props> = (props) => <Default {...props} />;
Corner.args = {
  ...Default.args,
  corner: 'Optional'
};

export const Disabled: Story<Props> = (props) => <Default {...props} />;
Disabled.args = {
  ...Default.args,
  disabled: true
};

export const Leading: Story<Props> = (props) => <Default {...props} />;
Leading.args = {
  ...Default.args,
  leading: (
    <MapPin
      aria-hidden
      className="pui:flex pui:size-5 pui:items-center pui:justify-center pui:sm:size-4"
    />
  )
};

export const RegionRestricted: Story<Props> = (props) => <Default {...props} />;
RegionRestricted.args = {
  ...Default.args,
  hint: 'Restricted to Canada and US.',
  includedRegionCodes: ['ca', 'us'],
  label: 'North American Address',
  requestedRegion: 'ca'
};

export const AddressOnly: Story<Props> = (props) => <Default {...props} />;
AddressOnly.args = {
  ...Default.args,
  hint: 'Only street addresses will appear.',
  includedPrimaryTypes: ['address'],
  label: 'Street Address'
};

/**
 * Cost optimization - minimal fields.
 * Only fetches formattedAddress and location (default).
 * This is the most cost-effective configuration.
 */
export const MinimalFields: Story<Props> = (props) => (
  <>
    <MissingKeyBanner />
    <FieldGooglePlacesAutocomplete
      containerClassName="pui:max-w-md"
      onPlaceSelect={(place) => {
        console.log('Minimal fields:', {
          formattedAddress: place.formattedAddress,
          location: place.location
            ? { lat: place.location.lat(), lng: place.location.lng() }
            : undefined
        });
      }}
      {...props}
      name="address-minimal"
    />
  </>
);
MinimalFields.args = {
  label: 'Address (Cost Optimized)',
  placeholder: 'Search for an address...',
  hint: 'Only fetches formattedAddress and location.',
  fields: ['formattedAddress', 'location']
};

/**
 * Advanced fields - restaurant search with ratings and price level.
 * Demonstrates fetching additional fields for business information.
 * Higher cost but provides rich data for business use cases.
 */
export const RestaurantSearch: Story<Props> = (props) => (
  <>
    <MissingKeyBanner />
    <FieldGooglePlacesAutocomplete
      containerClassName="pui:max-w-md"
      onPlaceSelect={(place) => {
        console.log('Restaurant selected:', {
          displayName: place.displayName,
          formattedAddress: place.formattedAddress,
          location: place.location
            ? { lat: place.location.lat(), lng: place.location.lng() }
            : undefined,
          rating: place.rating,
          priceLevel: place.priceLevel,
          businessStatus: place.businessStatus,
          internationalPhoneNumber: place.internationalPhoneNumber,
          websiteURI: place.websiteURI
        });
      }}
      {...props}
      name="restaurant"
    />
  </>
);
RestaurantSearch.args = {
  label: 'Restaurant',
  placeholder: 'Search for a restaurant...',
  hint: 'Fetches rating, price level, and contact info.',
  leading: (
    <Utensils
      aria-hidden
      className="pui:flex pui:size-5 pui:items-center pui:justify-center pui:sm:size-4"
    />
  ),
  fields: [
    'displayName',
    'formattedAddress',
    'location',
    'rating',
    'priceLevel',
    'businessStatus',
    'internationalPhoneNumber',
    'websiteURI'
  ],
  includedPrimaryTypes: ['restaurant', 'cafe', 'bar']
};

/**
 * Location biasing - results biased toward Montreal.
 * Demonstrates location bias to improve relevance for local searches.
 */
export const LocationBiased: Story<Props> = (props) => (
  <>
    <MissingKeyBanner />
    <FieldGooglePlacesAutocomplete
      containerClassName="pui:max-w-md"
      onPlaceSelect={handlePlaceSelect}
      {...props}
      name="biased-address"
    />
  </>
);
LocationBiased.args = {
  label: 'Address (Montreal)',
  placeholder: 'Search near Montreal...',
  hint: 'Results biased toward Montreal, QC.',
  locationBias: { lat: 45.5017, lng: -73.5673 }, // Montreal coordinates
  requestedRegion: 'CA'
};

/**
 * Address components - for parsing address parts.
 * Useful when you need to extract specific address components
 * (street, city, postal code, etc.) for form fields.
 */
export const WithAddressComponents: Story<Props> = (props) => (
  <>
    <MissingKeyBanner />
    <FieldGooglePlacesAutocomplete
      containerClassName="pui:max-w-md"
      onPlaceSelect={(place) => {
        console.log('Address components:', {
          formattedAddress: place.formattedAddress,
          addressComponents: place.addressComponents?.map((component) => ({
            longText: component.longText,
            shortText: component.shortText,
            types: component.types
          }))
        });
      }}
      {...props}
      name="address-components"
    />
  </>
);
WithAddressComponents.args = {
  label: 'Address (With Components)',
  placeholder: 'Search for an address...',
  hint: 'Fetches address components for parsing.',
  fields: ['formattedAddress', 'location', 'addressComponents', 'plusCode']
};

/** Helper to extract a specific address component by type. */
function getAddressComponent(
  components: google.maps.places.AddressComponent[] | undefined,
  type: string
): string {
  return components?.find((c) => c.types.includes(type))?.longText ?? '';
}

/**
 * Address form - demonstrates `formatDisplayValue` and `onPlaceSelect`
 * to fill a multi-field address form from a single autocomplete.
 *
 * When the user selects a place:
 * - The autocomplete input shows only the street address
 * - City, state, country, and postal code fields are filled automatically
 *
 * Requires `addressComponents` in the `fields` prop.
 */
export const AddressForm: Story<Props> = ({ ...props }) => {
  const [fields, setFields] = useState({
    city: '',
    country: '',
    postalCode: '',
    state: ''
  });

  return (
    <>
      <MissingKeyBanner />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxWidth: 480
        }}
      >
        <FieldGooglePlacesAutocomplete
          {...props}
          fields={['formattedAddress', 'addressComponents']}
          name="street-address"
          formatDisplayValue={(place: google.maps.places.Place) => {
            const street = [
              getAddressComponent(place.addressComponents, 'street_number'),
              getAddressComponent(place.addressComponents, 'route')
            ]
              .filter(Boolean)
              .join(' ');
            return street || undefined;
          }}
          onPlaceSelect={(place: google.maps.places.Place) => {
            const components = place.addressComponents;
            setFields({
              city:
                getAddressComponent(components, 'locality') ||
                getAddressComponent(components, 'sublocality_level_1') ||
                getAddressComponent(components, 'administrative_area_level_2'),
              country: getAddressComponent(components, 'country'),
              postalCode: getAddressComponent(components, 'postal_code'),
              state: getAddressComponent(
                components,
                'administrative_area_level_1'
              )
            });
          }}
        />

        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: '1fr 1fr'
          }}
        >
          <FieldInput
            disabled
            error={undefined}
            label="City"
            name="city"
            placeholder="Filled automatically"
            required={false}
            value={fields.city}
          />
          <FieldInput
            disabled
            error={undefined}
            label="State / Province"
            name="state"
            placeholder="Filled automatically"
            required={false}
            value={fields.state}
          />
          <FieldInput
            disabled
            error={undefined}
            label="Country"
            name="country"
            placeholder="Filled automatically"
            required={false}
            value={fields.country}
          />
          <FieldInput
            disabled
            error={undefined}
            label="Postal Code"
            name="postal-code"
            placeholder="Filled automatically"
            required={false}
            value={fields.postalCode}
          />
        </div>
      </div>
    </>
  );
};
AddressForm.args = {
  hint: 'Select an address to auto-fill city, state, country, and postal code.',
  label: 'Street Address',
  placeholder: 'Search for an address...'
};
