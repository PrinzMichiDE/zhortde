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
  ].filter((item) => item.show);

  const navLinkClass =
    'text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-md hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label={t('mainNav')}>
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6 md:gap-8">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-lg font-bold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
              aria-label="Zhort"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
                Z
              </span>
              <span>Zhort</span>
            </Link>

            <div className="hidden md:flex items-center gap-0.5">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href} className={navLinkClass}>
                  {item.name}
                </Link>
              ))}
              <div className="ml-2 pl-2 border-l border-border flex items-center gap-0.5">
                <Link href="/datenschutz" className={`${navLinkClass} text-xs`}>
                  {t('privacy')}
                </Link>
                <Link
                  href="https://www.michelfritzsch.de/impressum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${navLinkClass} text-xs`}
                >
                  {t('imprint')}
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />

            <button
              type="button"
              className="md:hidden flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

            <div className="hidden md:flex items-center gap-3">
              {status === 'loading' ? (
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              ) : session ? (
                <Menu as="div" className="relative">
                  <MenuButton
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground rounded-md p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={t('userMenu')}
                  >
                    <UserCircleIcon className="h-8 w-8" aria-hidden="true" />
                    <span className="max-w-[180px] truncate font-medium">{session.user.email}</span>
                  </MenuButton>
                  <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-popover text-popover-foreground shadow-lg border border-border focus:outline-none overflow-hidden">
                    <div className="py-1">
                      <MenuItem>
                        <Link
                          href="/dashboard"
                          className="block px-4 py-2.5 text-sm data-[focus]:bg-accent"
                        >
                          {t('dashboard')}
                        </Link>
                      </MenuItem>
                      <div className="border-t border-border my-1" />
                      <MenuItem>
                        <Link
                          href="/passwords/create"
                          className="block px-4 py-2.5 text-sm data-[focus]:bg-accent"
                        >
                          Password Sharing
                        </Link>
                      </MenuItem>
                      <MenuItem>
                        <Link
                          href="/p2p/create"
                          className="block px-4 py-2.5 text-sm data-[focus]:bg-accent"
                        >
                          P2P File Sharing
                        </Link>
                      </MenuItem>
                      <div className="border-t border-border my-1" />
                      <MenuItem>
                        <button
                          onClick={() => signOut()}
                          className="block w-full text-left px-4 py-2.5 text-sm text-destructive data-[focus]:bg-destructive/10"
                        >
                          {t('logout')}
                        </button>
                      </MenuItem>
                    </div>
                  </MenuItems>
                </Menu>
              ) : (
                <>
                  <Link href="/login" className={navLinkClass}>
                    {t('login')}
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[44px]"
                  >
                    {t('register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
            <div className="space-y-0.5">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2.5 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="border-t border-border my-2 pt-2 space-y-0.5">
                <Link
                  href="/datenschutz"
                  className="block px-3 py-2.5 rounded-md text-base font-medium text-muted-foreground hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('privacy')}
                </Link>
                <Link
                  href="https://www.michelfritzsch.de/impressum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2.5 rounded-md text-base font-medium text-muted-foreground hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('imprint')}
                </Link>
              </div>
              {session ? (
                <div className="border-t border-border mt-2 pt-2">
                  <p className="px-3 py-2 text-sm text-muted-foreground truncate">{session.user.email}</p>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2.5 rounded-md text-base font-medium hover:bg-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('dashboard')}
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2.5 rounded-md text-base font-medium text-destructive hover:bg-destructive/10"
                  >
                    {t('logout')}
                  </button>
                </div>
              ) : (
                <div className="border-t border-border mt-2 pt-2 space-y-1">
                  <Link
                    href="/login"
                    className="block px-3 py-2.5 rounded-md text-base font-medium hover:bg-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href="/register"
                    className="block px-3 py-2.5 rounded-md text-base font-medium bg-primary text-primary-foreground text-center"
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
