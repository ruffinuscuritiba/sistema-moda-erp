import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, id, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label htmlFor={id} className="text-sm font-medium text-ink-main">
        {label}
      </label>
    )}
    <input
      ref={ref}
      id={id}
      className={clsx(
        'rounded-md border border-line bg-[var(--input-bg)] px-3 py-2.5 text-sm text-ink-main placeholder:text-ink-muted',
        'focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)] focus:border-brand',
        className,
      )}
      {...props}
    />
    {error && <span className="text-xs text-danger">{error}</span>}
  </div>
));
Input.displayName = 'Input';
