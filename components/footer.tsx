'use client';

import { useState, useEffect } from 'react';
import { HeartIcon, LinkIcon, UserIcon } from '@heroicons/react/24/outline';
import { CookieSettingsButton } from './cookie-settings-button';
import { ZhortLogo } from './zhort-logo';
import { INITIAL_STATS } from '@/lib/stats-config';
import { useTranslations, useLocale } from 'next-intl';

export function Footer() {
  const [visitorCount, setVisitorCount] = useState(INITIAL_STATS.visitors);
  const [linkCount, setLinkCount] = useState(INITIAL_STATS.links);
  const t = useTranslations('footer');
  const locale = useLocale();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('/api/counter', { method: 'POST' });
        const data = await response.json();
        setVisitorCount(data.visitors || 0);
        setLinkCount(data.links || 0);
      } catch {
        setVisitorCount(INITIAL_STATS.visitors);
        setLinkCount(INITIAL_STATS.links);
      }
    };
    loadStats();
  }, []);

  const formatNumber = (num: number) => num.toLocaleString(locale);

  const footerLinkClass =
    'text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:underline';

  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">{t('statistics')}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                <UserIcon className="h-5 w-5 text-primary shrink-0" aria-hidden />
                <div>
                  <div className="text-lg font-semibold text-foreground tabular-nums">
                    {formatNumber(visitorCount)}
                  </div>
                  <div className="text-xs text-muted-foreground">{t('visitors')}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                <LinkIcon className="h-5 w-5 text-primary shrink-0" aria-hidden />
                <div>
                  <div className="text-lg font-semibold text-foreground tabular-nums">
                    {formatNumber(linkCount)}
                  </div>
                  <div className="text-xs text-muted-foreground">{t('links')}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center md:px-4">
            <div className="inline-flex items-center gap-2 mb-3">
              <ZhortLogo size="sm" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">{t('freeService')}</p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Zhort. {t('allRightsReserved')}
            </p>
          </div>

          <div className="text-center md:text-right">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center justify-center md:justify-end gap-2">
              <HeartIcon className="h-4 w-4 text-destructive" aria-hidden />
              {t('support')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs md:ml-auto">{t('supportText')}</p>
            <div className="flex flex-col gap-2 max-w-xs md:ml-auto">
              <a
                href="https://ko-fi.com/michelfritzsch"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-[#FF5E5B] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity min-h-[44px]"
              >
                Einmalig unterstützen
              </a>
              <a
                href="https://ko-fi.com/michelfritzsch/tiers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors min-h-[44px]"
              >
                Monatlich unterstützen
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <a href="/api" className={footerLinkClass}>
              {t('apiDocs')}
            </a>
            <span aria-hidden>·</span>
            <a href="/dashboard" className={footerLinkClass}>
              Dashboard
            </a>
            <span aria-hidden>·</span>
            <a href="/datenschutz" className={footerLinkClass}>
              {t('cookieSettings')}
            </a>
            <span aria-hidden>·</span>
            <CookieSettingsButton />
          </div>
          <p>
            {t('madeWith')} <span className="text-destructive" aria-label="love">♥</span> {t('by')}{' '}
            <span className="font-medium text-foreground">Michel</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
