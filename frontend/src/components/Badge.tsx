import React, { ReactNode } from 'react';
import clsx from 'clsx';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'outline' | 'active' | 'ready' | 'expiring' | 'inactive';
  size?: 'sm' | 'md' | 'lg';
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'primary', size = 'md', className, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary-100 text-primary-800 font-semibold transition-all duration-300',
      secondary: 'bg-gray-700 text-white transition-all duration-300',
      success: 'bg-green-100 text-green-800 font-semibold transition-all duration-300',
      danger: 'bg-red-100 text-red-800 font-semibold transition-all duration-300',
      warning: 'bg-yellow-100 text-yellow-800 font-semibold transition-all duration-300',
      info: 'bg-blue-100 text-blue-800 font-semibold transition-all duration-300',
      outline: 'bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 hover:text-primary-800 hover:shadow-md hover:shadow-primary-600/15 transition-all duration-300 font-semibold',
      active: 'bg-green-100 text-green-800 font-semibold transition-all duration-300 inline-flex items-center gap-1',
      ready: 'bg-amber-100 text-amber-800 font-semibold transition-all duration-300 inline-flex items-center gap-1',
      expiring: 'bg-red-100 text-red-800 font-semibold transition-all duration-300 inline-flex items-center gap-1',
      inactive: 'bg-slate-100 text-slate-700 font-medium transition-all duration-300',
    };

    const sizes = {
      sm: 'px-2 py-1 text-xs font-semibold',
      md: 'px-3 py-1.5 text-sm font-semibold',
      lg: 'px-4 py-2 text-base font-semibold',
    };

    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center rounded-full',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;

