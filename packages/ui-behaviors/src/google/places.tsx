'use client';

import { importLibrary } from '@googlemaps/js-api-loader';
import {
  type AsyncOptionsOptions,
  useAsyncOptions
} from '@ui-sdk/react/async-options';
import { Autocomplete, AutocompleteList } from '@ui-sdk/react/autocomplete';
import { type PartProps, renderElement } from '@ui-sdk/react/primitive';
import {
  type ComponentProps,
  createContext,
  type ReactElement,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useRef
} from 'react';

/**
 * What narrows the suggestions: Google's own request, without the text and
 * the session token, which are handled here. For example
 * `includedRegionCodes`, `includedPrimaryTypes`, `locationBias`,
 * `locationRestriction`, `language`, `region` and `origin`.
 */
export type PlacesRequest = Omit<
  google.maps.places.AutocompleteRequest,
  'input' | 'sessionToken'
>;

/** One suggested place. */
export type PlaceSuggestion = {
  /** The whole suggestion as text. The field is filled with it when chosen. */
  label: string;
  /** The main part, like a street address or a business name. */
  mainText: string;
  /**
   * Where the typed text matches `mainText`, as character ranges: from
   * `startOffset`, up to and not including `endOffset`.
   */
  matches: { endOffset: number; startOffset: number }[];
  /** Google's prediction, for anything not copied here. */
  prediction: google.maps.places.PlacePrediction;
  /** The rest, like the city and country. */
  secondaryText: string;
  /** The place ID. Identifies the suggestion. */
  value: string;
};

/**
 * Copies what a list needs out of Google's prediction.
 * @param prediction - Google's prediction
 */
const toSuggestion = (
  prediction: google.maps.places.PlacePrediction
): PlaceSuggestion => ({
  label: prediction.text.text,
  mainText: prediction.mainText?.text ?? prediction.text.text,
  matches: (prediction.mainText?.matches ?? []).map((match) => ({
    endOffset: match.endOffset,
    startOffset: match.startOffset
  })),
  prediction,
  secondaryText: prediction.secondaryText?.text ?? '',
  value: prediction.placeId
});

/**
 * Loads place suggestions from Google as someone types, in the shape UI
 * SDK's `Autocomplete` and `Combobox` take, and keeps Google's session
 * tokens right: one token for a run of typing, ended by fetching the chosen
 * place's details, then a new one.
 *
 * Set the API key once with `setOptions` from `@googlemaps/js-api-loader`
 * before this runs.
 * @param request - What narrows the suggestions, like `includedRegionCodes`
 * @param options - When to load: `debounce`, `minLength`
 */
export const usePlacesOptions = (
  request?: PlacesRequest,
  options?: AsyncOptionsOptions
) => {
  // The loader is created once, so it reads the newest request from a ref.
  const latestRequest = useRef(request);
  useEffect(() => {
    latestRequest.current = request;
  });

  const token = useRef<google.maps.places.AutocompleteSessionToken | null>(
    null
  );

  const results = useAsyncOptions<PlaceSuggestion>(
    async (query, { signal }) => {
      if (!query.trim()) return [];

      const { AutocompleteSessionToken, AutocompleteSuggestion } =
        await importLibrary('places');
      token.current ??= new AutocompleteSessionToken();

      const { suggestions } =
        await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          ...latestRequest.current,
          input: query,
          sessionToken: token.current
        });

      // Google's request cannot be cancelled, so a replaced one is dropped here.
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

      return suggestions.flatMap((suggestion) =>
        suggestion.placePrediction
          ? [toSuggestion(suggestion.placePrediction)]
          : []
      );
    },
    options
  );

  /**
   * Fetches the details of a chosen suggestion. This ends the session, so
   * the next search starts a new one.
   * @param suggestion - The suggestion that was chosen
   * @param fields - The place fields to fetch. They set the price of the request.
   */
  const select = useCallback(
    async (suggestion: PlaceSuggestion, fields: string[]) => {
      const place = suggestion.prediction.toPlace();
      try {
        await place.fetchFields({ fields });
      } finally {
        // A token must not be reused once details were asked for with it.
        token.current = null;
      }
      return place;
    },
    []
  );

  return { ...results, select };
};

const SuggestionsContext = createContext<null | PlaceSuggestion[]>(null);

export type PlacesAutocompleteProps = {
  /**
   * How long typing must pause before suggestions load, in milliseconds.
   * @default 200
   */
  debounce?: number;
  /**
   * The place fields to fetch when a suggestion is chosen, like
   * `['location', 'formattedAddress', 'addressComponents']`. They set the
   * price of the request, so ask only for what is used.
   */
  fields: string[];
  /**
   * How many characters are typed before suggestions load.
   * @default 0
   */
  minLength?: number;
  /** Runs when fetching the chosen place's details fails. */
  onPlaceError?: (error: unknown, suggestion: PlaceSuggestion) => void;
  /** Runs with the chosen place, once its `fields` are fetched. */
  onPlaceSelect?: (
    place: google.maps.places.Place,
    suggestion: PlaceSuggestion
  ) => void;
  /** What narrows the suggestions, like `includedRegionCodes`. */
  request?: PlacesRequest;
} & Omit<ComponentProps<typeof Autocomplete>, 'filter' | 'items' | 'status'>;

/**
 * UI SDK's `Autocomplete`, wired to Google's place suggestions. Compose it
 * with UI SDK's own `AutocompleteInput`, `AutocompleteContent`,
 * `AutocompleteItem` and the rest, and with `PlacesAutocompleteList` and
 * `PlacesAttribution` from here.
 *
 * The field's value is the text, as with any `Autocomplete`: someone may
 * type an address and never choose a suggestion. `onPlaceSelect` runs only
 * when one is chosen.
 * @example
 * <PlacesAutocomplete fields={['location']} onPlaceSelect={(place) => setOrigin(place.location)}>
 *   <AutocompleteLabel>Address</AutocompleteLabel>
 *   <AutocompleteInput />
 *   <AutocompleteContent>
 *     <PlacesAutocompleteList>
 *       {(suggestion) => (
 *         <AutocompleteItem key={suggestion.value} label={suggestion.label} value={suggestion.value}>
 *           {suggestion.mainText} <small>{suggestion.secondaryText}</small>
 *         </AutocompleteItem>
 *       )}
 *     </PlacesAutocompleteList>
 *     <PlacesAttribution />
 *   </AutocompleteContent>
 * </PlacesAutocomplete>
 * @param props - `Autocomplete`'s props, and the Places ones
 */
export const PlacesAutocomplete = (
  props: PlacesAutocompleteProps
): ReactElement => {
  const {
    debounce,
    fields,
    minLength,
    onPlaceError,
    onPlaceSelect,
    onValueChange,
    request,
    ...rest
  } = props;
  const places = usePlacesOptions(request, { debounce, minLength });
  const { items, select, setQuery } = places;

  return (
    <SuggestionsContext value={items}>
      <Autocomplete
        {...rest}
        filter={false}
        items={items.map(({ label, value }) => ({ label, value }))}
        status={places.status}
        onValueChange={(value, details) => {
          onValueChange?.(value, details);
          if (details.canceled) return;

          const chosen = details.item
            ? items.find((item) => item.value === details.item?.value)
            : undefined;
          if (!chosen) {
            setQuery(value);
            return;
          }

          // Choosing fills the field with the suggestion's text. Searching
          // for that text again would start a session nobody uses.
          select(chosen, fields).then(
            (place) => onPlaceSelect?.(place, chosen),
            (error: unknown) => onPlaceError?.(error, chosen)
          );
        }}
      />
    </SuggestionsContext>
  );
};

export type PlacesAutocompleteListProps = {
  /** Renders one suggestion, as an `AutocompleteItem` with a `key`. */
  children: (suggestion: PlaceSuggestion) => ReactNode;
} & Omit<ComponentProps<typeof AutocompleteList>, 'children'>;

/**
 * UI SDK's `AutocompleteList`, holding the current place suggestions. Its
 * child is a function that renders one suggestion as an `AutocompleteItem`.
 * Pass the suggestion's `value` and `label` on to the item.
 * @param props - `AutocompleteList`'s props, with a function as children
 */
export const PlacesAutocompleteList = (
  props: PlacesAutocompleteListProps
): ReactElement => {
  const { children, ...rest } = props;
  const suggestions = use(SuggestionsContext);
  if (!suggestions) {
    throw new Error(
      'PlacesAutocompleteList must be used inside a PlacesAutocomplete.'
    );
  }

  return (
    <AutocompleteList {...rest}>{suggestions.map(children)}</AutocompleteList>
  );
};

/**
 * The attribution Google requires wherever its place suggestions show
 * without a Google map: put it inside the suggestions popup. It renders the
 * text "Google Maps", which Google's terms say must not be altered or
 * translated; pass Google's logo as children to show that instead.
 * @param props - The element's props, and `render`
 */
export const PlacesAttribution = (props: PartProps<'span'>): ReactElement => {
  const { children, render, ...rest } = props;
  return renderElement(
    'span',
    {
      'data-slot': 'places-attribution',
      translate: 'no',
      ...rest,
      children: children ?? 'Google Maps'
    },
    render
  );
};
