import {
  cloneElement,
  type CSSProperties,
  type ReactElement,
  type SVGAttributes
} from 'react';
import {
  accessibleIcon,
  type AccessibleIconProps,
  VISUALLY_HIDDEN
} from '../../utilities/accessible-icon/index.js';

/**
 * What an icon takes: `aria-hidden` or a `label`, and anything else for the
 * svg, like a `className`.
 *
 * Give an app's icon components these props, and pass `aria-hidden` or
 * `label` where an icon is used, never where it is declared.
 */
export type IconProps = {
  /** The graphic: one `svg` element. */
  children?: ReactElement<SVGAttributes<SVGElement>>;
} & AccessibleIconProps &
  Omit<SVGAttributes<SVGElement>, 'aria-hidden' | 'children'>;

/** `VISUALLY_HIDDEN` with the property names React's `style` takes. */
const hiddenStyle: CSSProperties = Object.fromEntries(
  Object.entries(VISUALLY_HIDDEN).map(([name, value]) => [
    name.replace(/-(\w)/g, (_match, letter: string) => letter.toUpperCase()),
    value
  ])
);

/**
 * Wraps an svg so it is accessible, the way Radix's `AccessibleIcon` does.
 * The svg is hidden from assistive tech and takes no focus, and an icon that
 * means something gets its `label` as hidden text beside it.
 *
 * The one React component in this package. It is here because every app
 * needs the same one, and it has nothing to style. It has no state and no
 * `"use client"`, so it renders in a Server Component.
 * @example
 * const IconStar = (props: IconProps) => (
 *   <Icon {...props}>
 *     <svg viewBox="0 0 24 24">…</svg>
 *   </Icon>
 * );
 *
 * <IconStar aria-hidden />
 * <IconStar label="Favourite" />
 * @param props - `aria-hidden` or a `label`, the svg, and props for the svg
 */
export const Icon = (props: IconProps) => {
  const {
    'aria-hidden': hidden,
    children,
    className,
    label: text,
    ...rest
  } = props;
  const { icon, label } = accessibleIcon(
    hidden === true ? { 'aria-hidden': true } : { label: text }
  );
  if (!children) return null;

  return (
    <>
      {cloneElement(children, {
        ...rest,
        ...icon,
        className:
          [children.props.className, className].filter(Boolean).join(' ') ||
          undefined
      })}
      {label ? <span style={hiddenStyle}>{label}</span> : null}
    </>
  );
};
