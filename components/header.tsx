'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Bars3Icon, UserCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ThemeToggle } from './theme-toggle';
import { LanguageSelector } from './language-selector';
import { useTranslations } from 'next-intl';

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations('header');

  const navigation = [
    { name: t('home'), href: '/', show: true },
    { name: t('paste'), href: '/paste/create', show: true },
    { name: 'Password Share', href: '/passwords/create', show: !!session },
    { name: 'P2P Files', href: '/p2p/create', show: !!session },
    { name: t('bio'), href: '/dashboard/bio', show: !!session },
    { name: t('api'), href: '/api', show: true },
    { name: t('dashboard'), href: '/dashboard', show: !!session },
  ].filter(item => item.show);

  return (
    <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b-2 border-gray-200 dark:border-gray-800 sticky top-0 z-50 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label={t('mainNav')}>
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4 md:space-x-8">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-2xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent hover:scale-105 transform transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-lg px-2"
              aria-label="Zhort"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">Z</span>
              </div>
              <span>Zhort</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 relative group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {item.name}
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full" />
                </Link>
              ))}
              <div className="ml-2 pl-2 border-l border-border flex items-center gap-1">
                <Link
                  href="/datenschutz"
                  className="text-muted-foreground hover:text-foreground hover:bg-accent px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {t('privacy')}
                </Link>
                <Link
                  href="https://www.michelfritzsch.de/impressum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground hover:bg-accent px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {t('imprint')}
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Language Selector */}
            <LanguageSelector />
            
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label={t('openMenu')}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>

            {/* Desktop User Menu / Auth */}
            <div className="hidden md:flex items-center space-x-4">
              {status === 'loading' ? (
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              ) : session ? (
                <Menu as="div" className="relative">
                  <MenuButton 
                    className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors duration-200 group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg p-1"
                    aria-label={t('userMenu')}
                  >
                    <UserCircleIcon className="h-8 w-8 group-hover:scale-110 transition-transform duration-200" aria-hidden="true" />
                    <span className="text-sm font-medium">
                      {session.user.email}
                    </span>
                  </MenuButton>
                  <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-popover text-popover-foreground shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-border overflow-hidden">
                    <div className="py-1">
                      <MenuItem>
                        <Link
                          href="/dashboard"
                          className="block px-4 py-2.5 text-sm data-[focus]:bg-accent data-[focus]:text-accent-foreground transition-colors"
                        >
                          📊 {t('dashboard')}
                        </Link>
                      </MenuItem>
                      <div className="border-t border-border my-1" />
                      <MenuItem>
                        <Link
                          href="/passwords/create"
                          className="block px-4 py-2.5 text-sm data-[focus]:bg-accent data-[focus]:text-accent-foreground transition-colors"
                        >
                          🔐 Password Sharing
                        </Link>
                      </MenuItem>
                      <MenuItem>
                        <Link
                          href="/p2p/create"
                          className="block px-4 py-2.5 text-sm data-[focus]:bg-accent data-[focus]:text-accent-foreground transition-colors"
                        >
                          🌐 P2P File Sharing
                        </Link>
                      </MenuItem>
                      <div className="border-t border-border my-1" />
                      <MenuItem>
                        <button
                          onClick={() => signOut()}
                          className="block w-full text-left px-4 py-2.5 text-sm text-destructive data-[focus]:bg-destructive/10 transition-colors"
                        >
                          🚪 {t('logout')}
                        </button>
                      </MenuItem>
                    </div>
                  </MenuItems>
                </Menu>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href="/register"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-lg text-sm font-semibold shadow hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {t('register')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 animate-slide-up bg-background">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="border-t border-border my-2 pt-2 space-y-1">
                <Link
                  href="/datenschutz"
                  className="block px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('privacy')}
                </Link>
                <Link
                  href="https://www.michelfritzsch.de/impressum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('imprint')}
                </Link>
              </div>
              {session ? (
                <>
                  <div className="border-t border-border my-2 pt-2">
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {session.user.email}
                    </div>
                    <Link
                      href="/dashboard"
                      className="block px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      📊 {t('dashboard')}
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-lg text-base font-medium text-destructive hover:bg-destructive/10 transition-all duration-200"
                    >
                      🚪 {t('logout')}
                    </button>
                  </div>
                </>
              ) : (
                <div className="border-t border-border my-2 pt-2 space-y-1">
                  <Link
                    href="/login"
                    className="block px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href="/register"
                    className="block px-3 py-2 rounded-lg text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('register')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
