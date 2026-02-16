'use client';

import { getBrandVariant } from '@/lib/brand-registry';
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions
} from '@headlessui/react';
import { type ForceRequiredProps } from '@perimetre/helpers/types';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  fieldBaseAutocompleteInputBrandVariants,
  fieldBaseAutocompleteOptionBrandVariants,
  fieldBaseAutocompleteOptionsBrandVariants,
  type FieldBaseAutocompleteInputVariantProps
} from './brands';

export type AutocompleteItem = {
  id: number | string;
  label: string;
};

export type FieldBaseAutocompleteProps<T extends AutocompleteItem> = {
  /** Additional class name for the input */
  className?: string;
  /** Default value for uncontrolled usage */
  defaultValue?: null | T;
  /** Whether the autocomplete is disabled */
  disabled?: boolean;
  /** Custom display value function for the input text */
  displayValue?: (item: null | T) => string;
  /** Custom empty state content shown when there are no results */
  emptyState?: React.ReactNode;
  /** Whether the dropdown should show a loading state */
  isLoading?: boolean;
  /** Whether the field is read-only */
  isReadOnly?: boolean;
  /** Enable virtual scrolling for large lists */
  isVirtual?: boolean;
  /** The items to display in the dropdown (consumer handles filtering) */
  items: T[];
  /** Input name for form submission */
  name: string;
  /** Called when the selected value changes */
  onChange?: (value: null | T) => void;
  /** Called when the dropdown closes */
  onClose?: () => void;
  /** Called when the input query text changes (for consumer-side filtering/fetching) */
  onQueryChange?: (query: string) => void;
  /** When true, the dropdown opens on focus (not just on typing) */
  openOnFocus?: boolean;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Custom render function for each option */
  renderItem?: (item: T) => React.ReactNode;
  /** Controlled value */
  value?: null | T;
} & ForceRequiredProps<
  FieldBaseAutocompleteInputVariantProps,
  'error' | 'leading' | 'trailing'
>;

/**
 * Base autocomplete combobox for a Field. Uses `\@headlessui/react` Combobox
 * for full ARIA support, keyboard navigation, and optional virtual scrolling.
 *
 * Filtering is NOT done internally — consumers pass filtered `items` and
 * use `onQueryChange` to drive their own filter/fetch logic.
 */
function FieldBaseAutocomplete<T extends AutocompleteItem>({
  className,
  defaultValue,
  disabled,
  displayValue,
  emptyState,
  error,
  isLoading,
  isReadOnly,
  isVirtual,
  items,
  leading,
  name,
  onChange,
  onClose,
  onQueryChange,
  openOnFocus,
  placeholder,
  renderItem,
  trailing,
  value
}: FieldBaseAutocompleteProps<T>) {
  const inputVariants = getBrandVariant(
    fieldBaseAutocompleteInputBrandVariants
  );
  const optionsVariants = getBrandVariant(
    fieldBaseAutocompleteOptionsBrandVariants
  );
  const optionVariants = getBrandVariant(
    fieldBaseAutocompleteOptionBrandVariants
  );

  const getDisplayValue =
    displayValue ?? ((item: null | T) => item?.label ?? '');

  // When virtual scrolling + openOnFocus are combined, HeadlessUI's virtualizer
  // calls scrollToIndex during the ref commit phase before the scroll container
  // (optionsElement) is in the DOM, causing a null requestAnimationFrame crash.
  // Deferring `immediate` by one frame lets the scroll container mount first.
  const [deferredImmediate, setDeferredImmediate] = useState(false);
  useEffect(() => {
    if (isVirtual && openOnFocus) {
      const frame = requestAnimationFrame(() => { setDeferredImmediate(true); });
      return () => { cancelAnimationFrame(frame); };
    }
  }, [isVirtual, openOnFocus]);

  const comboboxProps = {
    disabled: disabled ?? isReadOnly,
    immediate: isVirtual ? deferredImmediate : openOnFocus,
    name,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onChange: isReadOnly ? () => {} : (onChange as (value: null | T) => void),
    onClose,
    // Headless UI uses `value !== undefined` to determine controlled vs uncontrolled mode.
    // We preserve null (controlled, no selection) instead of coercing to undefined (uncontrolled).
    ...(value !== undefined ? { value: value as T | undefined } : {}),
    ...(defaultValue !== undefined
      ? { defaultValue: defaultValue as T | undefined }
      : {}),
    ...(isVirtual ? { virtual: { options: items } } : {})
  };

  /** Renders a single combobox option row. */
  const renderOptions = (item: T) => (
    <ComboboxOption key={item.id} className={optionVariants()} value={item}>
      {renderItem ? renderItem(item) : getDisplayValue(item)}
    </ComboboxOption>
  );

  // Virtual scrolling cannot use the `anchor` prop — HeadlessUI's virtualizer
  // calls scrollToIndex before the portaled panel is in the DOM, causing
  // "Cannot read properties of null (reading 'requestAnimationFrame')".
  // Instead we position relative to the parent with CSS.
  const optionsPanelProps = isVirtual
    ? {
        className: optionsVariants({
          className:
            'pui:w-full pui:!max-h-60 pui:absolute pui:top-full pui:left-0 pui:mt-1 pui:z-10'
        })
      }
    : {
        anchor: { to: 'bottom start' as const, gap: 4, padding: 8 },
        className: optionsVariants({
          className: 'pui:w-(--input-width) pui:!max-h-60'
        })
      };

  return (
    <Combobox<T> {...comboboxProps}>
      <ComboboxInput<T>
        aria-invalid={!!error || undefined}
        displayValue={getDisplayValue}
        id={`${name}-input`}
        placeholder={placeholder}
        className={inputVariants({
          className,
          error,
          leading,
          trailing
        })}
        onChange={
          isReadOnly ? undefined : (e) => onQueryChange?.(e.target.value)
        }
      />

      <ComboboxOptions {...optionsPanelProps}>
        {isLoading ? (
          <div className="pui:flex pui:items-center pui:justify-center pui:py-4">
            <Loader2 className="pui:size-5 pui:animate-spin pui:text-pui-fg-muted" />
          </div>
        ) : isVirtual ? (
          ({ option }: { option: T }) => renderOptions(option)
        ) : items.length === 0 ? (
          (emptyState ?? (
            <div className="pui:px-3 pui:py-2 pui:text-sm pui:text-pui-fg-muted">
              No results found
            </div>
          ))
        ) : (
          items.map((item) => renderOptions(item))
        )}
      </ComboboxOptions>
    </Combobox>
  );
}

export default FieldBaseAutocomplete;
