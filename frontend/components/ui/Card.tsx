import { HTMLAttributes } from 'react';
import clsx from 'clsx';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('rounded-lg border border-line bg-surface-card p-5 shadow-card', className)}
      {...props}
    />
  );
}

export function Badge({ tone = 'default', className, children }: { tone?: 'default' | 'success' | 'warning' | 'danger' | 'brand'; className?: string; children: React.ReactNode }) {
  const toneClasses: Record<string, string> = {
    default: 'bg-surface-main text-ink-muted',
    success: 'bg-[rgb(16_185_129_/_0.1)] text-success',
    warning: 'bg-[rgb(245_158_11_/_0.1)] text-warning',
    danger: 'bg-[rgb(239_68_68_/_0.1)] text-danger',
    brand: 'bg-brand-light text-brand',
  };
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', toneClasses[tone], className)}>
      {children}
    </span>
  );
}
