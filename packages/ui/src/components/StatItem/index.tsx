import { getBrandVariant } from '@/lib/brand-registry';
import { statItemBrandVariants, type StatItemVariantProps } from './brands';

export type StatItemProps = {
  className?: string;
  /** The main, large display text (e.g. a stat or number) */
  content?: React.ReactNode;
  /** Supplementary text rendered below the content */
  extra?: React.ReactNode;
  /** Small label rendered above the main content in a <p> tag */
  eyebrow?: React.ReactNode;
  /** Normal-sized text shown beside the content, to its right — baseline aligned */
  prepend?: React.ReactNode;
} & StatItemVariantProps;

/** Stat display block with eyebrow, large content, optional prepend, and extra text. */
const StatItem: React.FC<StatItemProps> = ({
  className,
  content,
  extra,
  eyebrow,
  prepend
}) => {
  const statItemVariants = getBrandVariant(statItemBrandVariants);

  return (
    <div
      className={statItemVariants({
        className: `pui:py-3.5 pui:border-b pui:border-pui-overlay-12/20 pui:md:border-b-0 ${className ?? ''}`
      })}
    >
      {eyebrow && (
        <p className="pui:typo-tagline pui:text-pui-fg-muted">{eyebrow}</p>
      )}
      <div className="pui:flex pui:items-baseline pui:gap-2">
        <span className="pui:typo-heading-3 pui:lg:typo-heading-2 pui:text-pui-fg-default pui:py-2">
          {content}
        </span>
        {prepend && (
          <span className="pui:typo-large pui:text-pui-fg-muted">
            {prepend}
          </span>
        )}
      </div>
      {extra && <p className="pui:typo-small pui:text-pui-fg-muted">{extra}</p>}
    </div>
  );
};

export default StatItem;
