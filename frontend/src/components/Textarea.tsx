import React from 'react';
import clsx from 'clsx';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-900 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={clsx(
            'w-full px-4 py-2 rounded-lg border-2 transition-all duration-200 resize-none',
            'bg-white text-gray-900',
            'border-neutral-300',
            'focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10',
            'disabled:bg-gray-100 disabled:opacity-50',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/50',
            className
          )}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        {helperText && <p className="mt-2 text-sm text-gray-600">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;

