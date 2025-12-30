'use client';

import React, { InputHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  'w-full px-4 py-3 border-2 rounded-lg bg-white text-gray-900 placeholder-gray-500 transition-all duration-300 font-medium focus:outline-none focus:ring-2 min-h-[44px] dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400',
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 hover:border-indigo-400 dark:border-gray-600 dark:focus:border-indigo-400 dark:hover:border-gray-500',
        error: 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400',
        success: 'border-green-500 focus:border-green-500 focus:ring-green-500 dark:border-green-400',
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
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const finalVariant = error ? 'error' : variant;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-gray-800 dark:text-gray-200"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
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
            className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
            role="alert"
          >
            <span aria-hidden="true">⚠️</span>
            {errorText}
          </p>
        )}
        {!error && helperText && (
          <p
            id={`${inputId}-helper`}
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
