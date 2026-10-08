'use client';

import React, { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  helperText?: string;
  'aria-describedby'?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, helperText, 'aria-describedby': ariaDescribedBy, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    // Build aria-describedby referencing error and/or helper text
    const describedByParts = [
      error ? errorId : null,
      helperText ? helperId : null,
    ].filter(Boolean);
    const combinedAriaDescribedBy = describedByParts.length > 0
      ? describedByParts.join(' ')
      : ariaDescribedBy;

    return (
      <div className="relative w-full">
        <input
          type={type}
          id={inputId}
          ref={ref}
          className={cn(
            'flex h-11 w-full rounded-lg border-2 bg-background px-4 py-2.5 text-sm font-medium transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground placeholder:font-normal disabled:cursor-not-allowed disabled:bg-muted',
            // Default state
            'border-gray-300 dark:border-gray-700 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:shadow-lg focus-visible:shadow-primary/10',
            // Error state
            error && 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500 focus-visible:shadow-lg focus-visible:shadow-red-500/10',
            // Success state
            props.success && 'border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500 focus-visible:shadow-lg focus-visible:shadow-green-500/10',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={combinedAriaDescribedBy}
          aria-required={props.required}
          {...props}
        />
        {error && (
          <p
            id={errorId}
            role="alert"
            aria-live="polite"
            className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400"
          >
            <span className="mr-1" aria-hidden="true">⚠</span>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={helperId}
            className="mt-1.5 text-xs text-muted-foreground"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };