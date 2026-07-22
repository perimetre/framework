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

/**
 * Render state HeadlessUI exposes for each option, forwarded to the per-item
 * `itemLeading`/`itemTrailing` render props so a callee can vary the addon by
 * selection (e.g. a check only on the selected item).
 */
export type DropdownOptionState = {
  disabled: boolean;
  focus: boolean;
  selected: boolean;
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
  /**
   * Custom render for an option's leading slot, keyed on selection state.
   * Mirrors the field's `leading` addon but per-item — return `null` to omit.
   */
  itemLeading?: (item: T, state: DropdownOptionState) => React.ReactNode;
  /** The items to display. */
  items: T[];
  /**
   * Custom render for an option's trailing slot, keyed on selection state.
   * Mirrors the field's `trailing` addon but per-item — return `null` to omit.
   */
  itemTrailing?: (item: T, state: DropdownOptionState) => React.ReactNode;
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
  itemLeading,
  itemTrailing,
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
          {(state) => {
            const itemLeadingContent = itemLeading?.(item, state);
            const itemTrailingContent = itemTrailing?.(item, state);
            return (
              <span className="pui:flex pui:w-full pui:items-center pui:gap-2">
                {itemLeadingContent != null && (
                  <span className="pui:flex pui:shrink-0 pui:items-center">
                    {itemLeadingContent}
                  </span>
                )}
                <span className="pui:min-w-0 pui:flex-1 pui:truncate">
                  {renderItem ? renderItem(item) : item.label}
                </span>
                {itemTrailingContent != null && (
                  <span className="pui:flex pui:shrink-0 pui:items-center">
                    {itemTrailingContent}
                  </span>
                )}
              </span>
            );
          }}
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
