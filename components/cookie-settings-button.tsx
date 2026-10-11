'use client';

import { useState, useCallback } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { CookiePreferencesModal } from './cookie-preferences-modal';
import { getCookiePreferences, saveCookiePreferences, type CookiePreferences } from '@/lib/cookie-consent';
import { useTranslations } from 'next-intl';

export function CookieSettingsButton() {
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(getCookiePreferences());
  const t = useTranslations('cookie');

  const handleOpenPreferences = useCallback(() => {
    setShowPreferences(true);
  }, []);

  const handleSavePreferences = useCallback((newPreferences: CookiePreferences) => {
    saveCookiePreferences(newPreferences);
    setPreferences(newPreferences);
    setShowPreferences(false);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={handleOpenPreferences}
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-2 py-1"
        aria-label={t('ariaLabel')}
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
