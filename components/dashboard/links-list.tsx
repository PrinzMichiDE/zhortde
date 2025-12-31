'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrashIcon, EyeIcon, ClipboardIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { links } from '@/lib/db/schema';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

type LinkType = typeof links.$inferSelect;

interface LinksListProps {
  links: LinkType[];
}

export function LinksList({ links: initialLinks }: LinksListProps) {
  const [links, setLinks] = useState(initialLinks);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [editingLink, setEditingLink] = useState<LinkType | null>(null);
  const [editForm, setEditForm] = useState({ longUrl: '', isPublic: false, shortCode: '' });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const t = useTranslations('dashboard');
  const tc = useTranslations('common');
  const tLinkForm = useTranslations('linkForm');

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

  const openEdit = (link: LinkType) => {
    setEditError(null);
    setEditingLink(link);
    setEditForm({
      longUrl: link.longUrl,
      shortCode: link.shortCode,
      isPublic: link.isPublic,
    });
  };

  const closeEdit = () => {
    setEditError(null);
    setEditingLink(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;

    setSaving(true);
    setEditError(null);

    const payload = {
      longUrl: editForm.longUrl.trim(),
      shortCode: editForm.shortCode.trim().toLowerCase(),
      isPublic: editForm.isPublic,
    };

    try {
      const response = await fetch(`/api/links/${editingLink.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setEditError(typeof data?.error === 'string' ? data.error : tc('error'));
        return;
      }

      setLinks((prev) => prev.map((l) => (l.id === data.id ? data : l)));
      closeEdit();
    } catch {
      setEditError(tc('error'));
    } finally {
      setSaving(false);
    }
  };

  const isValidUrl = (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const normalizedShortCode = editForm.shortCode.trim().toLowerCase();
  const shortCodeIsValid = normalizedShortCode.length > 0 && /^[a-z0-9-_]+$/.test(normalizedShortCode);
  const longUrlIsValid = editForm.longUrl.trim().length > 0 && isValidUrl(editForm.longUrl.trim());

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
    <>
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
                    className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), "h-11 w-11 text-primary hover:text-primary/80")}
                  >
                    <EyeIcon className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(link)}
                    className="h-11 w-11 text-muted-foreground hover:text-foreground"
                    title={tc('edit') as string}
                    aria-label={`${t('link')} ${link.shortCode} ${tc('edit')}`}
                  >
                    <PencilIcon className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(link.id)}
                    disabled={deleting === link.id}
                    className="h-11 w-11 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
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

      {/* Edit modal */}
      {editingLink && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-link-title"
          onMouseDown={(e) => {
            // click outside closes
            if (e.target === e.currentTarget) closeEdit();
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 id="edit-link-title" className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {tc('edit')} {t('link')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('shortCode')}: <span className="font-mono font-semibold">{editingLink.shortCode}</span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                onClick={closeEdit}
                title={tc('close') as string}
                aria-label={tc('close') as string}
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>

            {editError && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-5">
              <Input
                label={t('targetUrl') as string}
                value={editForm.longUrl}
                onChange={(e) => setEditForm((prev) => ({ ...prev, longUrl: e.target.value }))}
                placeholder="https://example.com"
                required
                error={editForm.longUrl.trim().length > 0 && !longUrlIsValid}
                errorText={t('invalidUrl') as string}
              />

              <Input
                label={t('shortCode') as string}
                value={editForm.shortCode}
                onChange={(e) => setEditForm((prev) => ({ ...prev, shortCode: e.target.value }))}
                required
                helperText={tLinkForm('customCodeHelper') as string}
                error={editForm.shortCode.trim().length > 0 && !shortCodeIsValid}
                errorText={t('invalidShortCode') as string}
              />

              <div className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4">
                <input
                  id="edit-link-public"
                  type="checkbox"
                  checked={editForm.isPublic}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, isPublic: e.target.checked }))}
                  className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label htmlFor="edit-link-public" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t('publicVisible')}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {editForm.isPublic ? t('public') : t('private')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeEdit} fullWidth>
                  {tc('cancel')}
                </Button>
                <Button
                  type="submit"
                  loading={saving}
                  fullWidth
                  disabled={!longUrlIsValid || !shortCodeIsValid}
                >
                  {t('saveChanges')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
