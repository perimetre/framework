import { getBrandVariant } from '@/lib/brand-registry';
import { Slot } from 'radix-ui';
import {
  sectionHorizontalHeaderBrandVariants,
  sectionHorizontalHeaderTitleBrandVariants,
  type SectionHorizontalHeaderVariantProps
} from './brands';

export type SectionHorizontalHeaderProps = {
  /** Content displayed on the right side */
  content?: React.ReactNode;
  /** Extra elements rendered below the title (e.g. call to actions) */
  extra?: React.ReactNode;
  /** Small label displayed above the title */
  eyebrow?: React.ReactNode;
  /** Custom class name for the eyebrow element */
  eyebrowClassname?: string;
  /** Main heading text. Renders as h1 when variant="h1", otherwise h2 */
  title?: React.ReactNode;
} & Omit<React.ComponentProps<'div'>, 'content' | 'title'> &
  SectionHorizontalHeaderVariantProps;

/** Horizontal section header with eyebrow, title, content, and optional extra elements. */
const SectionHorizontalHeader: React.FC<SectionHorizontalHeaderProps> = ({
  className,
  content,
  extra,
  eyebrow,
  eyebrowClassname,
  title,
  variant,
  ...props
}) => {
  const sectionHorizontalHeaderVariants = getBrandVariant(
    sectionHorizontalHeaderBrandVariants
  );
  const sectionHorizontalHeaderTitleVariants = getBrandVariant(
    sectionHorizontalHeaderTitleBrandVariants
  );

  const TitleTag =
    variant === 'h1' ? 'h1' : variant === 'compact' ? 'h3' : 'h2';

  return (
    <div
      className={sectionHorizontalHeaderVariants({ variant, className })}
      {...props}
    >
      {eyebrow && <p className={eyebrowClassname}>{eyebrow}</p>}
      <div className="pui:justify-between pui:flex pui:flex-wrap">
        <div>
          {title && (
            <Slot.Slottable>
              <TitleTag
                className={sectionHorizontalHeaderTitleVariants({ variant })}
              >
                {title}
              </TitleTag>
            </Slot.Slottable>
          )}
          {extra && <div>{extra}</div>}
        </div>

        {content && (
          <div className="pui:w-full pui:xl:mt-0 pui:xl:max-w-81.25 pui:leading-[160%]">
            {content}
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionHorizontalHeader;
