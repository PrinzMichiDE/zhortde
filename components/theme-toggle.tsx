'use client';

import { useTheme } from './theme-provider';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';

export function ThemeToggle() {
  let theme: 'light' | 'dark' | 'system' = 'system';
  let setTheme: (theme: 'light' | 'dark' | 'system') => void = () => {};
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    setTheme = themeContext.setTheme;
  } catch {
    // ThemeProvider nicht verfügbar, verwende System-Präferenz
    if (typeof window !== 'undefined') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
  }

  const themes = [
    { value: 'light' as const, label: 'Hell', icon: SunIcon },
    { value: 'dark' as const, label: 'Dunkel', icon: MoonIcon },
    { value: 'system' as const, label: 'System', icon: ComputerDesktopIcon },
  ];

  const currentTheme = themes.find(t => t.value === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;

  return (
    <Menu as="div" className="relative">
      <MenuButton
        className="flex items-center justify-center w-11 h-11 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-200 dark:text-gray-300 dark:hover:text-indigo-400 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label="Theme wechseln"
        title="Theme wechseln"
      >
        <CurrentIcon className="h-5 w-5" aria-hidden="true" />
      </MenuButton>
      <MenuItems className="absolute right-0 mt-2 w-40 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100 overflow-hidden dark:bg-gray-800 dark:border-gray-700 z-50">
        <div className="py-1">
          {themes.map(({ value, label, icon: Icon }) => (
            <MenuItem key={value}>
              <button
                onClick={() => setTheme(value)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 ${
                  theme === value
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 dark:from-indigo-900/30 dark:to-purple-900/30 dark:text-indigo-400'
                    : 'text-gray-700 data-[focus]:bg-gray-100 dark:text-gray-300 dark:data-[focus]:bg-gray-700'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{label}</span>
                {theme === value && (
                  <span className="ml-auto text-indigo-600 dark:text-indigo-400" aria-hidden="true">✓</span>
                )}
              </button>
            </MenuItem>
          ))}
        </div>
      </MenuItems>
    </Menu>
  );
}
