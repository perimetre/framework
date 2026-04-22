import { getBrandVariant } from '@/lib/brand-registry';
import { cn } from '@perimetre/classnames';
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
  /** Custom class name for the extra element wrapper */
  extraClassName?: string;
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
  as,
  className,
  content,
  extra,
  extraClassName,
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
      className={sectionHorizontalHeaderVariants({ variant, className })}
      {...props}
    >
      {eyebrow && (
        <span
          className={cn(
            'pui:inline-block pui:typo-tiny pui:md:typo-base pui:mb-5',
            eyebrowClassName
          )}
        >
          {eyebrow}
        </span>
      )}
      <div className="pui:grid pui:md:grid-cols-[1fr_auto] pui:md:gap-x-5 pui:md:items-start">
        {title && (
          <TitleTag
            className={sectionHorizontalHeaderTitleVariants({ variant })}
          >
            {title}
          </TitleTag>
        )}

        {content && (
          <div className="pui:text-sm pui:md:typo-base pui:md:row-span-2 pui:md:max-w-81.25 pui:leading-[160%]">
            {content}
          </div>
        )}

        {extra && (
          <div
            className={cn(
              'pui:flex pui:justify-center pui:md:justify-start',
              extraClassName
            )}
          >
            {extra}
          </div>
        )}
      </div>
    </div>
  );
}

export default SectionHorizontalHeader;
