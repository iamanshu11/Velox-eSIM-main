import React, { ReactNode } from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  variant?: 'default' | 'info' | 'warning' | 'error';
  children?: ReactNode;
}

const variantStyles = {
  default: {
    container: 'bg-linear-to-br from-gray-50 to-gray-100 border-gray-200',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    button: 'bg-gray-600 hover:bg-gray-700',
  },
  info: {
    container: 'bg-linear-to-br from-primary-50 to-indigo-50 border-primary-200',
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-700',
    button: 'bg-primary-700 hover:bg-primary-800',
  },
  warning: {
    container: 'bg-linear-to-br from-amber-50 to-orange-50 border-amber-200',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    button: 'bg-amber-600 hover:bg-amber-700',
  },
  error: {
    container: 'bg-linear-to-br from-red-50 to-pink-50 border-red-200',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    button: 'bg-red-600 hover:bg-red-700',
  },
};
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default',
  children,
}: EmptyStateProps) {
  const styles = variantStyles[variant];

  return (
    <div className={`rounded-xl shadow-lg p-12 border ${styles.container}`}>
      <div className="max-w-md mx-auto text-center">
        {/* Icon */}
        <div className={`${styles.iconBg} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6`}>
          <Icon className={`w-8 h-8 ${styles.iconColor}`} />
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>

        {/* Description */}
        <p className="text-gray-600 mb-6">{description}</p>

        {/* Children (custom content) */}
        {children && <div className="mb-6">{children}</div>}

        {/* Action Button */}
        {action && (
          <Link href={action.href}>
            <button className={`inline-flex items-center gap-2 ${styles.button} text-white font-semibold py-3 px-6 rounded-lg transition-colors`}>
              {action.label}
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}

