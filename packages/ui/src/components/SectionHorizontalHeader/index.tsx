import { getBrandVariant } from '@/lib/brand-registry';
import { Slot } from 'radix-ui';
import {
  sectionHorizontalHeaderBrandVariants,
  type SectionHorizontalHeaderVariantProps
} from './brands';

export type SectionHorizontalHeaderProps = {
  /** Content displayed on the right side */
  content?: React.ReactNode;
  /** Extra elements rendered below the title (e.g. call to actions) */
  extra?: React.ReactNode;
  /** Small label displayed above the title */
  eyebrow?: React.ReactNode;
  /** Main heading text. Renders as h1 when variant="h1", otherwise h2 */
  title?: React.ReactNode;
} & React.ComponentProps<'div'> &
  SectionHorizontalHeaderVariantProps;

/** Horizontal section header with eyebrow, title, content, and optional extra elements. */
const SectionHorizontalHeader: React.FC<SectionHorizontalHeaderProps> = ({
  className,
  content,
  extra,
  eyebrow,
  title,
  variant,
  ...props
}) => {
  const sectionHorizontalHeaderVariants = getBrandVariant(
    sectionHorizontalHeaderBrandVariants
  );

  const TitleTag = variant === 'h1' ? 'h1' : 'h2';

  return (
    <div
      className={sectionHorizontalHeaderVariants({ variant, className })}
      {...props}
    >
      <div>
        {eyebrow && <p>{eyebrow}</p>}
        {title && (
          <Slot.Slottable>
            <TitleTag>{title}</TitleTag>
          </Slot.Slottable>
        )}
        {extra && <div>{extra}</div>}
      </div>
      {content && <div>{content}</div>}
    </div>
  );
};

export default SectionHorizontalHeader;
