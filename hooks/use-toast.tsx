'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

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
