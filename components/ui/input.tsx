'use client';

import React, { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  'flex h-11 w-full rounded-lg border-2 bg-background px-4 py-2.5 text-sm font-medium transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground placeholder:font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
  {
    variants: {
      variant: {
        default: 'border-gray-300 dark:border-gray-700 focus-visible:border-primary focus-visible:shadow-lg focus-visible:shadow-primary/10',
        error: 'border-red-500 focus-visible:ring-red-500 focus-visible:shadow-lg focus-visible:shadow-red-500/10',
        success: 'border-green-500 focus-visible:ring-green-500 focus-visible:shadow-lg focus-visible:shadow-green-500/10',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  error?: boolean;
  label?: React.ReactNode;
  helperText?: string;
  errorText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, error, label, helperText, errorText, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const finalVariant = error ? 'error' : variant;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          id={inputId}
          className={inputVariants({ variant: finalVariant, className })}
          ref={ref}
          aria-invalid={error}
          aria-describedby={
            error && errorText
              ? `${inputId}-error`
              : helperText
              ? `${inputId}-helper`
              : undefined
          }
          {...props}
        />
        {error && errorText && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5"
            role="alert"
          >
            <span>⚠</span>
            {errorText}
          </p>
        )}
        {!error && helperText && (
          <p
            id={`${inputId}-helper`}
            className="text-xs text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
