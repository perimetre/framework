import { getBrandVariant } from '@/lib/brand-registry';
import {
  sectionCenteredHeaderBrandVariants,
  sectionCenteredHeaderTitleBrandVariants,
  type SectionCenteredHeaderVariantProps
} from './brands';

export type SectionCenteredHeaderProps = SectionCenteredHeaderOwnProps;

type SectionCenteredHeaderOwnProps = {
  /** Content displayed below the title */
  content?: React.ReactNode;
  /** Small label displayed above the title */
  eyebrow?: React.ReactNode;
  /** Main heading text. Renders as h1 when variant is 'h1', otherwise h2. */
  title?: React.ReactNode;
} & Omit<React.ComponentProps<'div'>, 'content' | 'title'> &
  SectionCenteredHeaderVariantProps;

/** Centered section header with eyebrow, title, and content. */
function SectionCenteredHeader({
  className,
  content,
  eyebrow,
  title,
  variant,
  ...props
}: SectionCenteredHeaderProps) {
  const sectionCenteredHeaderVariants = getBrandVariant(
    sectionCenteredHeaderBrandVariants
  );
  const sectionCenteredHeaderTitleVariants = getBrandVariant(
    sectionCenteredHeaderTitleBrandVariants
  );

  const TitleTag = variant === 'h1' ? 'h1' : 'h2';

  return (
    <div
      className={sectionCenteredHeaderVariants({ variant, className })}
      {...props}
    >
      {eyebrow && <p>{eyebrow}</p>}
      {title && (
        <TitleTag className={sectionCenteredHeaderTitleVariants({ variant })}>
          {title}
        </TitleTag>
      )}
      {content && <div>{content}</div>}
    </div>
  );
}

export default SectionCenteredHeader;
