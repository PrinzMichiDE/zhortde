'use client';

import { HTMLAttributes, forwardRef, ComponentPropsWithoutRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-xl border border-border bg-card text-card-foreground',
  {
    variants: {
      variant: {
        default: 'shadow-sm',
        elevated: 'shadow-md',
        outlined: 'bg-transparent shadow-none',
        glass: 'bg-card/80 backdrop-blur-sm shadow-sm',
        gradient: 'bg-muted/50 shadow-sm',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  as?: 'article' | 'section' | 'div';
  role?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, as = 'div', role, ...props }, ref) => {
    const Component = as;
    const finalRole = role || (as === 'article' ? undefined : undefined);

    return (
      <Component
        ref={ref}
        role={finalRole}
        className={cn(cardVariants({ variant, padding }), className)}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

// Card semantic sub-components for better accessibility
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  as?: 'header' | 'div';
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, as = 'header', ...props }, ref) => {
    const Component = as;
    return (
      <Component
        ref={ref}
        className={cn('flex flex-col space-y-1.5 p-6', className)}
        {...props}
      />
    );
  }
);

CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as = 'h3', ...props }, ref) => {
    const Component = as;
    return (
      <Component
        ref={ref}
        className={cn(
          'text-2xl font-semibold leading-none tracking-tight',
          className
        )}
        {...props}
      />
    );
  }
);

CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
      />
    );
  }
);

CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  as?: 'main' | 'section' | 'div';
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, as = 'div', ...props }, ref) => {
    const Component = as;
    return (
      <Component
        ref={ref}
        className={cn('p-6 pt-0', className)}
        {...props}
      />
    );
  }
);

CardContent.displayName = 'CardContent';

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  as?: 'footer' | 'div';
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, as = 'footer', ...props }, ref) => {
    const Component = as;
    return (
      <Component
        ref={ref}
        className={cn('flex items-center p-6 pt-0', className)}
        {...props}
      />
    );
  }
);

CardFooter.displayName = 'CardFooter';