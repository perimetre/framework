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
 * Filtering is NOT done internally — consumers pass filtered `items` and
 * use `onQueryChange` to drive their own filter/fetch logic.
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
