import { ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
}

const VARIANT_CLASSES: Record<string, string> = {
  primary: 'bg-brand text-ink-onBrand hover:bg-brand-hover',
  secondary: 'bg-transparent border border-line text-ink-main hover:bg-surface-main',
  danger: 'bg-danger text-white hover:opacity-90',
  ghost: 'bg-transparent text-ink-muted hover:text-ink-main',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'btn-shape inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {loading ? 'Enviando...' : children}
    </button>
  ),
);
Button.displayName = 'Button';
