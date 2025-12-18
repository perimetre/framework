import { cn } from '@perimetre/classnames';
import { type PropsWithChildren } from 'react';

export type FieldContainerProps = {
  name: string;
} & React.ComponentPropsWithRef<'div'>;

/**
 * A container wrapper for a form field
 */
const FieldContainer: React.FC<PropsWithChildren<FieldContainerProps>> = ({
  children,
  className,
  id,
  name,
  ...props
}) => (
  <div
    className={cn('pui:group/field pui:space-y-2', className)}
    id={id ?? `${name}-group`}
    {...props}
  >
    {children}
  </div>
);

export default FieldContainer;
