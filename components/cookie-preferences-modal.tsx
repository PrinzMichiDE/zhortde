'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { CookiePreferences } from '@/lib/cookie-consent';

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: CookiePreferences) => void;
  initialPreferences: CookiePreferences;
}

export function CookiePreferencesModal({
  isOpen,
  onClose,
  onSave,
  initialPreferences,
}: CookiePreferencesModalProps) {
  const [preferences, setPreferences] = useState<CookiePreferences>(initialPreferences);

  const handleSave = () => {
    onSave({
      ...preferences,
      consentGiven: true,
    });
  };

  const handleToggle = (category: keyof CookiePreferences) => {
    if (category === 'necessary') return; // Necessary cookies cannot be disabled
    
    setPreferences((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-labelledby="cookie-preferences-title"
      aria-modal="true"
    >
      <div
        className="bg-card rounded-xl shadow-2xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 
            id="cookie-preferences-title"
            className="text-2xl font-bold text-foreground"
          >
            Cookie-Einstellungen
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Schließen"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            Sie können Ihre Cookie-Präferenzen individuell anpassen. Weitere Informationen finden Sie in unserer{' '}
            <Link href="/datenschutz" className="text-primary hover:underline font-medium">
              Datenschutzerklärung
            </Link>.
          </p>

          {/* Necessary Cookies */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Notwendige Cookies
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden. 
                  Sie werden normalerweise nur als Reaktion auf Ihre Aktionen gesetzt, die einer Anfrage nach Diensten 
                  entsprechen, wie z. B. das Festlegen Ihrer Datenschutzeinstellungen, das Anmelden oder das Ausfüllen von Formularen.
                </p>
              </div>
              <div className="ml-4">
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-ring cursor-not-allowed opacity-50"
                  aria-label="Notwendige Cookies (immer aktiv)"
                />
              </div>
            </div>
          </div>

          {/* Analytics Cookies */}
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Analyse-Cookies
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Diese Cookies ermöglichen es uns, die Anzahl der Besucher zu zählen und zu verstehen, wie Besucher 
                  mit unserer Website interagieren. Alle Informationen, die diese Cookies sammeln, sind aggregiert und 
                  daher anonym. Wenn Sie diese Cookies nicht zulassen, wissen wir nicht, wann Sie unsere Website besucht haben.
                </p>
              </div>
              <div className="ml-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={() => handleToggle('analytics')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Marketing Cookies */}
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Marketing-Cookies
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Diese Cookies werden verwendet, um Besuchern auf Websites relevante Anzeigen und Marketingkampagnen 
                  bereitzustellen. Diese Cookies verfolgen Besucher über Websites hinweg und sammeln Informationen, 
                  um angepasste Anzeigen bereitzustellen. Aktuell verwenden wir keine Marketing-Cookies.
                </p>
              </div>
              <div className="ml-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={() => handleToggle('marketing')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
            <button
              onClick={handleSave}
              className="flex-1 px-5 py-3 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Präferenzen speichern
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3 text-sm font-medium text-muted-foreground hover:text-foreground bg-background hover:bg-accent border border-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
