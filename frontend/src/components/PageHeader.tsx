import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  description?: string;
  actions?: ReactNode;
  highlightText?: string;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  description,
  actions,
  highlightText,
  className = '',
}: PageHeaderProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl bg-linear-to-br from-primary-50 via-white to-slate-100 border border-white/80 shadow-[0_24px_80px_-40px_rgba(67,161,240,0.28)] p-8 lg:p-10 ${className}`}
    >
      <div className="absolute top-0 right-0 -mt-8 -mr-8 h-40 w-40 rounded-full bg-primary-100 opacity-25 blur-3xl" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-36 w-36 rounded-full bg-primary-200/30 blur-3xl" />

      <div className="relative z-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-700 mb-3">
            {subtitle}
          </p>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-slate-900 mb-4">
            {title}
          </h1>
          {highlightText ? (
            <p className="text-base text-primary-700 font-semibold mb-3">
              {highlightText}
            </p>
          ) : null}
          {description ? (
            <p className="text-sm md:text-base text-slate-600 max-w-2xl leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="mt-8 flex flex-wrap gap-3 items-center">
            {actions}
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}
