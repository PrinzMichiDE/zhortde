'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrashIcon, EyeIcon, DocumentTextIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { pastes } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';

type Paste = typeof pastes.$inferSelect;

interface PastesListProps {
  pastes: Paste[];
}

export function PastesList({ pastes: initialPastes }: PastesListProps) {
  const [pastes, setPastes] = useState(initialPastes);
  const [deleting, setDeleting] = useState<number | null>(null);
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');
  
  // Edit state
  const [editingPaste, setEditingPaste] = useState<Paste | null>(null);
  const [editForm, setEditForm] = useState({ content: '', isPublic: false, language: '' });
  const [saving, setSaving] = useState(false);

  const handleDelete = async (id: number) => {
    if (!confirm(t('deletePasteConfirm'))) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/pastes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPastes(pastes.filter(paste => paste.id !== id));
      } else {
        alert(t('deletePasteError'));
      }
    } catch (error) {
      alert(t('deletePasteError'));
    } finally {
      setDeleting(null);
    }
  };

  const handleEditClick = (paste: Paste) => {
    setEditingPaste(paste);
    setEditForm({
      content: paste.content,
      isPublic: paste.isPublic,
      language: paste.syntaxHighlightingLanguage || ''
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPaste) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/pastes/${editingPaste.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editForm.content,
          isPublic: editForm.isPublic,
          syntaxHighlightingLanguage: editForm.language
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Aktualisieren');
      }

      const updatedPaste = await response.json();
      
      // Update local state
      setPastes(pastes.map(p => p.id === updatedPaste.id ? updatedPaste : p));
      setEditingPaste(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Fehler beim Aktualisieren';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  if (pastes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>{t('noPastes')}</p>
        <Link
          href="/paste/create"
          className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
        >
          {t('createFirstPaste')}
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('slug')}
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('preview')}
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('language')}
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('status')}
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('actions')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {pastes.map((paste) => (
            <tr key={paste.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <code className="text-sm font-mono text-indigo-600 dark:text-indigo-400">
                  {paste.slug}
                </code>
              </td>
              <td className="px-4 sm:px-6 py-4">
                <div className="text-sm text-gray-900 dark:text-gray-100 max-w-md truncate font-mono">
                  {paste.content.substring(0, 100)}
                  {paste.content.length > 100 ? '...' : ''}
                </div>
              </td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {paste.syntaxHighlightingLanguage || '-'}
                </div>
              </td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  paste.isPublic
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                }`}>
                  {paste.isPublic ? t('public') : t('private')}
                </span>
              </td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleEditClick(paste)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                    title={tc('edit') as string}
                    aria-label={`${t('paste')} ${paste.slug} ${tc('edit')}`}
                  >
                    <PencilIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <Link
                    href={`/p/${paste.slug}`}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                    title={t('view') as string}
                    aria-label={`${t('paste')} ${paste.slug} ${t('view')}`}
                  >
                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                  </Link>
                  <a
                    href={`/p/${paste.slug}/raw`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded"
                    title={t('rawView') as string}
                    aria-label={`${t('rawView')} ${paste.slug}`}
                  >
                    <DocumentTextIcon className="h-5 w-5" aria-hidden="true" />
                  </a>
                  <button
                    onClick={() => handleDelete(paste.id)}
                    disabled={deleting === paste.id}
                    className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                    title={tc('delete') as string}
                    aria-label={`${t('paste')} ${paste.slug} ${tc('delete')}`}
                  >
                    <TrashIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Modal */}
      {editingPaste && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('editPaste')}</h3>
              <button onClick={() => setEditingPaste(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('content')}
                </label>
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                  className="w-full h-64 p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('syntaxLanguage') as string}
                  value={editForm.language}
                  onChange={(e) => setEditForm({...editForm, language: e.target.value})}
                  placeholder="javascript, python, css"
                />
                
                <div className="flex items-center gap-2 pt-8">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={editForm.isPublic}
                    onChange={(e) => setEditForm({...editForm, isPublic: e.target.checked})}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
                    {t('publicVisible')}
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingPaste(null)}>
                  {tc('cancel')}
                </Button>
                <Button type="submit" loading={saving}>
                  {t('saveChanges')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
