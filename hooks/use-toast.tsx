'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// ─── Type Definitions ────────────────────────────────────────────────────────

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title?: string;
  description?: string;
  duration?: number;
  action?: React.ReactNode;
  closeButton?: boolean;
}

export type ToastInput = Omit<ToastProps, 'id'>;

// ─── Context ─────────────────────────────────────────────────────────────────

interface ToastContextValue {
  toasts: ToastProps[];
  addToast: (toast: ToastInput | ToastProps) => string;
  removeToast: (id: string) => void;
  toast: {
    success: (title: string, description?: string, options?: Omit<ToastInput, 'type'>) => string;
    error: (title: string, description?: string, options?: Omit<ToastInput, 'type'>) => string;
    warning: (title: string, description?: string, options?: Omit<ToastInput, 'type'>) => string;
    info: (title: string, description?: string, options?: Omit<ToastInput, 'type'>) => string;
    default: (title: string, description?: string, options?: Omit<ToastInput, 'type'>) => string;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}

export function useToast() {
  const context = useToastContext();

  return {
    ...context,
    toast: {
      success: (title: string, description?: string, options?: Omit<ToastInput, 'type'>) =>
        context.addToast({ type: 'success', title, description, ...options }),
      error: (title: string, description?: string, options?: Omit<ToastInput, 'type'>) =>
        context.addToast({ type: 'error', title, description, ...options }),
      warning: (title: string, description?: string, options?: Omit<ToastInput, 'type'>) =>
        context.addToast({ type: 'warning', title, description, ...options }),
      info: (title: string, description?: string, options?: Omit<ToastInput, 'type'>) =>
        context.addToast({ type: 'info', title, description, ...options }),
      default: (title: string, description?: string, options?: Omit<ToastInput, 'type'>) =>
        context.addToast({ type: 'default', title, description, ...options }),
    },
  };
}

// ─── Provider ────────────────────────────────────────────────────────────────

const generateId = () => Math.random().toString(36).substring(2, 9);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback((toast: ToastInput | ToastProps) => {
    const id = 'toast-' + generateId();
    const toastWithId: ToastProps = {
      id,
      duration: 5000,
      closeButton: true,
      ...toast,
    };

    setToasts((prev) => [...prev, toastWithId]);

    // Auto-remove after duration
    const timer = setTimeout(() => {
      removeToast(id);
    }, toastWithId.duration ?? 5000);

    timersRef.current.set(id, timer);

    return id;
  }, [removeToast]);

  const contextValue: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    toast: {
      success: (title, description, options) =>
        addToast({ type: 'success', title, description, ...options }),
      error: (title, description, options) =>
        addToast({ type: 'error', title, description, ...options }),
      warning: (title, description, options) =>
        addToast({ type: 'warning', title, description, ...options }),
      info: (title, description, options) =>
        addToast({ type: 'info', title, description, ...options }),
      default: (title, description, options) =>
        addToast({ type: 'default', title, description, ...options }),
    },
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastRegion />
    </ToastContext.Provider>
  );
}

// ─── Toast item ──────────────────────────────────────────────────────────────

const toastStyles: Record<ToastType, string> = {
  default: 'border-border bg-card text-foreground',
  success: 'border-green-500/50 bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100',
  error: 'border-red-500/50 bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-100',
  warning: 'border-yellow-500/50 bg-yellow-50 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-100',
  info: 'border-blue-500/50 bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100',
};

function Toast({ toast }: { toast: ToastProps }) {
  const { removeToast } = useToastContext();

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg',
        toastStyles[toast.type],
      )}
    >
      <div className="min-w-0 flex-1">
        {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
        {toast.description && (
          <p className="mt-1 text-sm opacity-90">{toast.description}</p>
        )}
        {toast.action}
      </div>
      {toast.closeButton && (
        <button
          type="button"
          onClick={() => removeToast(toast.id)}
          className="rounded p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Benachrichtigung schließen"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── Toast Region (aria-live) ────────────────────────────────────────────────

function ToastRegion() {
  const { toasts } = useToastContext();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions removals"
      className="fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2 focus:outline-none"
      role="region"
      aria-label="Benachrichtigungen"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
