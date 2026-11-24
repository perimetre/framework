# UI SDK forms example

[UI SDK](https://ui-sdk.dev) form controls with React Hook Form and Zod, in a Next.js App Router project.

It shows the one thing the UI SDK docs do not: how its controls join a React Hook Form form. That is all it shows.

### What this example is NOT

Everything around the form is the least that makes it run, and is not a pattern to copy:

- **The styling.** The Tailwind classes are the minimum needed to see state.
- **The submission.** Submitting prints the parsed values. Services, server actions, server-side errors and i18n are covered by the Périmètre forms convention and the `trpc` example.
- **The repeated field markup.** Each field spells out its `Field`, `FieldLabel` and `FieldError` so the UI SDK parts are visible. A project is free to wrap them.

UI SDK is in beta (`0.1.0-beta.17` is pinned here) and its API may change.

---

## The pattern

A control joins the form in one of two ways, depending on what it is underneath.

| Control                                                  | Underneath                   | How it joins            |
| -------------------------------------------------------- | ---------------------------- | ----------------------- |
| `Input`, `Textarea`                                      | a native element             | `{...register('name')}` |
| native `<select>` via `FieldControl render={<select />}` | a native element             | `{...register('name')}` |
| `Checkbox`, `RadioGroup`, `Select`, `Combobox`           | a button plus a hidden input | `<Controller>`          |

The second group reports changes through `onValueChange` / `onCheckedChange`, not a DOM change event, so `register()` cannot read them.

Errors reach a control through `Field`'s `invalid` prop and a `FieldError`. `Field` generates the ids and wires `for`, `aria-describedby` and `aria-invalid` itself.

## Important files

- [`src/components/UI/SignupForm/index.tsx`](src/components/UI/SignupForm/index.tsx) - The form. Every control type, wired with `register()` or `Controller`
- [`src/components/UI/SignupForm/form.ts`](src/components/UI/SignupForm/form.ts) - The Zod schema and the two value types
- [`src/app/globals.css`](src/app/globals.css) - The `@layer ui-sdk` line UI SDK needs above Tailwind

## Things worth knowing

These were found by running the form in a browser, not read from the docs.

- **`mode: 'onTouched'` works on every control.** Each one passes `onBlur` through, so tabbing past an empty required control shows its error.
- **`Select` needs `virtualFocus` with `onTouched`.** Without it, opening the list moves focus off the trigger. That blur marks the field touched and shows its error before the user has chosen anything. `virtualFocus` keeps focus on the trigger while the list is open.
- **Put `onBlur` and `ref` on the part that takes focus:** `SelectTrigger`, `ComboboxInput`, the `RadioGroup` and the `Checkbox`.
- **`Combobox`: render the items as parts, without an `items` prop,** when it should filter as the user types. Passing `items` and rendering every `ComboboxItem` yourself showed the whole list regardless of the query. Add `itemToLabel` so the input can show a value's label while the popup is closed.
- **`ComboboxEmpty` stays in the DOM as an empty live region.** Give it `empty:hidden` or its padding shows as a blank row above the results.
- **Empty values.** React Hook Form holds `''` for "nothing chosen"; `Select`, `Combobox` and `RadioGroup` use `null`. Convert at the boundary: `value={field.value || null}` and `field.onChange(value ?? '')`.
- **Schema types.** A choice field is `z.string().min(1).pipe(z.enum(...))`, so the form's value type is a string that can start empty and the parsed type is the narrow union. `useForm<SignupValues, unknown, SignupInput>` carries both.
- **No native validation.** No control has `required` or relies on `type="email"` checks, `Field` gets `invalid` as a boolean, and the form has `noValidate`. The Zod schema is the only validator. Controls carry `aria-required` for assistive tech.
- **`data-required` is uneven.** UI SDK marks a field's parts with `data-required` when the control is required, but with `aria-required` that only happened for `Input`, a native `<select>` and `Combobox`, not for `Select`, `RadioGroup` or `Checkbox`. Do not rely on it alone to draw a required mark.
- **`reset()` clears everything,** including the controlled `Select`, `Combobox`, radios and checkbox.

## Running it

This example is not part of the pnpm workspace. Install it on its own:

```bash
cd examples/ui-sdk-forms
pnpm install --ignore-workspace
pnpm dev
```

If pnpm refuses a package for being newer than its minimum release age, the pinned version was published recently. Wait until it has aged past the threshold, or list it under `minimumReleaseAgeExclude` in a local `pnpm-workspace.yaml`.
