'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrashIcon, EyeIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import { links } from '@/lib/db/schema';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

type LinkType = typeof links.$inferSelect;

interface LinksListProps {
  links: LinkType[];
}

export function LinksList({ links: initialLinks }: LinksListProps) {
  const [links, setLinks] = useState(initialLinks);
  const [deleting, setDeleting] = useState<number | null>(null);
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');

  const handleDelete = async (id: number) => {
    if (!confirm(t('deleteConfirm'))) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/links/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLinks(links.filter(link => link.id !== id));
      } else {
        alert(t('deleteError'));
      }
    } catch (error) {
      alert(t('deleteError'));
    } finally {
      setDeleting(null);
    }
  };

  const copyShortUrl = (shortCode: string) => {
    const baseUrl = window.location.origin;
    navigator.clipboard.writeText(`${baseUrl}/s/${shortCode}`);
  };

  if (links.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{t('noLinks')}</p>
        <Link
          href="/"
          className="mt-4 inline-block text-primary hover:text-primary/90 font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
        >
          {t('createFirstLink')}
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('shortCode')}
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('targetUrl')}
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('clicks')}
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('status')}
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('actions')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {links.map((link) => (
            <tr key={link.id} className="hover:bg-muted/50 transition-colors">
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  <code className="text-sm font-mono text-primary">
                    {link.shortCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyShortUrl(link.shortCode)}
                    title={tc('copy') as string}
                    aria-label={`${t('shortCode')} ${link.shortCode} ${tc('copy')}`}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <ClipboardIcon className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </td>
              <td className="px-4 sm:px-6 py-4">
                <div className="text-sm text-foreground max-w-md truncate">
                  {link.longUrl}
                </div>
              </td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-foreground">{link.hits}</div>
              </td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  link.isPublic
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                }`}>
                  {link.isPublic ? t('public') : t('private')}
                </span>
              </td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <a
                    href={`/s/${link.shortCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t('view') as string}
                    aria-label={`${t('link')} ${link.shortCode} ${t('view')}`}
                    className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), "h-8 w-8 text-primary hover:text-primary/80")}
                  >
                    <EyeIcon className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(link.id)}
                    disabled={deleting === link.id}
                    className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                    title={tc('delete') as string}
                    aria-label={`${t('link')} ${link.shortCode} ${tc('delete')}`}
                  >
                    <TrashIcon className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
