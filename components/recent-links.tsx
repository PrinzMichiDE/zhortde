'use client';

import { useEffect, useState } from 'react';
import { ClipboardIcon, CheckIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getRecentLinks, clearRecentLinks, type RecentLink } from '@/lib/recent-links';
import { useTranslations } from 'next-intl';

export function RecentLinks() {
  const [links, setLinks] = useState<RecentLink[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const t = useTranslations('linkForm');

  useEffect(() => {
    setLinks(getRecentLinks());

    const refresh = () => setLinks(getRecentLinks());
    window.addEventListener('storage', refresh);
    window.addEventListener('zhort:recent-updated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('zhort:recent-updated', refresh);
    };
  }, []);

  if (links.length === 0) {
    return null;
  }

  const copyUrl = (url: string, shortCode: string) => {
    navigator.clipboard.writeText(url);
    setCopiedCode(shortCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleClear = () => {
    clearRecentLinks();
    setLinks([]);
  };

  return (
    <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ClockIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          {t('recentLinks')}
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <TrashIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {t('clearRecent')}
        </button>
      </div>

      <ul className="space-y-2">
        {links.map((link) => (
          <li
            key={`${link.shortCode}-${link.createdAt}`}
            className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <a
                href={link.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm font-semibold text-primary hover:underline break-all"
              >
                {link.shortUrl.replace(/^https?:\/\//, '')}
              </a>
              <p className="mt-0.5 truncate text-xs text-muted-foreground" title={link.longUrl}>
                {link.longUrl}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyUrl(link.shortUrl, link.shortCode)}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted transition-colors min-h-[36px]"
            >
              {copiedCode === link.shortCode ? (
                <>
                  <CheckIcon className="h-4 w-4 text-green-600" aria-hidden="true" />
                  {t('copiedShort')}
                </>
              ) : (
                <>
                  <ClipboardIcon className="h-4 w-4" aria-hidden="true" />
                  {t('copyShort')}
                </>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
