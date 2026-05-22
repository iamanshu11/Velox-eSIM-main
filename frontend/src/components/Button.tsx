import React, { ReactNode } from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isFullWidth?: boolean;
  icon?: ReactNode;
  ariaLabel?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isFullWidth = false,
      icon,
      ariaLabel,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-300 rounded-lg cursor-pointer focus:outline-none';

    const variants = {
      primary: 'bg-primary-700 text-white hover:bg-primary-800 hover:shadow-lg hover:shadow-primary-600/20 active:shadow-md active:shadow-primary-600/10 focus:ring-2 focus:ring-primary-400 focus:ring-offset-1',
      secondary: 'bg-neutral-300 text-gray-950 hover:bg-neutral-400 hover:shadow-lg hover:shadow-gray-400/20 active:shadow-md active:shadow-gray-400/10 focus:ring-2 focus:ring-neutral-400 focus:ring-offset-1',
      outline: 'bg-primary-50 text-primary-700 hover:bg-primary-100 hover:text-primary-800 hover:shadow-lg hover:shadow-primary-600/15 active:bg-primary-100 focus:ring-2 focus:ring-primary-300 focus:ring-offset-1 border border-primary-200 hover:border-primary-300',
      danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30 active:shadow-md active:shadow-red-600/20 focus:ring-2 focus:ring-red-400 focus:ring-offset-1',
      success: 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-600/30 active:shadow-md active:shadow-primary-600/20 focus:ring-2 focus:ring-primary-400 focus:ring-offset-1',
      warning: 'bg-amber-600 text-white hover:bg-amber-700 hover:shadow-lg hover:shadow-amber-600/30 active:shadow-md active:shadow-amber-600/20 focus:ring-2 focus:ring-amber-400 focus:ring-offset-1',
      info: 'bg-gray-700 text-white hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-400/20 active:shadow-md active:shadow-gray-400/10 focus:ring-2 focus:ring-gray-400 focus:ring-offset-1',
    };

    const sizes = {
      sm: 'px-3 py-2 text-xs gap-2 min-h-[36px]',
      md: 'px-5 py-2.5 text-sm gap-2 font-medium min-h-[44px]',
      lg: 'px-6 py-3 text-base gap-3 font-medium min-h-[48px]',
    };

    return (
      <button
        ref={ref}
        className={clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          isFullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        aria-busy={isLoading}
        {...props}
      >
        {icon && !isLoading && <span className="shrink-0">{icon}</span>}
        {isLoading && (
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

