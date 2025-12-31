'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrashIcon, EyeIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import { campaigns as campaignsTable, links } from '@/lib/db/schema';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

type LinkType = typeof links.$inferSelect;
type CampaignType = typeof campaignsTable.$inferSelect;

interface LinksListProps {
  links: LinkType[];
  campaigns: CampaignType[];
}

export function LinksList({ links: initialLinks, campaigns: initialCampaigns }: LinksListProps) {
  const [links, setLinks] = useState(initialLinks);
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [assigningLinkId, setAssigningLinkId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
  });
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
    } catch {
      alert(t('deleteError'));
    } finally {
      setDeleting(null);
    }
  };

  const copyShortUrl = (shortCode: string) => {
    const baseUrl = window.location.origin;
    navigator.clipboard.writeText(`${baseUrl}/s/${shortCode}`);
  };

  const campaignNameById = new Map<number, string>(campaigns.map((c) => [c.id, c.name]));

  const handleCampaignChange = async (linkId: number, value: string) => {
    const nextCampaignId: number | null = value === '' ? null : Number(value);
    if (
      nextCampaignId !== null &&
      (!Number.isFinite(nextCampaignId) || !Number.isInteger(nextCampaignId) || nextCampaignId <= 0)
    ) {
      alert('Ungültige Kampagne');
      return;
    }

    setAssigningLinkId(linkId);
    try {
      const response = await fetch(`/api/links/${linkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: nextCampaignId }),
      });

      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error || 'Fehler beim Zuordnen der Kampagne');
      }

      const updated = (await response.json()) as LinkType;
      setLinks((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Fehler beim Zuordnen der Kampagne';
      alert(msg);
    } finally {
      setAssigningLinkId(null);
    }
  };

  const openCreate = () => {
    setCreateForm({ name: '', description: '' });
    setIsCreateOpen(true);
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          description: createForm.description || undefined,
        }),
      });

      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(err?.error?.message || 'Fehler beim Erstellen der Kampagne');
      }

      const data = (await response.json()) as { data: CampaignType };
      setCampaigns((prev) => [data.data, ...prev]);
      setIsCreateOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Fehler beim Erstellen der Kampagne';
      alert(msg);
    } finally {
      setCreating(false);
    }
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          Kampagnen helfen dir, Links zu gruppieren (z.B. pro Marketing-Aktion).
        </div>
        <Button type="button" onClick={openCreate} className="min-h-[44px]">
          Neue Kampagne
        </Button>
      </div>

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
              Kampagne
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
                <label className="sr-only" htmlFor={`campaign-${link.id}`}>
                  Kampagne für {link.shortCode}
                </label>
                <select
                  id={`campaign-${link.id}`}
                  value={link.campaignId ?? ''}
                  onChange={(e) => handleCampaignChange(link.id, e.target.value)}
                  disabled={assigningLinkId === link.id}
                  className="min-h-[44px] max-w-[220px] w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm disabled:opacity-60"
                  title={link.campaignId ? campaignNameById.get(link.campaignId) : 'Keine Kampagne'}
                >
                  <option value="">— Keine —</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
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

      {/* Create Campaign Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Neue Kampagne</h3>
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="min-h-[44px]">
                Schließen
              </Button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="z.B. Black Friday 2026"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Beschreibung (optional)
                </label>
                <Input
                  value={createForm.description}
                  onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Kurzbeschreibung"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="min-h-[44px]">
                  Abbrechen
                </Button>
                <Button type="submit" loading={creating} className="min-h-[44px]">
                  Erstellen
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
