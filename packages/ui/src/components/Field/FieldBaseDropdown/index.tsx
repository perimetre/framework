'use client';

import { getBrandVariant } from '@/lib/brand-registry';
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions
} from '@headlessui/react';
import { type ForceRequiredProps } from '@perimetre/helpers/types';
import {
  fieldBaseDropdownInputBrandVariants,
  fieldBaseDropdownOptionBrandVariants,
  fieldBaseDropdownOptionsBrandVariants,
  type FieldBaseDropdownInputVariantProps
} from './brands';

export type DropdownItem = {
  id: number | string;
  label: string;
};

export type FieldBaseDropdownProps<T extends DropdownItem> = {
  /** Additional class name for the trigger button. */
  className?: string;
  /** Default value for uncontrolled usage. */
  defaultValue?: null | T | T[];
  /** Whether the dropdown is disabled. */
  disabled?: boolean;
  /** Custom render for the trigger's selected text. */
  displayValue?: (value: null | T | T[]) => React.ReactNode;
  /** The items to display. */
  items: T[];
  /**
   * Enable multi-select (value becomes an array). Named to mirror the native
   * `<select multiple>` / HeadlessUI Listbox API.
   */
  // eslint-disable-next-line react/boolean-prop-naming
  multiple?: boolean;
  /** Input name for form submission. */
  name: string;
  /** Called when the selection changes. */
  onChange?: (value: null | T | T[]) => void;
  /** Placeholder shown when nothing is selected. */
  placeholder?: string;
  /** Custom render for each option (defaults to `item.label`). */
  renderItem?: (item: T) => React.ReactNode;
  /** Controlled value. */
  value?: null | T | T[];
} & ForceRequiredProps<
  FieldBaseDropdownInputVariantProps,
  'error' | 'leading' | 'trailing'
>;

/**
 * Base dropdown for a Field — a pure select-from-list control (no text input),
 * built on `\@headlessui/react` Listbox for full ARIA support and keyboard
 * navigation. Single- or multi-select via `multiple`.
 *
 * Owns its brand variants (see `./brands`) so the trigger, panel, and options
 * can be themed per brand independently of the autocomplete/select fields.
 * Acorn matches those fields; brands (e.g. OIQ) layer their own look via
 * dropdown-scoped tokens and minimal class overrides.
 */
function FieldBaseDropdown<T extends DropdownItem>({
  className,
  defaultValue,
  disabled,
  displayValue,
  error,
  items,
  leading,
  multiple,
  name,
  onChange,
  placeholder,
  renderItem,
  trailing,
  value
}: FieldBaseDropdownProps<T>) {
  const buttonVariants = getBrandVariant(fieldBaseDropdownInputBrandVariants);
  const optionsVariants = getBrandVariant(
    fieldBaseDropdownOptionsBrandVariants
  );
  const optionVariants = getBrandVariant(fieldBaseDropdownOptionBrandVariants);

  const selectedArray = Array.isArray(value) ? value : [];
  const selectedSingle = Array.isArray(value) ? null : (value ?? null);

  const hasSelection = multiple
    ? selectedArray.length > 0
    : selectedSingle !== null;

  const triggerContent: React.ReactNode = displayValue
    ? displayValue(value ?? null)
    : multiple
      ? selectedArray.length > 0
        ? selectedArray.map((item) => item.label).join(', ')
        : placeholder
      : (selectedSingle?.label ?? placeholder);

  const button = (
    <ListboxButton
      aria-invalid={!!error || undefined}
      id={`${name}-button`}
      className={buttonVariants({
        className: [
          'pui:text-left pui:truncate',
          hasSelection ? null : 'pui:text-pui-input-placeholder',
          className
        ],
        error,
        leading,
        trailing
      })}
    >
      <>{triggerContent}</>
    </ListboxButton>
  );

  const options = (
    <ListboxOptions
      transition
      anchor={{ to: 'bottom start', gap: 0, padding: 8 }}
      className={optionsVariants({
        className: 'pui:w-(--button-width) pui:!max-h-60'
      })}
    >
      {items.map((item) => (
        <ListboxOption key={item.id} className={optionVariants()} value={item}>
          <>{renderItem ? renderItem(item) : item.label}</>
        </ListboxOption>
      ))}
    </ListboxOptions>
  );

  // Two explicit branches so HeadlessUI's Listbox generics resolve cleanly
  // (its single/multiple value types are mutually exclusive).
  if (multiple) {
    return (
      <Listbox<'div', T[]>
        multiple
        by="id"
        disabled={disabled}
        name={name}
        onChange={(next) => onChange?.(next)}
        {...(value !== undefined ? { value: selectedArray } : {})}
        {...(defaultValue !== undefined
          ? { defaultValue: (defaultValue as null | T[]) ?? [] }
          : {})}
      >
        {button}
        {options}
      </Listbox>
    );
  }

  return (
    <Listbox<'div', null | T>
      by="id"
      disabled={disabled}
      name={name}
      onChange={(next) => onChange?.(next)}
      {...(value !== undefined ? { value: selectedSingle } : {})}
      {...(defaultValue !== undefined
        ? { defaultValue: (defaultValue as null | T) ?? null }
        : {})}
    >
      {button}
      {options}
    </Listbox>
  );
}

export default FieldBaseDropdown;
