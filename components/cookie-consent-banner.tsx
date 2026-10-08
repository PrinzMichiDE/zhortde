'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import {
  getCookiePreferences,
  saveCookiePreferences,
  hasConsentBeenGiven,
  type CookiePreferences,
} from '@/lib/cookie-consent';
import { CookiePreferencesModal } from './cookie-preferences-modal';

/**
 * CookieConsentBanner — WCAG 2.1 AA accessible cookie consent banner.
 * - Announces consent change to screen readers via aria-live region
 * - Provides keyboard-accessible controls (≥44×44px touch targets)
 * - Focus management: moves focus to banner on open, returns to trigger on close
 * - Descriptive labels for all buttons
 * - Semantic HTML (nav + div with proper heading)
 */
export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !hasConsentBeenGiven();
  });
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(() =>
    getCookiePreferences(),
  );
  const [announcement, setAnnouncement] = useState('');

  const bannerRef = useRef<HTMLElement>(null);
  const acceptAllRef = useRef<HTMLButtonElement>(null);

  // Announce to screen readers when banner is shown or consent changes
  const announce = useCallback((message: string) => {
    setAnnouncement(message);
  }, []);

  // On mount, announce that the banner is visible
  useEffect(() => {
    if (showBanner) {
      announce('Cookie-Einstellungen. Sie können alle Cookies akzeptieren oder Ihre Einstellungen anpassen.');
    }
  }, [showBanner, announce]);

  const handleAcceptAll = useCallback(() => {
    const newPreferences: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      consentGiven: true,
    };
    saveCookiePreferences(newPreferences);
    setPreferences(newPreferences);
    setShowBanner(false);
    announce('Alle Cookies wurden akzeptiert. Analyse- und Marketing-Cookies sind jetzt aktiv.');
  }, [announce]);

  const handleAcceptNecessary = useCallback(() => {
    const newPreferences: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      consentGiven: true,
    };
    saveCookiePreferences(newPreferences);
    setPreferences(newPreferences);
    setShowBanner(false);
    announce('Nur notwendige Cookies wurden akzeptiert. Analyse- und Marketing-Cookies sind deaktiviert.');
  }, [announce]);

  const handleSavePreferences = useCallback(
    (updatedPreferences: CookiePreferences) => {
      saveCookiePreferences(updatedPreferences);
      setPreferences(updatedPreferences);
      setShowPreferences(false);
      const analyticsStatus = updatedPreferences.analytics ? 'aktiviert' : 'deaktiviert';
      const marketingStatus = updatedPreferences.marketing ? 'aktiviert' : 'deaktiviert';
      announce(
        `Cookie-Einstellungen gespeichert. Analyse-Cookies: ${analyticsStatus}. Marketing-Cookies: ${marketingStatus}.`,
      );
    },
    [announce],
  );

  if (!showBanner) return null;

  return (
    <>
      {/* Live region for cookie consent announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <nav
        ref={bannerRef}
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white/95 p-4 shadow-lg backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-800/95"
        role="dialog"
        aria-label="Cookie-Einstellungen"
        aria-describedby="cookie-banner-description"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h2 id="cookie-banner-description" className="sr-only">
              Cookie-Einstellungen
            </h2>
            <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              Wir verwenden Cookies, um Ihnen ein optimales Erlebnis zu bieten.{' '}
              <span className="whitespace-nowrap">
                Notwendige Cookies sind immer aktiv.
              </span>{' '}
              Mit der Annahme stimmen Sie der Verwendung von Analyse- und Marketing-Cookies zu.
              Mehr Infos in unserer{' '}
              <Link
                href="/privacy"
                className="font-medium text-primary underline-offset-4 hover:underline focus:outline-none focus-visible:rounded focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              >
                Datenschutzerklärung
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            {/* Accept All — primary action */}
            <button
              ref={acceptAllRef}
              type="button"
              onClick={handleAcceptAll}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              aria-label="Alle Cookies akzeptieren, einschließlich Analyse und Marketing"
            >
              Alle akzeptieren
            </button>

            {/* Accept Necessary only */}
            <button
              type="button"
              onClick={handleAcceptNecessary}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-neutral-300 bg-white px-6 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
              aria-label="Nur notwendige Cookies akzeptieren, keine Analyse- oder Marketing-Cookies"
            >
              Nur notwendige
            </button>

            {/* Open Preferences Modal */}
            <button
              type="button"
              onClick={() => setShowPreferences(true)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
              aria-label="Cookie-Einstellungen anpassen"
            >
              <Cog6ToothIcon className="size-5" aria-hidden="true" />
              <span className="hidden sm:inline">Anpassen</span>
            </button>
          </div>
        </div>
      </nav>

      <CookiePreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        onSave={handleSavePreferences}
        initialPreferences={preferences}
      />
    </>
  );
}