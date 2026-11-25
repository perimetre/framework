import { css } from '@ui-sdk/core';

/**
 * What every icon must say about itself: it is decoration, hidden from
 * assistive tech with `aria-hidden`, or it means something and has a
 * `label`. The type refuses an icon that is neither.
 *
 * Give an app's icon components these props, and pass `aria-hidden` or
 * `label` where an icon is used, never where it is declared.
 */
export type AccessibleIconProps =
  | { 'aria-hidden': true; label?: string }
  | { 'aria-hidden'?: false; label: string };

/**
 * The declarations that hide an element from sight and keep it for screen
 * readers, as Radix's `VisuallyHidden` has them.
 */
export const VISUALLY_HIDDEN = {
  border: '0',
  clip: 'rect(0, 0, 0, 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: '0',
  position: 'absolute',
  'white-space': 'nowrap',
  width: '1px',
  'word-wrap': 'normal'
} as const;

/**
 * `VISUALLY_HIDDEN` as a `style` attribute, for a part of your own
 * primitive: `attrs: () => ({ style: visuallyHidden })`. In markup styled
 * with Tailwind, the `sr-only` class does the same.
 */
export const visuallyHidden = css(VISUALLY_HIDDEN);

/**
 * Works out what an icon renders, the way Radix's `AccessibleIcon` does: the
 * graphic is always hidden from assistive tech and never takes focus, and an
 * icon that means something gets its label as hidden text beside it, like
 * the `alt` of an image.
 *
 * It is a function and not a primitive on purpose. An icon has no state, so
 * it needs no instance and no client code, and `Icon` can render in a Server
 * Component.
 *
 * In React, use `Icon` from `@perimetre/ui-behaviors/react/icon`, which is built
 * on this. Call it yourself in another framework, or in a part of your own:
 *
 * ```ts
 * const { icon, label } = accessibleIcon(props)
 * ```
 * @param props - Whether the icon is decoration, or what it means
 */
export const accessibleIcon = (props: AccessibleIconProps) => ({
  /**
   * Attributes for the graphic, usually an `svg`. `focusable` keeps old
   * browsers from giving an svg a tab stop of its own.
   */
  icon: { 'aria-hidden': 'true', focusable: 'false' } as const,
  /** The text to render beside the graphic, hidden from sight. `undefined` for decoration. */
  label: props['aria-hidden'] === true ? undefined : props.label
});
