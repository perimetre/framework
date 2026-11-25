import { importLibrary } from '@googlemaps/js-api-loader';

/**
 * How fetching a chosen place's details ended: the place, or a
 * `PlaceDetailsError`. Narrow with `'ok' in result`.
 */
export type PlaceDetailsResult =
  | { ok: true; place: google.maps.places.Place }
  | PlaceDetailsError;

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

/** One suggested place, in the shape UI SDK's lists take: a `value` and a `label`. */
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

/** Fetching a chosen place's details failed. `cause` holds Google's error. */
export class PlaceDetailsError extends Error {
  override name = 'PlaceDetailsError';

  /**
   * Wraps the error Google's request threw.
   * @param cause - What Google threw
   */
  constructor(cause: unknown) {
    super("Could not fetch the chosen place's details", { cause });
  }
}

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
 * Loads place suggestions from Google and keeps its session tokens right: one
 * token for a run of typing, ended by fetching the chosen place's details,
 * then a new one. Google bills by session, so a token reused after details
 * were fetched costs more.
 *
 * `load` is a loader for UI SDK's `useAsyncOptions` (and its Vue, Svelte and
 * Solid equivalents), which debounces typing and drops replaced requests:
 *
 * ```tsx
 * const [places] = useState(() => createPlacesSession(() => ({ includedRegionCodes: ["ca"] })))
 * const options = useAsyncOptions(places.load)
 * ```
 *
 * Set the API key once with `setOptions` from `@googlemaps/js-api-loader`
 * before the first load.
 * Story: `src/utilities/google-places/google-places.stories.tsx`, shipped with the package, shows
 * an address field on UI SDK's `Autocomplete`.
 * @param request - Reads what narrows the suggestions, on every load
 */
export const createPlacesSession = (
  request?: () => PlacesRequest | undefined
) => {
  let token: google.maps.places.AutocompleteSessionToken | null = null;

  return {
    /**
     * Loads the suggestions for some text. Throws when Google fails, which
     * `useAsyncOptions` turns into its `error` status.
     * @param query - What was typed
     * @param options - The loader's options
     * @param options.signal - Aborted when a newer search replaces this one
     */
    load: async (query: string, options: { signal: AbortSignal }) => {
      if (!query.trim()) return [];

      const { AutocompleteSessionToken, AutocompleteSuggestion } =
        await importLibrary('places');
      token ??= new AutocompleteSessionToken();

      const { suggestions } =
        await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          ...request?.(),
          input: query,
          sessionToken: token
        });

      // Google's request cannot be cancelled, so a replaced one is dropped here.
      if (options.signal.aborted)
        throw new DOMException('Aborted', 'AbortError');

      return suggestions.flatMap((suggestion) =>
        suggestion.placePrediction
          ? [toSuggestion(suggestion.placePrediction)]
          : []
      );
    },
    /**
     * Fetches the details of a chosen suggestion, as a value and never a
     * throw. This ends the session, so the next search starts a new one.
     * @param suggestion - The suggestion that was chosen
     * @param fields - The place fields to fetch. They set the price of the request.
     */
    select: async (
      suggestion: PlaceSuggestion,
      fields: string[]
    ): Promise<PlaceDetailsResult> => {
      const place = suggestion.prediction.toPlace();
      try {
        await place.fetchFields({ fields });
        return { ok: true as const, place };
      } catch (error) {
        return new PlaceDetailsError(error);
      } finally {
        // A token must not be reused once details were asked for with it.
        token = null;
      }
    }
  };
};

/** What `createPlacesSession` returns. */
export type PlacesSession = ReturnType<typeof createPlacesSession>;
