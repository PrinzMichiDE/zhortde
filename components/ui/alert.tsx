'use client';

import { HTMLAttributes, forwardRef, useEffect, useRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { XMarkIcon } from '@heroicons/react/24/outline';

const alertVariants = cva(
  'p-4 rounded-lg border-l-4 flex items-start gap-3 animate-slide-up',
  {
    variants: {
      variant: {
        error: 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/20 dark:border-red-400 dark:text-red-300',
        success: 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:border-green-400 dark:text-green-300',
        warning: 'bg-yellow-50 border-yellow-500 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-400 dark:text-yellow-300',
        info: 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
);

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  'aria-label'?: string;
}

const alertIcons: Record<string, React.ReactNode> = {
  error: (
    <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
  ),
  success: (
    <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
    </svg>
  ),
};

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, title, icon, dismissible = false, onDismiss, 'aria-label': ariaLabel, ...props }, ref) => {
    const dismissButtonRef = useRef<HTMLButtonElement>(null);
    const alertId = `alert-${Math.random().toString(36).slice(2, 9)}`;

    // Auto-dismiss after timeout if specified
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    const handleDismiss = () => {
      if (onDismiss) {
        onDismiss();
      }
    };

    const alertContent = (
      <div
        ref={ref}
        id={alertId}
        role="alert"
        aria-live="polite"
        aria-label={ariaLabel || title}
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {icon || alertIcons[variant as keyof typeof alertIcons]}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-sm font-semibold">{title}</h3>
          )}
          <div className="text-sm">{props.children}</div>
        </div>
        {dismissible && (
          <button
            ref={dismissButtonRef}
            type="button"
            className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
            onClick={handleDismiss}
            aria-label="Benachrichtigung schließen"
          >
            <XMarkIcon className="h-4 w-4" />
            <span className="sr-only">Schließen</span>
          </button>
        )}
      </div>
    );

    return alertContent;
  }
);

Alert.displayName = 'Alert';

// Toast/Alerter for dynamic notifications
export interface AlerterToastProps {
  id: string;
  message: string;
  variant?: 'error' | 'success' | 'warning' | 'info';
  duration?: number;
  onDismiss?: (id: string) => void;
}

export function AlerterToast({ id, message, variant = 'info', duration = 5000, onDismiss }: AlerterToastProps) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (onDismiss) {
        onDismiss(id);
      }
    }, duration);

    return () => clearTimeout(timeout);
  }, [id, duration, onDismiss]);

  return (
    <Alert variant={variant} className="w-full max-w-sm">
      <span>{message}</span>
      <button
        type="button"
        onClick={() => onDismiss?.(id)}
        className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
        aria-label="Benachrichtigung schließen"
      >
        <XMarkIcon className="h-4 w-4" />
        <span className="sr-only">Schließen</span>
      </button>
    </Alert>
  );
}

export { Alert };