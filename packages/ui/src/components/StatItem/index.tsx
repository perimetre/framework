import { getBrandVariant } from '@/lib/brand-registry';
import {
  statItemContentBrandVariants,
  statItemContentRowBrandVariants,
  statItemExtraBrandVariants,
  statItemEyebrowBrandVariants,
  statItemPrependBrandVariants,
  statItemWrapperBrandVariants
} from './brands';

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
};

const StatItem: React.FC<StatItemProps> = ({
  className,
  content,
  extra,
  eyebrow,
  prepend
}) => {
  const wrapperVariants = getBrandVariant(statItemWrapperBrandVariants);
  const eyebrowVariants = getBrandVariant(statItemEyebrowBrandVariants);
  const contentRowVariants = getBrandVariant(statItemContentRowBrandVariants);
  const contentVariants = getBrandVariant(statItemContentBrandVariants);
  const prependVariants = getBrandVariant(statItemPrependBrandVariants);
  const extraVariants = getBrandVariant(statItemExtraBrandVariants);

  return (
    <div className={wrapperVariants({ className })}>
      {eyebrow && <p className={eyebrowVariants()}>{eyebrow}</p>}
      <div className={contentRowVariants()}>
        <span className={contentVariants()}>{content}</span>
        {prepend && <span className={prependVariants()}>{prepend}</span>}
      </div>
      {extra && <p className={extraVariants()}>{extra}</p>}
    </div>
  );
};

export default StatItem;
