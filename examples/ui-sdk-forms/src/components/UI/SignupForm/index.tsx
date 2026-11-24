'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@ui-sdk/react/button';
import { Checkbox, CheckboxIndicator } from '@ui-sdk/react/checkbox';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList
} from '@ui-sdk/react/combobox';
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel
} from '@ui-sdk/react/field';
import { Input } from '@ui-sdk/react/input';
import { Radio, RadioGroup, RadioIndicator } from '@ui-sdk/react/radio';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectTrigger,
  SelectValue
} from '@ui-sdk/react/select';
import { Textarea } from '@ui-sdk/react/textarea';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  COUNTRIES,
  PLANS,
  ROLES,
  type SignupInput,
  signupSchema,
  type SignupValues,
  SOURCES
} from './form';

// The classes are the minimum needed to see state. They are not the example.
const fieldClassName = 'flex flex-col gap-1.5';
const labelClassName = 'text-sm font-medium data-invalid:text-red-700';
const errorClassName = 'text-sm text-red-700';
const controlClassName =
  'w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-600 data-invalid:border-red-600';
const popupClassName =
  'max-h-60 min-w-(--anchor-width) overflow-auto rounded-md border border-neutral-200 bg-white p-1 shadow-lg';
const optionClassName =
  'flex cursor-default items-center justify-between gap-2 rounded px-2 py-1.5 text-sm data-highlighted:bg-neutral-100 data-selected:font-medium';

/**
 * The text the combobox input shows for a value. The items are rendered as
 * parts inside the popup, so the combobox needs this to label a value while
 * the popup is closed.
 * @param value - A country code
 */
const countryLabel = (value: string) =>
  COUNTRIES.find((country) => country.value === value)?.label ?? '';

/**
 * UI SDK form controls in a React Hook Form form.
 *
 * Two ways a control joins the form:
 *
 * - `register()` for controls that are native elements underneath: `Input`,
 *   `Textarea`, and a native `<select>` through `FieldControl`.
 * - `<Controller>` for controls that are not native inputs: `Checkbox`,
 *   `RadioGroup`, `Select`, `Combobox`. They report through `onValueChange` /
 *   `onCheckedChange`, not a DOM change event, so `register()` cannot read
 *   them.
 *
 * An error reaches a control through `Field`'s `invalid` and a `FieldError`.
 * `Field` generates the ids and wires `for`, `aria-describedby` and
 * `aria-invalid` itself.
 */
const SignupForm: React.FC = () => {
  const [submitted, setSubmitted] = useState<null | SignupInput>(null);

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset
  } = useForm<SignupValues, unknown, SignupInput>({
    defaultValues: {
      name: '',
      role: '',
      message: '',
      plan: '',
      source: '',
      country: '',
      terms: false
    },
    mode: 'onTouched',
    resolver: zodResolver(signupSchema)
  });

  return (
    <form
      noValidate
      className="mt-8 flex flex-col gap-6"
      onSubmit={(event) => {
        void handleSubmit(setSubmitted)(event);
      }}
    >
      {/* register(): Input is a native <input>. */}
      <Field className={fieldClassName} invalid={!!errors.name}>
        <FieldLabel className={labelClassName}>Name</FieldLabel>
        <Input
          aria-required
          autoComplete="name"
          className={controlClassName}
          {...register('name')}
        />
        {errors.name && (
          <FieldError match className={errorClassName}>
            {errors.name.message}
          </FieldError>
        )}
      </Field>

      {/* register(): a native <select>, joined to the field by FieldControl. */}
      <Field className={fieldClassName} invalid={!!errors.role}>
        <FieldLabel className={labelClassName}>Role</FieldLabel>
        <FieldControl
          aria-required
          className={controlClassName}
          render={<select />}
          {...register('role')}
        >
          <option value="">Select a role</option>
          {ROLES.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </FieldControl>
        {errors.role && (
          <FieldError match className={errorClassName}>
            {errors.role.message}
          </FieldError>
        )}
      </Field>

      {/* register(): Textarea is a native <textarea>. */}
      <Field className={fieldClassName} invalid={!!errors.message}>
        <FieldLabel className={labelClassName}>
          Anything we should know?
        </FieldLabel>
        <Textarea
          autoResize
          className={`${controlClassName} min-h-20`}
          {...register('message')}
        />
        <FieldDescription className="text-sm text-neutral-600">
          Optional, 280 characters at most.
        </FieldDescription>
        {errors.message && (
          <FieldError match className={errorClassName}>
            {errors.message.message}
          </FieldError>
        )}
      </Field>

      {/* Controller: Select is a custom popup, not a native input. */}
      <Controller
        control={control}
        name="source"
        render={({ field, fieldState }) => (
          <Field className={fieldClassName} invalid={!!fieldState.error}>
            <FieldLabel className={labelClassName}>
              How did you hear about us?
            </FieldLabel>
            {/* virtualFocus keeps focus on the trigger while the list is open,
                as on a native select. Without it, opening the list blurs the
                trigger, which marks the field touched and shows its error
                before the user has chosen anything. */}
            <Select
              virtualFocus
              items={[...SOURCES]}
              name={field.name}
              placeholder="Select an option"
              value={field.value || null}
              onValueChange={(value) => {
                field.onChange(value ?? '');
              }}
            >
              <SelectTrigger
                ref={field.ref}
                aria-required
                className={`${controlClassName} flex items-center justify-between text-left data-placeholder:text-neutral-500`}
                onBlur={field.onBlur}
              >
                <SelectValue />
                <span aria-hidden>▾</span>
              </SelectTrigger>
              <SelectContent className={popupClassName}>
                {SOURCES.map((source) => (
                  <SelectItem
                    key={source.value}
                    className={optionClassName}
                    value={source.value}
                  >
                    {source.label}
                    <SelectItemIndicator aria-hidden>✓</SelectItemIndicator>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.error && (
              <FieldError match className={errorClassName}>
                {fieldState.error.message}
              </FieldError>
            )}
          </Field>
        )}
      />

      {/* Controller: Combobox filters the list itself as the user types. */}
      <Controller
        control={control}
        name="country"
        render={({ field, fieldState }) => (
          <Field className={fieldClassName} invalid={!!fieldState.error}>
            <FieldLabel className={labelClassName}>Country</FieldLabel>
            <Combobox
              itemToLabel={countryLabel}
              name={field.name}
              value={field.value || null}
              onValueChange={(value) => {
                field.onChange(value ?? '');
              }}
            >
              <ComboboxInput
                ref={field.ref}
                aria-required
                className={controlClassName}
                placeholder="Search countries"
                onBlur={field.onBlur}
              />
              <ComboboxContent className={popupClassName}>
                {/* Always in the DOM as a live region; empty:hidden collapses
                    it while there are matches. */}
                <ComboboxEmpty className="px-2 py-1.5 text-sm text-neutral-600 empty:hidden">
                  No country found.
                </ComboboxEmpty>
                <ComboboxList>
                  {COUNTRIES.map((country) => (
                    <ComboboxItem
                      key={country.value}
                      className={optionClassName}
                      value={country.value}
                    >
                      {country.label}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            {fieldState.error && (
              <FieldError match className={errorClassName}>
                {fieldState.error.message}
              </FieldError>
            )}
          </Field>
        )}
      />

      {/* Controller: RadioGroup takes the field's label as its name. */}
      <Controller
        control={control}
        name="plan"
        render={({ field, fieldState }) => (
          <Field className={fieldClassName} invalid={!!fieldState.error}>
            <FieldLabel className={labelClassName}>Plan</FieldLabel>
            <RadioGroup
              ref={field.ref}
              aria-required
              className="flex gap-6"
              name={field.name}
              value={field.value || null}
              onBlur={field.onBlur}
              onValueChange={(value) => {
                field.onChange(value ?? '');
              }}
            >
              {PLANS.map((plan) => (
                <label
                  key={plan.value}
                  className="flex items-center gap-2 text-sm"
                >
                  <Radio
                    className="flex size-4 items-center justify-center rounded-full border border-neutral-400 bg-white outline-none focus-visible:ring-2 focus-visible:ring-blue-600 data-checked:border-blue-600"
                    value={plan.value}
                  >
                    <RadioIndicator className="size-2 rounded-full bg-blue-600" />
                  </Radio>
                  {plan.label}
                </label>
              ))}
            </RadioGroup>
            {fieldState.error && (
              <FieldError match className={errorClassName}>
                {fieldState.error.message}
              </FieldError>
            )}
          </Field>
        )}
      />

      {/* Controller: Checkbox. */}
      <Controller
        control={control}
        name="terms"
        render={({ field, fieldState }) => (
          <Field
            className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1.5"
            invalid={!!fieldState.error}
          >
            <Checkbox
              ref={field.ref}
              aria-required
              checked={field.value}
              className="flex size-4 items-center justify-center rounded border border-neutral-400 bg-white text-xs text-white outline-none focus-visible:ring-2 focus-visible:ring-blue-600 data-checked:border-blue-600 data-checked:bg-blue-600 data-invalid:border-red-600"
              name={field.name}
              onBlur={field.onBlur}
              onCheckedChange={(checked) => {
                field.onChange(checked === true);
              }}
            >
              <CheckboxIndicator aria-hidden>✓</CheckboxIndicator>
            </Checkbox>
            <FieldLabel className={labelClassName}>
              I accept the terms
            </FieldLabel>
            {fieldState.error && (
              <FieldError match className={`col-span-2 ${errorClassName}`}>
                {fieldState.error.message}
              </FieldError>
            )}
          </Field>
        )}
      />

      <div className="flex gap-3">
        <Button
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          type="submit"
        >
          Sign up
        </Button>
        <Button
          className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          type="button"
          onClick={() => {
            setSubmitted(null);
            reset();
          }}
        >
          Reset
        </Button>
      </div>

      {submitted && (
        <pre className="rounded-md bg-neutral-100 p-3 text-xs" role="status">
          {JSON.stringify(submitted, null, 2)}
        </pre>
      )}
    </form>
  );
};

export default SignupForm;
