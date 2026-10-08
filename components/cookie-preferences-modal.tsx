'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { CookiePreferences } from '@/lib/cookie-consent';

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: CookiePreferences) => void;
  initialPreferences: CookiePreferences;
}

/**
 * CookiePreferencesModal — WCAG 2.1 AA accessible modal dialog.
 * - role="dialog" + aria-modal + aria-labelledby for proper dialog semantics
 * - Focus trap: cycles focus within the modal while open
 * - Focus restore: returns focus to the element that opened the modal on close
 * - Escape key closes the dialog
 * - Screen reader announcements for cookie category descriptions
 */
export function CookiePreferencesModal({
  isOpen,
  onClose,
  onSave,
  initialPreferences,
}: CookiePreferencesModalProps) {
  const [preferences, setPreferences] = useState<CookiePreferences>(initialPreferences);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const focusableRef = useRef<HTMLButtonElement>(null);

  // Save focus of the element that opened the dialog
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  // Track what was open to reset state
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  // Reset preferences when modal opens with new initial values
  useEffect(() => {
    if (isOpen) {
      setPreferences(initialPreferences);
      // Save the currently focused element and move focus to dialog
      lastFocusedElement.current = document.activeElement as HTMLElement;
      // Focus the first focusable element inside the dialog
      setTimeout(() => {
        focusableRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialPreferences]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCancel();
        return;
      }

      // Focus trap with Tab/Shift+Tab
      if (event.key === 'Tab') {
        const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );

        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift+Tab: if on first element, wrap to last
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: if on last element, wrap to first
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Trap body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const handleSave = useCallback(() => {
    onSave({
      ...preferences,
      consentGiven: true,
    });
    handleCancel();
  }, [onSave, preferences]);

  const handleCancel = useCallback(() => {
    onClose();
    // Restore focus to the element that triggered the modal
    if (lastFocusedElement.current) {
      lastFocusedElement.current.focus();
    }
  }, [onClose]);

  const handleToggle = (category: keyof CookiePreferences) => {
    if (category === 'necessary') return; // Necessary cookies cannot be disabled

    setPreferences((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  if (!isOpen) return null;

  const cookieCategories: {
    key: keyof CookiePreferences;
    title: string;
    description: string;
    required: boolean;
  }[] = [
    {
      key: 'necessary',
      title: 'Notwendige Cookies',
      description:
        'Erforderlich für den Betrieb der Website. Diese Cookies ermöglichen Grundfunktionen wie Seitennavigation und sicheren Bereich. Ohne diese Cookies funktioniert die Website nicht korrekt.',
      required: true,
    },
    {
      key: 'analytics',
      title: 'Analyse-Cookies',
      description:
        'Helfen uns zu verstehen, wie Besucher mit der Website interagieren. Sammeln Informationen anonym über besuchte Seiten und Fehlermeldungen.',
      required: false,
    },
    {
      key: 'marketing',
      title: 'Marketing-Cookies',
      description:
        'Werden verwendet, um Ihnen relevante Werbung und Marketing-Inhalte auf anderen Websites anzubieten.',
      required: false,
    },
  ];

  return (
    // Backdrop with blur and dark overlay
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
      aria-hidden="true"
    >
      {/* Dialog panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-modal-title"
        aria-describedby="cookie-modal-description"
        className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-700 dark:bg-neutral-800"
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex-1">
            <h2
              id="cookie-modal-title"
              className="text-xl font-semibold text-neutral-900 dark:text-neutral-100"
            >
              Cookie-Einstellungen anpassen
            </h2>
            <p
              id="cookie-modal-description"
              className="mt-1 text-sm text-neutral-600 dark:text-neutral-400"
            >
              Wählen Sie aus, welche Cookies Sie zulassen möchten.
              Notwendige Cookies können nicht deaktiviert werden.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="ml-4 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
            aria-label="Cookie-Einstellungen schließen"
          >
            <XMarkIcon className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* Cookie categories */}
        <div className="space-y-4" role="group" aria-label="Cookie-Kategorien">
          {cookieCategories.map((category) => (
            <label
              key={category.key}
              className="flex items-start justify-between gap-4 rounded-lg border border-neutral-200 p-4 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-750"
            >
              <div className="flex-1">
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {category.title}
                  {category.required && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                      Erforderlich
                    </span>
                  )}
                </span>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  {category.description}
                </p>
              </div>
              <input
                ref={category.key === 'necessary' ? focusableRef : undefined}
                type="checkbox"
                checked={preferences[category.key] ?? category.required}
                disabled={category.required}
                onChange={() => handleToggle(category.key)}
                className="mt-1 h-5 w-5 cursor-pointer rounded border-neutral-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-neutral-600 dark:focus:ring-offset-neutral-800"
                aria-describedby={`desc-${category.key}`}
                aria-required={category.required}
              />
              <span id={`desc-${category.key}`} className="sr-only">
                {category.title}: {category.required ? 'Immer aktiv' : ''}
              </span>
            </label>
          ))}
        </div>

        {/* Footer actions */}
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-neutral-300 bg-white px-6 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          >
            Einstellungen speichern
          </button>
        </div>

        {/* Legal link */}
        <p className="mt-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
          Mehr Informationen finden Sie in unserer{' '}
          <Link
            href="/privacy"
            className="font-medium text-primary underline-offset-4 hover:underline focus:outline-none focus-visible:rounded focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          >
            Datenschutzerklärung
          </Link>
        </p>
      </div>
    </div>
  );
}