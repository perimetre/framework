'use client';

import { type ForceRequiredProps } from '@perimetre/helpers/types';
import { ChevronDown } from 'lucide-react';
import FieldAddon from '../FieldAddon';
import FieldBaseAutocomplete, {
  type AutocompleteItem,
  type FieldBaseAutocompleteProps
} from '../FieldBaseAutocomplete';
import FieldContainer from '../FieldContainer';
import FieldLower, { type FieldLowerProps } from '../FieldLower';
import FieldUpper, { type FieldUpperProps } from '../FieldUpper';

export type FieldAutocompleteProps<T extends AutocompleteItem> = {
  containerClassName?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
} & ForceRequiredProps<Partial<FieldLowerProps>, 'error'> &
  Omit<FieldBaseAutocompleteProps<T>, 'error' | 'leading' | 'trailing'> &
  Partial<FieldUpperProps>;

/**
 * Form autocomplete field. Same structure as FieldInput/FieldSelect:
 * label, addons, description, error, hint. Uses `\@headlessui/react` Combobox
 * for accessible autocomplete with keyboard navigation.
 *
 * Filtering is **not** done internally — consumers pass filtered `items` and
 * use `onQueryChange` to drive their own filter/fetch logic.
 * @example
 * **Basic usage (uncontrolled with client-side filtering):**
 * ```tsx
 * const allItems = [
 *   { id: 1, label: 'Apple' },
 *   { id: 2, label: 'Banana' },
 *   { id: 3, label: 'Cherry' },
 * ];
 *
 * const [query, setQuery] = useState('');
 * const filtered = useMemo(
 *   () =>
 *     query === ''
 *       ? allItems
 *       : allItems.filter((item) =>
 *           item.label.toLowerCase().includes(query.toLowerCase())
 *         ),
 *   [allItems, query]
 * );
 *
 * <FieldAutocomplete
 *   name="fruit"
 *   label="Favorite Fruit"
 *   error={errors.fruit?.message}
 *   items={filtered}
 *   onQueryChange={setQuery}
 *   onClose={() => setQuery('')}
 * />
 * ```
 * @example
 * **Controlled with react-hook-form (`Controller`):**
 *
 * Use `Controller` when the form value differs from the autocomplete item
 * (e.g. storing a country code string instead of the full item object).
 * ```tsx
 * <Controller
 *   control={control}
 *   name="countryCode"
 *   render={({ field, fieldState }) => {
 *     const selected =
 *       countries.find((c) => c.id === field.value) ?? null;
 *     return (
 *       <FieldAutocomplete
 *         name={field.name}
 *         label="Country"
 *         error={fieldState.error?.message}
 *         items={filteredCountries}
 *         value={selected}
 *         onChange={(item) => {
 *           if (item && 'id' in item) {
 *             field.onChange(item.id);
 *           } else {
 *             field.onChange('');
 *           }
 *         }}
 *         onClose={() => {
 *           field.onBlur();
 *           setQuery('');
 *         }}
 *         onQueryChange={setQuery}
 *       />
 *     );
 *   }}
 * />
 * ```
 * @example
 * **Virtual scrolling for large lists:**
 * ```tsx
 * <FieldAutocomplete
 *   isVirtual
 *   name="item"
 *   label="Select Item"
 *   error={errors.item?.message}
 *   items={filteredItems}
 *   onQueryChange={setQuery}
 *   onClose={() => setQuery('')}
 * />
 * ```
 * @example
 * **Async loading:**
 * ```tsx
 * const [isLoading, setIsLoading] = useState(false);
 * const [items, setItems] = useState<AutocompleteItem[]>([]);
 *
 * const handleQueryChange = (q: string) => {
 *   if (!q) { setItems([]); return; }
 *   setIsLoading(true);
 *   fetchItems(q).then((results) => {
 *     setItems(results);
 *     setIsLoading(false);
 *   });
 * };
 *
 * <FieldAutocomplete
 *   name="search"
 *   label="Search"
 *   error={errors.search?.message}
 *   isLoading={isLoading}
 *   items={items}
 *   onQueryChange={handleQueryChange}
 *   onClose={() => setItems([])}
 * />
 * ```
 */
function FieldAutocomplete<T extends AutocompleteItem>({
  containerClassName,
  corner,
  description,
  error,
  hint,
  label,
  leading,
  name,
  trailing,
  ...autocompleteProps
}: FieldAutocompleteProps<T>) {
  const trailingContent = trailing ?? (
    <ChevronDown
      aria-hidden
      className="pui:flex pui:size-5 pui:items-center pui:justify-center pui:sm:size-4"
    />
  );

  return (
    <FieldContainer className={containerClassName} name={name}>
      <FieldUpper
        corner={corner}
        description={description}
        label={label}
        name={name}
        required={false}
      />

      <div className="pui:relative pui:grid pui:grid-cols-1">
        <FieldBaseAutocomplete<T>
          trailing
          error={!!error}
          leading={!!leading}
          name={name}
          {...autocompleteProps}
        />

        {leading && (
          <FieldAddon
            leading
            asChild={typeof leading !== 'string'}
            trailing={false}
          >
            {leading}
          </FieldAddon>
        )}
        <FieldAddon
          trailing
          asChild={typeof trailingContent !== 'string'}
          leading={!!leading}
        >
          {trailingContent}
        </FieldAddon>
      </div>

      <FieldLower error={error} hint={hint} name={name} />
    </FieldContainer>
  );
}

export default FieldAutocomplete;
export type { AutocompleteItem } from '../FieldBaseAutocomplete';
