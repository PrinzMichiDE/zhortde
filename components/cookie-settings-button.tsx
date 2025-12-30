'use client';

import { useState } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { CookiePreferencesModal } from './cookie-preferences-modal';
import { getCookiePreferences, saveCookiePreferences, type CookiePreferences } from '@/lib/cookie-consent';

export function CookieSettingsButton() {
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(getCookiePreferences());

  const handleSavePreferences = (newPreferences: CookiePreferences) => {
    saveCookiePreferences(newPreferences);
    setPreferences(newPreferences);
    setShowPreferences(false);
  };

  return (
    <>
      <button
        onClick={() => setShowPreferences(true)}
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-2 py-1"
        aria-label="Cookie-Einstellungen öffnen"
      >
        <Cog6ToothIcon className="h-4 w-4" aria-hidden="true" />
        <span className="text-xs">Cookie-Einstellungen</span>
      </button>

      <CookiePreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        onSave={handleSavePreferences}
        initialPreferences={preferences}
      />
    </>
  );
}
