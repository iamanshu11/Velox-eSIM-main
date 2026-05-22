import React, { ReactNode, useState } from 'react';
import clsx from 'clsx';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = type === 'password';
    const inputType = isPasswordField && showPassword ? 'text' : type;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-gray-900 mb-2.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">{icon}</div>}
          <input
            ref={ref}
            type={inputType}
            className={clsx(
              'w-full px-4 py-2.5 rounded-lg border transition-all duration-200',
              'bg-white text-gray-900',
              'border-slate-300',
              'focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-500/20',
              'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
              'placeholder-slate-400',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              icon && 'pl-10',
              isPasswordField && 'pr-10',
              className
            )}
            {...props}
          />
          {isPasswordField && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        {helperText && <p className="mt-2 text-sm text-gray-600">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

