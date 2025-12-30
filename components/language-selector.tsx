'use client';

import { useState, useTransition } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { GlobeAltIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useLocale } from 'next-intl';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';

export function LanguageSelector() {
  const currentLocale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (newLocale: Locale) => {
    startTransition(() => {
      // Set cookie and reload page to apply new locale
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      window.location.reload();
    });
  };

  return (
    <Menu as="div" className="relative">
      <MenuButton 
        className="flex items-center justify-center w-11 h-11 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Change language"
        disabled={isPending}
      >
        {isPending ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <span className="text-lg mr-0.5">{localeFlags[currentLocale]}</span>
            <GlobeAltIcon className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </MenuButton>
      
      <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-popover text-popover-foreground shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-border overflow-hidden z-50 max-h-96 overflow-y-auto">
        <div className="py-1">
          {locales.map((locale) => (
            <MenuItem key={locale}>
              <button
                onClick={() => handleLocaleChange(locale)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                  locale === currentLocale 
                    ? 'bg-accent text-accent-foreground font-medium' 
                    : 'data-[focus]:bg-accent data-[focus]:text-accent-foreground'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">{localeFlags[locale]}</span>
                  <span>{localeNames[locale]}</span>
                </span>
                {locale === currentLocale && (
                  <CheckIcon className="h-4 w-4 text-primary" aria-hidden="true" />
                )}
              </button>
            </MenuItem>
          ))}
        </div>
      </MenuItems>
    </Menu>
  );
}
