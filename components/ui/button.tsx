'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 aria-expanded\\:bg-primary/80',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        success: 'bg-green-600 text-white shadow-sm hover:bg-green-700',
        warning: 'bg-yellow-500 text-white shadow-sm hover:bg-yellow-600',
        info: 'bg-blue-500 text-white shadow-sm hover:bg-blue-600',
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 text-base min-h-[44px] min-w-[44px]',
        icon: 'h-10 w-10',
      },
      shape: {
        rounded: 'rounded-lg',
        squared: 'rounded-none',
      },
    },
    compoundVariants: [
      {
        variant: 'link',
        size: 'icon',
        className: 'h-10 w-10',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'md',
      shape: 'rounded',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, asChild = false, isLoading = false, children, disabled, ...props }, ref) => {
    const baseClassName = cn(
      buttonVariants({ variant, size, shape, className })
    );

    // Ensure minimum touch target size (WCAG 2.5.5)
    const finalClassName = cn(baseClassName, {
      'min-h-[44px] min-w-[44px]': !size || size === 'icon',
    });

    const buttonContent = asChild ? (
      <span className={finalClassName} {...props} ref={ref}>
        {isLoading ? (
          <span className="sr-only" aria-hidden="true">
            Loading...
          </span>
        ) : (
          children
        )}
      </span>
    ) : (
      <button
        className={finalClassName}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        aria-disabled={disabled || isLoading ? 'true' : undefined}
        type={props.type ?? 'button'}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <span className={isLoading ? 'sr-only' : ''}>
          {children}
        </span>
      </button>
    );

    return buttonContent;
  }
);

Button.displayName = 'Button';