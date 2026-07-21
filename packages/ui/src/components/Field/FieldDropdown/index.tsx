'use client';

import { type ForceRequiredProps } from '@perimetre/helpers/types';
import { ChevronDown } from 'lucide-react';
import FieldAddon from '../FieldAddon';
import FieldBaseDropdown, {
  type DropdownItem,
  type FieldBaseDropdownProps
} from '../FieldBaseDropdown';
import FieldContainer from '../FieldContainer';
import FieldLower, { type FieldLowerProps } from '../FieldLower';
import FieldUpper, { type FieldUpperProps } from '../FieldUpper';

export type FieldDropdownProps<T extends DropdownItem> = {
  containerClassName?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
} & ForceRequiredProps<Partial<FieldLowerProps>, 'error'> &
  Omit<FieldBaseDropdownProps<T>, 'error' | 'leading' | 'trailing'> &
  Partial<FieldUpperProps>;

/**
 * Form dropdown field. Same structure as FieldAutocomplete/FieldSelect
 * (label, addons, description, error, hint) but a pure select-from-list
 * control built on `\@headlessui/react` Listbox — no text input. Single- or
 * multi-select via `multiple`.
 * @example
 * ```tsx
 * <FieldDropdown
 *   name="type"
 *   label="Type d'activité"
 *   placeholder="Tous les types"
 *   error={errors.type?.message}
 *   items={[{ id: 'a', label: 'Type A' }, { id: 'b', label: 'Type B' }]}
 *   value={selected}
 *   onChange={setSelected}
 * />
 * ```
 */
function FieldDropdown<T extends DropdownItem>({
  containerClassName,
  corner,
  description,
  error,
  hint,
  label,
  leading,
  name,
  trailing,
  ...dropdownProps
}: FieldDropdownProps<T>) {
  // Default indicator is the lucide chevron. Brands that need a different glyph
  // (e.g. OIQ's Fontisto angle-down in brand purple) pass their own `trailing`.
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
        <FieldBaseDropdown<T>
          trailing
          error={!!error}
          leading={!!leading}
          name={name}
          {...dropdownProps}
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

export default FieldDropdown;
export type { DropdownItem } from '../FieldBaseDropdown';
