import { getBrandVariant } from '@/lib/brand-registry';
import {
  sectionCenteredHeaderBrandVariants,
  sectionCenteredHeaderTitleBrandVariants,
  type SectionCenteredHeaderVariantProps
} from './brands';

export type SectionCenteredHeaderProps<E extends React.ElementType = 'h2'> =
  Omit<React.ComponentPropsWithoutRef<E>, keyof SectionCenteredHeaderOwnProps> &
    SectionCenteredHeaderOwnProps<E>;

type SectionCenteredHeaderOwnProps<E extends React.ElementType = 'h2'> = {
  /** HTML element for the title tag (e.g. 'h1', 'h2', 'h3'). Defaults to 'h2'. */
  as?: E;
  /** Content displayed below the title */
  content?: React.ReactNode;
  /** Small label displayed above the title */
  eyebrow?: React.ReactNode;
  /** Main heading text */
  title?: React.ReactNode;
} & Omit<React.ComponentProps<'div'>, 'content' | 'title'> &
  SectionCenteredHeaderVariantProps;

/** Centered section header with eyebrow, title, and content. */
function SectionCenteredHeader<E extends React.ElementType = 'h2'>({
  as,
  className,
  content,
  eyebrow,
  title,
  variant,
  ...props
}: SectionCenteredHeaderProps<E>) {
  const sectionCenteredHeaderVariants = getBrandVariant(
    sectionCenteredHeaderBrandVariants
  );
  const sectionCenteredHeaderTitleVariants = getBrandVariant(
    sectionCenteredHeaderTitleBrandVariants
  );

  const TitleTag = as ?? 'h2';

  return (
    <div
      className={sectionCenteredHeaderVariants({ variant, className })}
      {...props}
    >
      {eyebrow && <div>{eyebrow}</div>}
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
