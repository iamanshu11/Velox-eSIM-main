import React, { ReactNode } from 'react';
import clsx from 'clsx';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ children, size = 'lg', className, ...props }, ref) => {
    const sizes = {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
    };

    return (
      <div
        ref={ref}
        className={clsx('mx-auto px-4 sm:px-6 lg:px-8', sizes[size], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';

export default Container;

