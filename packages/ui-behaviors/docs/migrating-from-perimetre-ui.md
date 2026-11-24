# Migrating from @perimetre/ui

`@perimetre/ui-behaviors` replaces `@perimetre/ui` for new work. `@perimetre/ui` stays published and working for the projects that already use it, but it gets no new components.

The replacement is not one package. For each `@perimetre/ui` component, the new home is one of:

- **UI SDK** (`@ui-sdk/react`), used directly, when it has the behaviour.
- **`@perimetre/ui-behaviors`**, for the behaviours UI SDK does not have.
- **The project**, when the component has no behaviour and was only styling.

## What changes in general

| In `@perimetre/ui`                                              | Now                                                |
| --------------------------------------------------------------- | -------------------------------------------------- |
| Behaviour, brand styling and layout in one component            | Behaviour only. The project styles the parts       |
| `setActiveBrand`, per-brand variant files                       | Not carried forward. Theme with CSS in the project |
| `pui:` class prefix, named-group workaround                     | Gone. Style from `data-slot` and `data-*` state    |
| `asChild` (Radix `Slot`)                                        | `render={<a href="…" />}`                          |
| Data props: `items=[…]`, `showDots`, `label` / `hint` / `error` | Compose the parts yourself                         |
| Radix, Headless UI, Embla, `motion` underneath                  | UI SDK underneath                                  |

## Component map

| `@perimetre/ui`                                                                                           | Replace with                                                                                                                            | From                                                           |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `Accordion`, `AccordionRoot`, `AccordionTrigger`, `AccordionContent`                                      | `Accordion`, `AccordionItem`, `AccordionHeader`, `AccordionTrigger`, `AccordionPanel`                                                   | `@ui-sdk/react/accordion`                                      |
| `AccordionHeading`, `AccordionEyebrow`, `AccordionTitle`, `AccordionIcon`                                 | Plain markup inside the trigger                                                                                                         | The project                                                    |
| `Tabs`                                                                                                    | `Tabs`, `TabsList`, `TabsTab`, `TabsPanel`, `TabsIndicator`                                                                             | `@ui-sdk/react/tabs`                                           |
| `DrawerRoot`, `DrawerTrigger`, `DrawerContent`, `DrawerClose`                                             | `Drawer`, `DrawerTrigger`, `DrawerContent`, `DrawerClose`, plus `DrawerBackdrop` and `DrawerTitle`                                      | `@ui-sdk/react/drawer`                                         |
| `DrawerOpened`                                                                                            | A `data-open` selector, or a controller                                                                                                 | `@ui-sdk/react/drawer`                                         |
| `Button`                                                                                                  | `Button`, styled by the project                                                                                                         | `@ui-sdk/react/button`                                         |
| `CarouselButton`                                                                                          | `CarouselPrevious`, `CarouselNext`                                                                                                      | `@ui-sdk/react/carousel`                                       |
| `PaginatedCarousel`, `usePaginatedCarousel`                                                               | `Carousel` and its parts, `createCarouselController`                                                                                    | `@ui-sdk/react/carousel`                                       |
| `ImageCarousel`                                                                                           | `Carousel`; a second `Carousel` sharing state for thumbnails                                                                            | `@ui-sdk/react/carousel`                                       |
| `FieldContainer`, `FieldUpper`, `FieldLower`, `FieldLabel`, `FieldDescription`, `FieldHint`, `FieldError` | `Field`, `FieldLabel`, `FieldDescription`, `FieldError`                                                                                 | `@ui-sdk/react/field`                                          |
| `FieldAddon`                                                                                              | `InputGroup`                                                                                                                            | `@ui-sdk/react/input`                                          |
| `FieldInput`, `FieldBaseInput`                                                                            | `Input` inside `Field`                                                                                                                  | `@ui-sdk/react/input`                                          |
| `FieldPassword`                                                                                           | `PasswordInput`, `PasswordInputControl`, `PasswordInputToggle`                                                                          | `@ui-sdk/react/password-input`                                 |
| `FieldSelect`, `FieldBaseSelect`                                                                          | A native `<select>`: `<FieldControl render={<select />}>`                                                                               | `@ui-sdk/react/field`                                          |
| `FieldDropdown`, `FieldBaseDropdown`                                                                      | `Select` and its parts                                                                                                                  | `@ui-sdk/react/select`                                         |
| `FieldAutocomplete`, `FieldBaseAutocomplete`                                                              | `Combobox` and its parts, `useAsyncOptions` for remote results                                                                          | `@ui-sdk/react/combobox`, `@ui-sdk/react/async-options`        |
| `FieldCheckboxRadio` (`type="checkbox"`)                                                                  | `Checkbox`, `CheckboxIndicator`, `CheckboxGroup`                                                                                        | `@ui-sdk/react/checkbox`                                       |
| `FieldCheckboxRadio` (`type="radio"`), `FieldRadioGroup`                                                  | `RadioGroup`, `Radio`, `RadioIndicator`                                                                                                 | `@ui-sdk/react/radio`                                          |
| `MagnifyImage`                                                                                            | `Magnify`, `MagnifyTrigger`, `MagnifyLens`, `MagnifyLensContent`                                                                        | `@perimetre/ui-behaviors/magnify`                              |
| `ImageSequence360`                                                                                        | `Sequence`, `SequenceViewport`, `SequencePrevious`, `SequenceNext`, `SequencePlayToggle`. For a handful of stills, a looping `Carousel` | `@perimetre/ui-behaviors/sequence`; `@ui-sdk/react/carousel`   |
| `FieldGooglePlacesAutocomplete`                                                                           | `PlacesAutocomplete`, `PlacesAutocompleteList`, `PlacesAttribution`, with UI SDK's `Autocomplete` parts inside                          | `@perimetre/ui-behaviors/google`; `@ui-sdk/react/autocomplete` |
| `GoogleProvider`                                                                                          | `setOptions({ key })`, called once                                                                                                      | `@googlemaps/js-api-loader`                                    |
| `Tag` as a filter chip                                                                                    | `Toggle`, `ToggleGroup`                                                                                                                 | `@ui-sdk/react/toggle`                                         |
| `Tag` as a removable chip in a multi-select                                                               | `ComboboxChip`, `ComboboxChipRemove`                                                                                                    | `@ui-sdk/react/combobox`                                       |
| `Tag` as a static label                                                                                   | A styled `<span>`                                                                                                                       | The project                                                    |
| `Badge`                                                                                                   | A styled `<span>`                                                                                                                       | The project                                                    |
| `AlertBar`, `AlertBarIcon`, `AlertBarContent`                                                             | A styled region. Do not give it `role="banner"`, which is the site header's landmark                                                    | The project                                                    |
| `StatItem`                                                                                                | Styled markup                                                                                                                           | The project                                                    |
| `SectionCenteredHeader`, `SectionHorizontalHeader`                                                        | Styled markup                                                                                                                           | The project                                                    |

New, with no `@perimetre/ui` equivalent:

| Need                                            | Use                                                                                          | From                              |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| A list of places linked to pins on a map        | `Locator`, `LocatorList`, `LocatorItem`, `LocatorItemTrigger`, `LocatorMap`, `LocatorMarker` | `@perimetre/ui-behaviors/locator` |
| A Google map for that list                      | `GoogleMap`, `GoogleMapMarker`                                                               | `@perimetre/ui-behaviors/google`  |
| The user's position, as an origin for distances | `useGeolocation`                                                                             | `@perimetre/ui-behaviors/locator` |

## Naming traps

- **`FieldAutocomplete` is UI SDK's `Combobox`**, not its `Autocomplete`. In UI SDK, a Combobox's value is one of the options; an Autocomplete's value is free text with suggestions. Address entry is an Autocomplete.
- **`FieldSelect` and `FieldDropdown` stay two different things.** Keep the native `<select>` where it was used; UI SDK's `Select` is a custom popup and replaces `FieldDropdown`.

## Notes per component

### Accordion

- `headingLevel="h4"` becomes `<AccordionHeader render={<h4 />}>`. The default is `h3`; ours was `h4`.
- Animate the panel height from `--accordion-panel-height`, not `--radix-accordion-content-height`.
- Arrow keys, Home and End no longer move between triggers. This follows current ARIA guidance and is not a regression.

### Tabs

- Panels are no longer force-mounted. Add `keepMounted` to each `TabsPanel` to keep inactive content in the page.
- Set `activation` explicitly.

### Drawer

- `direction="left" | "right"` becomes `side`, which also takes `top`, `bottom`, `start` and `end`.
- A `DrawerTitle` is required. Hide it visually if the design has none.
- It renders in the browser's top layer, so drop the `z-index` and the portal.

### Carousels

- `options` and `plugins` were passed straight to Embla and have no equivalent. Common options map directly: `loop`, `align`, `dragFree`, and `slidesToScroll: 'auto'` becomes `slidesPerPage="auto"`.
- `scrollTo(index)` becomes `controller.setPage(index + 1)`. Pages count from 1.
- UI SDK's carousel has no fade transition and no continuous auto-scroll.

### Fields

- Ids are generated. Nothing derives from `name` any more (`${name}-input`, `${name}-error`), so remove selectors and tests that rely on those ids.
- `hint` has no part of its own: use a second `FieldDescription`.
- `corner` is layout and belongs to the project.
- With React Hook Form: `register()` for `Input`, `Textarea` and a native `<select>`; `Controller` for `Checkbox`, `RadioGroup`, `Select` and `Combobox`. The working example is in `examples/ui-sdk-forms` of the framework repo.

### MagnifyImage

- `renderImage` becomes children: once on the surface, once inside `MagnifyLensContent`.
- `lensRadius` and `magnifierClassName` become the size and classes you give `MagnifyLens`.
- `scale` keeps its name and default.
- Add a `MagnifyTrigger`. The old component had no keyboard access.
- Give `Magnify` `position: relative`.

### ImageSequence360

- The new behaviour draws nothing. Keep `fast-image-sequence` (or anything else) in the project and draw from `onValueChange`, which gives the progress from 0 to 1.
- `options` was passed straight to `fast-image-sequence` and has no equivalent. Configure the renderer in the project.
- Add `SequencePrevious` and `SequenceNext`. The old component was a `role="slider"` that answered only to the Left and Right keys and reported a stale value; the new one has no slider role.
- Name `SequenceViewport` with `aria-label`.

### FieldGooglePlacesAutocomplete

- The field is now a real input from UI SDK, styled like every other field. The old component restyled Google's own element from the outside; none of that CSS carries over.
- It calls Google's Places data API directly and no longer renders Google's `gmp-place-autocomplete` element.
- `GoogleProvider` is gone. Call `setOptions` from `@googlemaps/js-api-loader` once at startup.
- State which place `fields` to fetch. They set the price of each selection.
- Add `PlacesAttribution` inside the popup. Google requires it.
- `isGeolocationEnabled` and `onGeolocationResult` become the separate `useGeolocation` hook, from the locator entry.
