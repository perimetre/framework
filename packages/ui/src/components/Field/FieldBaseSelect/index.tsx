import { getBrandVariant } from '@/lib/brand-registry';
import { type ForceRequiredProps } from '@perimetre/helpers/types';
import {
  fieldBaseSelectBrandVariants,
  type FieldBaseSelectVariantProps
} from './brands';

export type FieldBaseSelectProps = ForceRequiredProps<
    FieldBaseSelectVariantProps,
    'error' | 'leading' | 'trailing'
  > &
  ForceRequiredProps<
  React.ComponentPropsWithRef<'select'>,
  'name'
>;

/**
 * Base native select for a Field. Styled like FieldBaseInput via the same tokens.
 * Uses the active brand variant (set via setActiveBrand()).
 */
const FieldBaseSelect: React.FC<FieldBaseSelectProps> = ({
  className,
  error,
  id,
  leading,
  name,
  trailing,
  ...props
}) => {
  const selectVariants = getBrandVariant(fieldBaseSelectBrandVariants);
  return (
    <select
      className={selectVariants({ className, error, leading, trailing })}
      id={id ?? (name ? `${name}-input` : undefined)}
      name={name}
      {...props}
    />
  );
};

export default FieldBaseSelect;
