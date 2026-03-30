# Named Groups & Peers with the `pui:` Prefix

A troubleshooting guide for using Tailwind's named `group/` and `peer/` features inside PUI components.

---

## The problem

PUI components use a `pui:` prefix for all Tailwind utilities. This prefix behaves differently depending on how Tailwind is integrated:

| Integration           | Used by                 | How `pui:` works                                                     |
| --------------------- | ----------------------- | -------------------------------------------------------------------- |
| `prefix(pui)`         | Ladle (internal dev)    | All utility class names get the `pui:` prefix baked in               |
| `@custom-variant pui` | Consumer apps (Next.js) | `pui:` is a variant wrapper that scopes styles to `[data-pui-brand]` |

This difference is invisible for regular utilities like `pui:flex` or `pui:text-red-500`. But it **breaks named groups and peers** because these features rely on cross-class references.

---

## How it breaks

Consider a carousel with hover-to-show navigation:

```tsx
{
  /* Parent: named group marker */
}
<div className="pui:group/imageCarousel">
  {/* Child: show on hover */}
  <div className="pui:group-hover/imageCarousel:opacity-100">
    <button>Next</button>
  </div>
</div>;
```

### With `prefix(pui)` (Ladle) - works

Both the marker and the hover reference use the same prefixed name:

```css
/* Marker class in DOM: .pui\:group\/imageCarousel */
/* Generated hover selector looks for: .pui\:group\/imageCarousel */
/* Match */
```

### With `@custom-variant pui` (consumer) - broken

The marker class in the DOM is `.pui\:group\/imageCarousel` (the full string), but the hover variant resolves the group name **without** the `pui:` prefix:

```css
/* Marker class in DOM: .pui\:group\/imageCarousel */
/* Generated hover selector looks for: .group\/imageCarousel */
/* No match - buttons never appear */
```

---

## The fix: always include both prefixed and unprefixed marker classes

When using a named `group/` or `peer/` inside a PUI component, include **both** the unprefixed and prefixed versions of the marker class:

```tsx
{
  /* Both markers - works in both integration modes */
}
<div className="group/imageCarousel pui:group/imageCarousel">
  <div className="pui:group-hover/imageCarousel:opacity-100">
    <button>Next</button>
  </div>
</div>;
```

- `group/imageCarousel` is matched by `@custom-variant pui` consumers
- `pui:group/imageCarousel` is matched by `prefix(pui)` in Ladle

The extra class has zero cost: it just sets a CSS custom property (`--tw-group`) that's already being set by the other one.

---

## Affected features

This applies to **any named Tailwind feature** that uses cross-class references within `pui:` scoping:

| Marker                | Reference variant         | Needs dual class?           |
| --------------------- | ------------------------- | --------------------------- |
| `pui:group/name`      | `pui:group-hover/name:*`  | Yes                         |
| `pui:group/name`      | `pui:group-focus/name:*`  | Yes                         |
| `pui:group/name`      | `pui:group-active/name:*` | Yes                         |
| `pui:peer/name`       | `pui:peer-checked/name:*` | Yes                         |
| `pui:peer/name`       | `pui:peer-hover/name:*`   | Yes                         |
| `pui:group` (unnamed) | `pui:group-hover:*`       | **No** - unnamed works fine |
| `pui:peer` (unnamed)  | `pui:peer-checked:*`      | **No** - unnamed works fine |

**Rule of thumb**: If you see a `/name` after `group` or `peer`, you need both classes on the marker element.

---

## Checklist for new components

When adding a named group or peer to a PUI component:

1. Add `group/yourName pui:group/yourName` (or `peer/yourName pui:peer/yourName`) to the marker element
2. Use `pui:group-hover/yourName:*` (or similar) on descendant/sibling elements as normal
3. Test in both Ladle and a consumer app to verify the interaction works

---

## Root cause

This is a design limitation of Tailwind's `@custom-variant` directive, not a bug per se. The `@custom-variant pui` approach treats `pui:` as a selector wrapper, while `prefix(pui)` treats it as a class name prefix. Named groups rely on class name matching between the marker and the reference, so the two modes produce incompatible selectors. The dual-class pattern bridges this gap.
