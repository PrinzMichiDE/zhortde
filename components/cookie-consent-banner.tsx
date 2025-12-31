'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { 
  getCookiePreferences, 
  saveCookiePreferences, 
  hasConsentBeenGiven,
  type CookiePreferences 
} from '@/lib/cookie-consent';
import { CookiePreferencesModal } from './cookie-preferences-modal';

export function CookieConsentBanner() {
  const pathname = usePathname();
  const [showBanner, setShowBanner] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !hasConsentBeenGiven();
  });
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(() => getCookiePreferences());

  // Keep /bio pages clean like Linktree (no cookie banner overlay).
  if (pathname === '/bio' || pathname.startsWith('/bio/')) {
    return null;
  }

  const handleAcceptAll = () => {
    const newPreferences: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      consentGiven: true,
    };
    saveCookiePreferences(newPreferences);
    setPreferences(newPreferences);
    setShowBanner(false);
  };

  const handleAcceptNecessary = () => {
    const newPreferences: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      consentGiven: true,
    };
    saveCookiePreferences(newPreferences);
    setPreferences(newPreferences);
    setShowBanner(false);
  };

  const handleSavePreferences = (newPreferences: CookiePreferences) => {
    saveCookiePreferences(newPreferences);
    setPreferences(newPreferences);
    setShowBanner(false);
    setShowPreferences(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <>
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-2xl animate-slide-up"
        role="dialog"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-description"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1">
              <h3 
                id="cookie-consent-title"
                className="text-lg font-semibold text-foreground mb-2"
              >
                🍪 Cookie-Einstellungen
              </h3>
              <p 
                id="cookie-consent-description"
                className="text-sm text-muted-foreground leading-relaxed"
              >
                Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung zu bieten. 
                Einige Cookies sind für den Betrieb der Website notwendig, andere helfen uns, 
                die Website zu verbessern und zu analysieren. Sie können Ihre Präferenzen jederzeit anpassen.{' '}
                <Link 
                  href="/datenschutz" 
                  className="text-primary hover:underline font-medium"
                >
                  Mehr erfahren
                </Link>
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setShowPreferences(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-background hover:bg-accent border border-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label="Cookie-Einstellungen anpassen"
              >
                <Cog6ToothIcon className="h-4 w-4" aria-hidden="true" />
                Einstellungen
              </button>
              
              <button
                onClick={handleAcceptNecessary}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-transparent hover:bg-accent rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Nur notwendige
              </button>
              
              <button
                onClick={handleAcceptAll}
                className="px-5 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Alle akzeptieren
              </button>
            </div>
          </div>
        </div>
      </div>

      <CookiePreferencesModal
        key={showPreferences ? 'open' : 'closed'}
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        onSave={handleSavePreferences}
        initialPreferences={preferences}
      />
    </>
  );
}
