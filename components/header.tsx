'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import {
  Bars3Icon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { ThemeToggle } from './theme-toggle';
import { LanguageSelector } from './language-selector';
import { ZhortLogo } from './zhort-logo';
import { useTranslations } from 'next-intl';

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations('header');
  const firstNavItemRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);

  const navigation = [
    { name: t('home'), href: '/', show: true },
    { name: t('paste'), href: '/paste/create', show: true },
    { name: 'Password Share', href: '/passwords/create', show: !!session },
    { name: 'P2P Files', href: '/p2p/create', show: !!session },
    { name: t('bio'), href: '/dashboard/bio', show: !!session },
    { name: t('api'), href: '/api', show: true },
    { name: t('dashboard'), href: '/dashboard', show: !!session },
  ].filter((item) => item.show);

  const isActive = (href: string) => pathname === href;

  const navLinkClass =
    'text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-md hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

  const activeNavLinkClass =
    'text-sm font-medium text-foreground bg-accent px-3 py-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

  // Focus management: when mobile menu opens, focus the first nav item
  useEffect(() => {
    if (mobileMenuOpen && firstNavItemRef.current) {
      firstNavItemRef.current.focus();
    }
  }, [mobileMenuOpen]);

  // Keyboard navigation for mobile menu
  const handleMobileNavKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMobileMenuOpen(false);
      return;
    }

    const navItems = Array.from(
      document.querySelectorAll<HTMLElement>('[data-mobile-nav-item]'),
    );
    const currentIndex = navItems.indexOf(e.currentTarget);

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % navItems.length;
      navItems[nextIndex].focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex =
        (currentIndex - 1 + navItems.length) % navItems.length;
      navItems[prevIndex].focus();
    }
  };

  // Close mobile menu on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleMobileToggleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMobileMenuOpen(false);
    }
  };

  return (
    <header role="banner" className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label={t('mainNav')}>
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6 md:gap-8">
            <Link
              href="/"
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
              aria-label={t('home')}
            >
              <ZhortLogo size="md" />
            </Link>

            <div className="hidden md:flex items-center gap-0.5">
              <ul className="flex items-center gap-0.5 list-none">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={isActive(item.href) ? activeNavLinkClass : navLinkClass}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
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
            <div role="toolbar" aria-label={t('settings')}>
              <LanguageSelector />
              <ThemeToggle />
            </div>

            <button
              type="button"
              className="md:hidden flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t('openMenu')}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              onKeyDown={handleMobileToggleKeyDown}
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
                    <span className="max-w-[180px] truncate font-medium">
                      {session.user.email}
                    </span>
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
                          aria-label={t('logout')}
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

        {mobileMenuOpen ? (
          <div
            id="mobile-menu"
            className="md:hidden border-t border-border py-4"
            role="menu"
            aria-hidden={false}
          >
            <div className="space-y-0.5" role="none">
              {navigation.map((item, index) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2.5 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                  onKeyDown={handleMobileNavKeyDown}
                  role="menuitem"
                  tabIndex={0}
                  data-mobile-nav-item="true"
                  ref={index === 0 ? firstNavItemRef : undefined}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  {item.name}
                </Link>
              ))}
              <div className="border-t border-border my-2 pt-2 space-y-0.5" role="separator">
                <Link
                  href="/datenschutz"
                  className="block px-3 py-2.5 rounded-md text-base font-medium text-muted-foreground hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                  onKeyDown={handleMobileNavKeyDown}
                  role="menuitem"
                  tabIndex={0}
                  data-mobile-nav-item="true"
                >
                  {t('privacy')}
                </Link>
                <Link
                  href="https://www.michelfritzsch.de/impressum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2.5 rounded-md text-base font-medium text-muted-foreground hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                  onKeyDown={handleMobileNavKeyDown}
                  role="menuitem"
                  tabIndex={0}
                  data-mobile-nav-item="true"
                >
                  {t('imprint')}
                </Link>
              </div>
              {session ? (
                <div className="border-t border-border mt-2 pt-2">
                  <p className="px-3 py-2 text-sm text-muted-foreground truncate">
                    {session.user.email}
                  </p>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2.5 rounded-md text-base font-medium hover:bg-accent"
                    onClick={() => setMobileMenuOpen(false)}
                    onKeyDown={handleMobileNavKeyDown}
                    role="menuitem"
                    tabIndex={0}
                    data-mobile-nav-item="true"
                    aria-current={isActive('/dashboard') ? 'page' : undefined}
                  >
                    {t('dashboard')}
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2.5 rounded-md text-base font-medium text-destructive hover:bg-destructive/10"
                    aria-label={t('logout')}
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
                    onKeyDown={handleMobileNavKeyDown}
                    role="menuitem"
                    tabIndex={0}
                    data-mobile-nav-item="true"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href="/register"
                    className="block px-3 py-2.5 rounded-md text-base font-medium bg-primary text-primary-foreground text-center"
                    onClick={() => setMobileMenuOpen(false)}
                    onKeyDown={handleMobileNavKeyDown}
                    role="menuitem"
                    tabIndex={0}
                    data-mobile-nav-item="true"
                  >
                    {t('register')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
