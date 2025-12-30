'use client';

export type CookieCategory = 'necessary' | 'analytics' | 'marketing';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  consentGiven: boolean;
  consentDate?: string;
}

const COOKIE_CONSENT_KEY = 'zhort-cookie-consent';
const COOKIE_PREFERENCES_KEY = 'zhort-cookie-preferences';

export function getCookiePreferences(): CookiePreferences {
  if (typeof window === 'undefined') {
    return {
      necessary: true,
      analytics: false,
      marketing: false,
      consentGiven: false,
    };
  }

  try {
    const stored = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading cookie preferences:', error);
  }

  return {
    necessary: true,
    analytics: false,
    marketing: false,
    consentGiven: false,
  };
}

export function saveCookiePreferences(preferences: CookiePreferences): void {
  if (typeof window === 'undefined') return;

  try {
    const preferencesToSave = {
      ...preferences,
      consentDate: new Date().toISOString(),
    };
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferencesToSave));
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    
    // Dispatch event for other components to listen to
    window.dispatchEvent(new CustomEvent('cookiePreferencesUpdated', { detail: preferencesToSave }));
  } catch (error) {
    console.error('Error saving cookie preferences:', error);
  }
}

export function hasConsentBeenGiven(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(COOKIE_CONSENT_KEY) === 'true';
}

export function canUseAnalytics(): boolean {
  const preferences = getCookiePreferences();
  return preferences.analytics && preferences.consentGiven;
}

export function canUseMarketing(): boolean {
  const preferences = getCookiePreferences();
  return preferences.marketing && preferences.consentGiven;
}

export function resetCookiePreferences(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(COOKIE_CONSENT_KEY);
  localStorage.removeItem(COOKIE_PREFERENCES_KEY);
  window.dispatchEvent(new CustomEvent('cookiePreferencesUpdated', { 
    detail: {
      necessary: true,
      analytics: false,
      marketing: false,
      consentGiven: false,
    }
  }));
}
