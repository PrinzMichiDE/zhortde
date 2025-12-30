import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { locales, defaultLocale, type Locale } from './config';

export default getRequestConfig(async () => {
  // Try to get locale from cookie first
  const cookieStore = await cookies();
  let locale = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;
  
  // If no cookie, try to detect from Accept-Language header
  if (!locale || !locales.includes(locale)) {
    const headerStore = await headers();
    const acceptLanguage = headerStore.get('accept-language');
    
    if (acceptLanguage) {
      // Parse Accept-Language header and find the best match
      const browserLocales = acceptLanguage
        .split(',')
        .map(lang => {
          const [code, priority = 'q=1.0'] = lang.trim().split(';');
          return {
            code: code.split('-')[0].toLowerCase(), // Get base language code
            priority: parseFloat(priority.replace('q=', ''))
          };
        })
        .sort((a, b) => b.priority - a.priority);
      
      // Find the first matching locale
      for (const browserLocale of browserLocales) {
        const matchedLocale = locales.find(l => l === browserLocale.code);
        if (matchedLocale) {
          locale = matchedLocale;
          break;
        }
      }
    }
  }
  
  // Fallback to default locale
  if (!locale || !locales.includes(locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
