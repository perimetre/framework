import { getBrandVariant } from '@/lib/brand-registry';
import {
  sectionHorizontalHeaderBrandVariants,
  sectionHorizontalHeaderTitleBrandVariants,
  type SectionHorizontalHeaderVariantProps
} from './brands';

export type SectionHorizontalHeaderProps<E extends React.ElementType = 'h2'> =
  Omit<
    React.ComponentPropsWithoutRef<E>,
    keyof SectionHorizontalHeaderOwnProps
  > &
    SectionHorizontalHeaderOwnProps<E>;

type SectionHorizontalHeaderOwnProps<E extends React.ElementType = 'h2'> = {
  /** HTML element for the title tag (e.g. 'h1', 'h2', 'h3'). Defaults to 'h2'. */
  as?: E;
  /** Content displayed on the right side */
  content?: React.ReactNode;
  /** Extra elements rendered below the title (e.g. call to actions) */
  extra?: React.ReactNode;
  /** Small label displayed above the title */
  eyebrow?: React.ReactNode;
  /** Custom class name for the eyebrow element */
  eyebrowClassName?: string;
  /** Main heading text */
  title?: React.ReactNode;
} & Omit<React.ComponentProps<'div'>, 'content' | 'title'> &
  SectionHorizontalHeaderVariantProps;

/** Horizontal section header with eyebrow, title, content, and optional extra elements. */
function SectionHorizontalHeader<E extends React.ElementType = 'h2'>({
  alignMobile,
  as,
  className,
  content,
  extra,
  eyebrow,
  eyebrowClassName,
  title,
  variant,
  ...props
}: SectionHorizontalHeaderProps<E>) {
  const sectionHorizontalHeaderVariants = getBrandVariant(
    sectionHorizontalHeaderBrandVariants
  );
  const sectionHorizontalHeaderTitleVariants = getBrandVariant(
    sectionHorizontalHeaderTitleBrandVariants
  );

  const TitleTag = as ?? 'h2';

  return (
    <div
      className={sectionHorizontalHeaderVariants({
        alignMobile,
        variant,
        className
      })}
      {...props}
    >
      {eyebrow && (
        <span
          className={`pui:inline-block pui:typo-tiny pui:lg:typo-base ${eyebrowClassName ?? ''}`}
        >
          {eyebrow}
        </span>
      )}
      <div className="pui:grid pui:gap-y-5 pui:lg:grid-cols-[1fr_auto] pui:lg:gap-x-5 pui:lg:items-start">
        {title && (
          <TitleTag
            className={sectionHorizontalHeaderTitleVariants({ variant })}
          >
            {title}
          </TitleTag>
        )}

        {content && (
          <div className="pui:text-sm pui:lg:typo-base pui:lg:row-span-2 pui:lg:max-w-81.25 pui:leading-[160%]">
            {content}
          </div>
        )}

        {extra && (
          <div
            className={`pui:flex pui:lg:justify-start ${alignMobile === 'left' ? 'pui:justify-start' : 'pui:justify-center'}`}
          >
            {extra}
          </div>
        )}
      </div>
    </div>
  );
}

export default SectionHorizontalHeader;
