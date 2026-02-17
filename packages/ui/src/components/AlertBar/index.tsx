import { getBrandVariant } from '@/lib/brand-registry';
import type { PropsWithChildren } from 'react';
import { alertBarBrandVariants, type AlertBarVariantProps } from './brands';

export type AlertBarProps = AlertBarVariantProps & React.ComponentProps<'div'>;

/**
 * Full-width alert bar that sits above the website's navigation.
 * Displays promotional or informational text with an optional icon.
 * @example
 * <AlertBar variant="first">
 *   <AlertBarIcon><img src="..." alt="" /></AlertBarIcon>
 *   <AlertBarContent>Winter storms may cause delays.</AlertBarContent>
 * </AlertBar>
 */
const AlertBar: React.FC<PropsWithChildren<AlertBarProps>> = ({
  children,
  className,
  variant,
  ...props
}) => {
  const alertBarVariants = getBrandVariant(alertBarBrandVariants);

  return (
    <div
      className={alertBarVariants({ variant, className })}
      role="banner"
      {...props}
    >
      {children}
    </div>
  );
};

export type AlertBarIconProps = React.ComponentProps<'span'>;

/**
 * Wrapper for icon/image content within an AlertBar.
 * Renders inline before the content.
 */
const AlertBarIcon: React.FC<PropsWithChildren<AlertBarIconProps>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <span
      className={`pui:flex pui:shrink-0 pui:items-center${className ? ` ${className}` : ''}`}
      {...props}
    >
      {children}
    </span>
  );
};

export type AlertBarContentProps = React.ComponentProps<'div'>;

/**
 * Rich text container within an AlertBar.
 * Accepts any ReactNode as children.
 */
const AlertBarContent: React.FC<PropsWithChildren<AlertBarContentProps>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

export default AlertBar;
export { AlertBarContent, AlertBarIcon };
