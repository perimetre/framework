import { getBrandVariant } from '@/lib/brand-registry';
import { Slot } from 'radix-ui';
import type { PropsWithChildren } from 'react';
import { tagBrandVariants, type TagVariantProps } from './brands';

export type TagProps = {
  /**
   * When true, merges props onto the immediate child element instead of
   * rendering a span. Useful for making the whole tag a link or button.
   */
  asChild?: boolean;
  /** Accessible label for the dismiss button (default: "Remove"). */
  dismissLabel?: string;
  /**
   * When provided, renders a dismiss (×) button that calls this handler.
   */
  onDismiss?: () => void;
} & React.ComponentProps<'span'> &
  TagVariantProps;

/**
 * Small close/dismiss glyph. Inherits color via `currentColor`.
 */
const DismissIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg
    aria-hidden
    fill="none"
    height={size}
    viewBox="0 0 14 14"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.5 3.5 10.5 10.5M10.5 3.5 3.5 10.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.5"
    />
  </svg>
);

/**
 * Tag — a compact, brand-aware chip for filters, selections, and labels.
 *
 * Supports `selected` and `disabled` visual states, `small`/`large` sizes, and
 * an optional dismiss (×) button. All colors and the corner radius come from
 * the active brand's tokens, so it restyles per brand with no code changes.
 *
 * `selected`/`disabled` are controlled visual props — the parent owns state.
 * For a clickable tag, use `asChild` to render it as a button or link.
 * @example
 * <Tag selected size="large">Sec 1</Tag>
 * @example
 * <Tag onDismiss={() => remove(id)}>Sec 1</Tag>
 */
const Tag: React.FC<PropsWithChildren<TagProps>> = ({
  asChild,
  children,
  className,
  disabled = false,
  dismissLabel = 'Remove',
  onDismiss,
  selected = false,
  size,
  ...props
}) => {
  const variants = getBrandVariant(tagBrandVariants);
  const classes = variants({ size, selected, disabled, className });
  const Comp = asChild ? Slot.Slot : 'span';

  return (
    <Comp
      aria-disabled={disabled || undefined}
      className={classes}
      data-selected={selected || undefined}
      {...props}
    >
      {children}
      {onDismiss && (
        <button
          aria-label={dismissLabel}
          className="pui:inline-flex pui:items-center pui:justify-center pui:shrink-0 pui:cursor-pointer pui:rounded-full pui:transition-colors pui:disabled:cursor-not-allowed pui:focus-visible:[outline:2px_solid_var(--pui-color-border-focus)] pui:focus-visible:[outline-offset:2px]"
          disabled={disabled}
          type="button"
          onClick={onDismiss}
        >
          <DismissIcon size={size === 'large' ? 18 : 14} />
        </button>
      )}
    </Comp>
  );
};

export default Tag;
