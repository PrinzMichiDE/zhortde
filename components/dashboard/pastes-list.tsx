'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrashIcon, EyeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { pastes } from '@/lib/db/schema';

type Paste = typeof pastes.$inferSelect;

interface PastesListProps {
  pastes: Paste[];
}

export function PastesList({ pastes: initialPastes }: PastesListProps) {
  const [pastes, setPastes] = useState(initialPastes);
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm('Möchten Sie dieses Paste wirklich löschen?')) {
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
        alert('Fehler beim Löschen des Paste');
      }
    } catch (error) {
      alert('Fehler beim Löschen des Paste');
    } finally {
      setDeleting(null);
    }
  };

  if (pastes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>Sie haben noch keine Pastes erstellt.</p>
        <Link
          href="/paste/create"
          className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
        >
          Erstellen Sie Ihr erstes Paste
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
              Slug
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Vorschau
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Sprache
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Aktionen
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
                  {paste.isPublic ? 'Öffentlich' : 'Privat'}
                </span>
              </td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-3">
                  <Link
                    href={`/p/${paste.slug}`}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                    title="Ansehen"
                    aria-label={`Paste ${paste.slug} ansehen`}
                  >
                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                  </Link>
                  <a
                    href={`/p/${paste.slug}/raw`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded"
                    title="Raw anzeigen"
                    aria-label={`Raw Version von ${paste.slug} anzeigen`}
                  >
                    <DocumentTextIcon className="h-5 w-5" aria-hidden="true" />
                  </a>
                  <button
                    onClick={() => handleDelete(paste.id)}
                    disabled={deleting === paste.id}
                    className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                    title="Löschen"
                    aria-label={`Paste ${paste.slug} löschen`}
                  >
                    <TrashIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
