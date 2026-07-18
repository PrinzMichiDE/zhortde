export const locales = ['de', 'en', 'zh', 'hi', 'es', 'fr', 'ar', 'bn', 'pt', 'ru', 'ja', 'ko', 'vi', 'tr', 'it'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'de';

/** Fixed timezone avoids next-intl ENVIRONMENT_FALLBACK SSR warnings */
export const defaultTimeZone = 'Europe/Berlin';

export const localeNames: Record<Locale, string> = {
  de: 'Deutsch',
  en: 'English',
  zh: '中文',
  hi: 'हिन्दी',
  es: 'Español',
  fr: 'Français',
  ar: 'العربية',
  bn: 'বাংলা',
  pt: 'Português',
  ru: 'Русский',
  ja: '日本語',
  ko: '한국어',
  vi: 'Tiếng Việt',
  tr: 'Türkçe',
  it: 'Italiano',
};

export const localeFlags: Record<Locale, string> = {
  de: '🇩🇪',
  en: '🇺🇸',
  zh: '🇨🇳',
  hi: '🇮🇳',
  es: '🇪🇸',
  fr: '🇫🇷',
  ar: '🇸🇦',
  bn: '🇧🇩',
  pt: '🇧🇷',
  ru: '🇷🇺',
  ja: '🇯🇵',
  ko: '🇰🇷',
  vi: '🇻🇳',
  tr: '🇹🇷',
  it: '🇮🇹',
};

// RTL languages
export const rtlLocales: Locale[] = ['ar'];

export function isRtlLocale(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}
