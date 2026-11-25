import { setOptions } from '@googlemaps/js-api-loader';
import type { Story, StoryDefault } from '@ladle/react';
import { useAsyncOptions } from '@ui-sdk/react/async-options';
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList
} from '@ui-sdk/react/autocomplete';
import { useState } from 'react';
import { createPlacesSession } from './index';

// Google's loader takes its key once, before the first library loads.
const key: unknown = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
if (typeof key === 'string') setOptions({ key, v: 'weekly' });

export default {
  decorators: [
    /**
     * Shows the story only when there is a key to load Google with.
     * @param Component - The story
     */
    (Component) =>
      typeof key === 'string' ? (
        <Component />
      ) : (
        <p>Set VITE_GOOGLE_MAPS_API_KEY in .env.local to see this story.</p>
      )
  ],
  title: 'Utilities/createPlacesSession'
} satisfies StoryDefault;

/** Type an address. Choosing a suggestion fetches its location. */
export const Places: Story = () => {
  const [places] = useState(() => createPlacesSession());
  const { items, setQuery, status } = useAsyncOptions(places.load);
  const [location, setLocation] = useState('');

  return (
    <Autocomplete
      filter={false}
      items={items.map(({ label, value }) => ({ label, value }))}
      status={status}
      onValueChange={(value, details) => {
        const chosen = items.find((item) => item.value === details.item?.value);
        if (!chosen) {
          setQuery(value);
          return;
        }
        void places.select(chosen, ['location']).then((result) => {
          if (result.ok) setLocation(JSON.stringify(result.place.location));
        });
      }}
    >
      <AutocompleteInput aria-label="Address" className="border" />
      <AutocompleteContent className="bg-white">
        <AutocompleteList>
          {items.map((suggestion) => (
            <AutocompleteItem
              key={suggestion.value}
              className="data-highlighted:bg-slate-100"
              label={suggestion.label}
              value={suggestion.value}
            >
              {suggestion.label}
            </AutocompleteItem>
          ))}
        </AutocompleteList>
        {/* Google's terms require this text, unaltered and untranslated. */}
        <span translate="no">Google Maps</span>
      </AutocompleteContent>
      <output>{location}</output>
    </Autocomplete>
  );
};
